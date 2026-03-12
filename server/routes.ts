import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import { hashPassword, comparePasswords } from "./auth";
import { fireCampaignTrigger } from "./campaigns";
import type { User } from "@shared/schema";

// ========== BADGE DEFINITIONS ==========
const BADGE_DEFINITIONS = [
  { key: "first_course", name: "Graduate", description: "Complete your first course", emoji: "🎓" },
  { key: "mini_learner", name: "Mini Learner", description: "Complete 2 courses", emoji: "📚" },
  { key: "mini_pro", name: "Mini Pro", description: "Complete 3 courses", emoji: "⭐" },
  { key: "mini_scholar", name: "Mini Scholar", description: "Complete 5 courses", emoji: "🦉" },
  { key: "mini_expert", name: "Mini Expert", description: "Complete all courses in a pathway", emoji: "🏆" },
  { key: "mini_master", name: "Mini Master", description: "Complete 10 courses", emoji: "👑" },
  { key: "quiz_ace", name: "Quiz Ace", description: "Score 100% on a quiz", emoji: "🎯" },
  { key: "speed_runner", name: "Speed Runner", description: "Complete a course within 24 hours of enrolling", emoji: "⚡" },
  { key: "perfectionist", name: "Perfectionist", description: "Complete a course with every lesson finished", emoji: "💎" },
  { key: "certified", name: "Certified", description: "Earn 3 certificates", emoji: "📜" },
  { key: "hat_trick", name: "Hat Trick", description: "Complete 3 courses in one week", emoji: "🎩" },
  { key: "knowledge_seeker", name: "Knowledge Seeker", description: "Enroll in 5 different courses", emoji: "🔍" },
];

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// ========== HELPERS ==========

function parseIdParam(value: string | string[]): number | null {
  const str = Array.isArray(value) ? value[0] : value;
  if (!str) return null;
  const n = parseInt(str, 10);
  return isNaN(n) ? null : n;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "coursemini-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // ========== RATE LIMITERS ==========
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again after 15 minutes" },
  });

  const promoteAdminLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many promotion attempts, please try again later" },
  });

  const trackRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const analyticsRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }

  async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return res.status(403).json({ message: "Forbidden" });
    }
    (req as Request & { currentUser: User }).currentUser = user;
    next();
  }

  // Helper: create a notification
  async function notify(userId: number, title: string, message: string, type: "INFO" | "SUCCESS" | "WARNING" = "INFO") {
    try {
      await storage.createNotification({ userId, title, message, type, isRead: false });
    } catch (e) {
      // Non-fatal
    }
  }

  // ========== AUTH ==========
  // Step 1: Start registration — create unverified account, send email code
  app.post("/api/auth/register", authRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "A valid email is required" });
      }
      if (!password || typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await storage.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      // Auto-generate a unique username from email
      const baseUsername = normalizedEmail.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || "user";
      let username = baseUsername;
      let suffix = 1;
      while (await storage.getUserByUsername(username)) {
        username = `${baseUsername}${suffix++}`;
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name: username,
        email: normalizedEmail,
        role: "STUDENT",
        emailVerified: false,
        phoneVerified: false,
      } as any);

      // Generate 6-digit code and store it
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await storage.createEmailVerification(user.id, code, expiresAt);

      // In development, log the code. In production, send email.
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n📧 Email verification code for ${normalizedEmail}: ${code}\n`);
      }

      req.session.userId = user.id;
      fireCampaignTrigger("USER_SIGNUP", user.id).catch(() => {});
      storage.fireEmailAutomation("user_signup", user.id, {}).catch(() => {});
      res.json({ userId: user.id, step: "verify-email" });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // Step 2: Verify email with code
  app.post("/api/auth/verify-email", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ message: "Verification code is required" });
      }
      const verification = await storage.getLatestEmailVerification(req.session.userId!);
      if (!verification) {
        return res.status(400).json({ message: "No verification code found. Please restart registration." });
      }
      if (verification.usedAt) {
        return res.status(400).json({ message: "This code has already been used." });
      }
      if (new Date() > verification.expiresAt) {
        return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
      }
      if (verification.code !== code.trim()) {
        return res.status(400).json({ message: "Incorrect verification code." });
      }
      await storage.markEmailVerificationUsed(verification.id);
      await storage.updateUser(req.session.userId!, { emailVerified: true } as any);
      fireCampaignTrigger("EMAIL_VERIFIED", req.session.userId!).catch(() => {});
      res.json({ ok: true, step: "phone" });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // Resend email code
  app.post("/api/auth/resend-email-code", requireAuth, async (req, res) => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await storage.createEmailVerification(req.session.userId!, code, expiresAt);
      const user = await storage.getUser(req.session.userId!);
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n📧 Email verification code for ${user?.email}: ${code}\n`);
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // Step 3: Send phone verification code
  app.post("/api/auth/send-phone-code", requireAuth, async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
        return res.status(400).json({ message: "A valid phone number is required" });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await storage.createPhoneVerification(req.session.userId!, phone.trim(), code, expiresAt);
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n📱 SMS verification code for ${phone.trim()}: ${code}\n`);
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // Step 4: Verify phone code
  app.post("/api/auth/verify-phone", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ message: "Verification code is required" });
      }
      const verification = await storage.getLatestPhoneVerification(req.session.userId!);
      if (!verification) {
        return res.status(400).json({ message: "No phone verification found. Please request a code." });
      }
      if (verification.usedAt) {
        return res.status(400).json({ message: "This code has already been used." });
      }
      if (new Date() > verification.expiresAt) {
        return res.status(400).json({ message: "Code has expired. Please request a new one." });
      }
      if (verification.code !== code.trim()) {
        return res.status(400).json({ message: "Incorrect verification code." });
      }
      await storage.markPhoneVerificationUsed(verification.id);
      await storage.updateUser(req.session.userId!, { phone: verification.phone, phoneVerified: true } as any);
      res.json({ ok: true, step: "profile" });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // Step 5: Complete profile
  app.post("/api/auth/complete-profile", requireAuth, async (req, res) => {
    try {
      const { name, country, stateRegion, dateOfBirth } = req.body;
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ message: "Full name must be at least 2 characters" });
      }
      if (!country || typeof country !== "string") {
        return res.status(400).json({ message: "Country is required" });
      }
      if (!stateRegion || typeof stateRegion !== "string") {
        return res.status(400).json({ message: "State/region is required" });
      }
      if (!dateOfBirth || typeof dateOfBirth !== "string") {
        return res.status(400).json({ message: "Date of birth is required" });
      }
      await storage.updateUser(req.session.userId!, {
        name: name.trim(),
        country: country.trim(),
        stateRegion: stateRegion.trim(),
        dateOfBirth: dateOfBirth,
      } as any);
      const user = await storage.getUser(req.session.userId!);
      res.json({ id: user!.id, username: user!.username, name: user!.name, email: user!.email, role: user!.role });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/auth/login", authRateLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || typeof username !== "string" || !password || typeof password !== "string") {
        return res.status(400).json({ message: "Username and password are required" });
      }
      // Accept email or username
      const user = username.includes("@")
        ? await storage.getUserByEmail(username.trim().toLowerCase())
        : await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      const ua = req.headers["user-agent"] || "";
      const isMobile = /mobile|android|iphone|ipad/i.test(ua);
      storage.trackEvent(user.id, "login", {
        metadata: {
          userAgent: ua.substring(0, 200),
          isMobile,
          browser: ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || "Unknown",
          platform: req.headers["sec-ch-ua-platform"]?.toString().replace(/"/g, "") || "Unknown"
        }
      }).catch(() => {});
      res.json({ id: user.id, username: user.username, name: user.name, email: user.email, role: user.role });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json({ id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio, emailVerified: (user as any).emailVerified, phoneVerified: (user as any).phoneVerified, country: (user as any).country, stateRegion: (user as any).stateRegion, dateOfBirth: (user as any).dateOfBirth });
  });

  app.post("/api/auth/promote-admin", promoteAdminLimiter, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { secret } = req.body;
      if (!secret || secret !== process.env.ADMIN_SECRET) {
        console.warn(`[SECURITY] Failed promote-admin attempt for userId=${req.session.userId} from IP=${req.ip}`);
        return res.status(403).json({ message: "Invalid admin secret" });
      }
      const user = await storage.updateUserRole(req.session.userId, "ADMIN");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      console.warn(`[SECURITY] User userId=${user.id} (${user.username}) was promoted to ADMIN from IP=${req.ip}`);
      res.json({ id: user.id, username: user.username, name: user.name, email: user.email, role: user.role });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== CATEGORIES ==========
  app.get("/api/categories", async (_req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  // ========== STATS ==========
  app.get("/api/stats", async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // ========== SITE SETTINGS (public) ==========
  app.get("/api/site-settings", async (_req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  });

  // ========== COURSES ==========
  app.get("/api/courses", async (req, res) => {
    const { search, category, level, sort, featured, limit } = req.query;
    const VALID_SORTS = ["popular", "rating", "newest"];
    const VALID_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "all"];

    const courses = await storage.getCourses({
      search: typeof search === "string" ? search.slice(0, 200) : undefined,
      category: typeof category === "string" ? category.slice(0, 100) : undefined,
      level: typeof level === "string" && VALID_LEVELS.includes(level) ? level : undefined,
      sort: typeof sort === "string" && VALID_SORTS.includes(sort) ? sort : undefined,
      featured: featured === "true",
      limit: limit ? (parseIdParam(limit as string) ?? undefined) : undefined,
    });
    res.json(courses);
  });

  app.get("/api/courses/:slug", async (req, res) => {
    const course = await storage.getCourseBySlug(req.params.slug);
    if (!course || course.status !== "PUBLISHED") {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  });

  // ========== ENROLLMENTS ==========
  app.get("/api/enrollments/check/:slug", requireAuth, async (req, res) => {
    const course = await storage.getCourseBySlug(req.params.slug as string);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const enrollment = await storage.getEnrollment(req.session.userId!, course.id);
    if (!enrollment) {
      return res.status(404).json({ message: "Not enrolled" });
    }
    res.json(enrollment);
  });

  app.get("/api/enrollments", requireAuth, async (req, res) => {
    const enrollmentList = await storage.getEnrollmentsByUser(req.session.userId!);
    res.json(enrollmentList);
  });

  app.post("/api/courses/:id/enroll", requireAuth, async (req, res) => {
    try {
      const courseId = parseIdParam(req.params.id);
      if (courseId === null) return res.status(400).json({ message: "Invalid course ID" });

      const existing = await storage.getEnrollment(req.session.userId!, courseId);
      if (existing) {
        return res.status(400).json({ message: "Already enrolled" });
      }

      // Handle coupon
      const { couponCode, refCode } = req.body;
      let couponId: number | undefined;
      let finalAmount = 0;
      let originalAmount = 0;

      const course = await storage.getCourseById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      originalAmount = course.salePrice || course.price || 0;
      finalAmount = originalAmount;

      if (couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        if (!coupon || !coupon.isActive) {
          return res.status(400).json({ message: "Invalid or expired coupon" });
        }
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return res.status(400).json({ message: "Coupon has expired" });
        }
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          return res.status(400).json({ message: "Coupon usage limit reached" });
        }
        if (coupon.courseId && coupon.courseId !== courseId) {
          return res.status(400).json({ message: "Coupon is not valid for this course" });
        }
        couponId = coupon.id;
        if (coupon.type === "PERCENTAGE") {
          finalAmount = originalAmount * (1 - coupon.value / 100);
        } else {
          finalAmount = Math.max(0, originalAmount - coupon.value);
        }
      }

      const enrollment = await storage.createEnrollment({
        userId: req.session.userId!,
        courseId,
        status: "ACTIVE",
        progress: 0,
      });

      // Create order if not free
      if (originalAmount > 0 || couponId) {
        const order = await storage.createOrder({
          userId: req.session.userId!,
          courseId,
          couponId: couponId || null,
          amount: finalAmount,
          originalAmount,
          status: "COMPLETED",
        });

        if (couponId) {
          await storage.incrementCouponUsage(couponId);
        }

        // Notify order placed
        await notify(req.session.userId!, "Order Placed", `You enrolled in "${course.title}" for $${finalAmount.toFixed(2)}`, "SUCCESS");
      }

      // Notify enrollment
      await notify(req.session.userId!, "Enrolled!", `Welcome to "${course.title}"! Start learning now.`, "SUCCESS");
      fireCampaignTrigger("COURSE_ENROLLED", req.session.userId!, courseId).catch(() => {});
      storage.fireEmailAutomation("course_enroll", req.session.userId!, { courseTitle: course.title, courseUrl: `/courses/${course.slug}` }).catch(() => {});
      storage.trackEvent(req.session.userId!, "course_enroll", { courseId: course.id, metadata: { couponCode: req.body.couponCode || null, price: course.price } }).catch(() => {});

      res.json(enrollment);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // Validate coupon
  app.post("/api/coupons/validate", requireAuth, async (req, res) => {
    try {
      const { code, courseId } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ message: "Coupon code is required" });
      }
      const parsedCourseId = courseId != null ? parseIdParam(String(courseId)) : null;
      const coupon = await storage.getCouponByCode(code);
      if (!coupon || !coupon.isActive) {
        return res.status(400).json({ message: "Invalid or inactive coupon" });
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Coupon has expired" });
      }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }
      if (coupon.courseId && coupon.courseId !== parsedCourseId) {
        return res.status(400).json({ message: "Coupon not valid for this course" });
      }
      res.json({ valid: true, coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value } });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== COURSE PLAYER ==========
  app.get("/api/learn/:slug", requireAuth, async (req, res) => {
    const course = await storage.getCourseBySlug(req.params.slug as string);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const user = await storage.getUser(req.session.userId!);
    const isAdmin = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";
    const enrollment = await storage.getEnrollment(req.session.userId!, course.id);
    if (!enrollment && !isAdmin) {
      return res.status(403).json({ message: "Not enrolled" });
    }
    const progress = enrollment ? await storage.getLessonProgressByEnrollment(enrollment.id) : [];
    const progressMap: Record<number, any> = {};
    progress.forEach((p: any) => {
      progressMap[p.lessonId] = p;
    });
    res.json({ course, enrollment: enrollment || null, progressMap, isPreview: isAdmin && !enrollment });
  });

  app.post("/api/lessons/:id/complete", requireAuth, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });

      const user = await storage.getUser(req.session.userId!);
      const isAdmin = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

      const allEnrollments = await storage.getEnrollmentsByUser(req.session.userId!);

      let targetEnrollment: any = null;
      let targetCourse: any = null;
      for (const e of allEnrollments) {
        const courseDetail = await storage.getCourseById(e.courseId);
        if (courseDetail) {
          for (const subj of courseDetail.subjects || []) {
            for (const mod of subj.modules || []) {
              for (const l of mod.lessons || []) {
                if (l.id === lessonId) {
                  targetEnrollment = e;
                  targetCourse = courseDetail;
                  break;
                }
              }
              if (targetEnrollment) break;
            }
            if (targetEnrollment) break;
          }
        }
        if (targetEnrollment) break;
      }

      if (!targetEnrollment) {
        // Admins/instructors previewing courses don't have enrollments — treat as no-op
        if (isAdmin) return res.json({ ok: true, preview: true });
        return res.status(404).json({ message: "Enrollment not found for this lesson" });
      }

      await storage.upsertLessonProgress(targetEnrollment.id, lessonId, "COMPLETED");
      storage.trackEvent(req.session.userId!, "lesson_complete", { courseId: targetCourse?.id, lessonId }).catch(() => {});
      if (targetCourse) {
        const lessonTitle = (() => {
          for (const subj of targetCourse.subjects || []) {
            for (const mod of subj.modules || []) {
              const l = (mod.lessons || []).find((x: any) => x.id === lessonId);
              if (l) return l.title;
            }
          }
          return "a lesson";
        })();
        storage.fireEmailAutomation("lesson_complete", req.session.userId!, { courseTitle: targetCourse.title, lessonTitle, courseUrl: `/courses/${targetCourse.slug}` }).catch(() => {});
      }

      if (targetCourse) {
        let totalLessons = 0;
        for (const subj of targetCourse.subjects || []) {
          for (const mod of subj.modules || []) {
            totalLessons += (mod.lessons || []).length;
          }
        }
        const allProgress = await storage.getLessonProgressByEnrollment(targetEnrollment.id);
        const completedCount = allProgress.filter((p) => p.status === "COMPLETED").length;
        const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

        await storage.updateEnrollment(targetEnrollment.id, {
          progress: progressPercent,
          status: progressPercent >= 100 ? "COMPLETED" : "ACTIVE",
          ...(progressPercent >= 100 ? { completedAt: new Date() } : {}),
        } as any);

        // Issue certificate and notifications on completion
        if (progressPercent >= 100) {
          const existingCert = await storage.getCertificateByUserAndCourse(req.session.userId!, targetEnrollment.courseId);
          if (!existingCert) {
            const cert = await storage.createCertificate(req.session.userId!, targetEnrollment.courseId);
            await notify(req.session.userId!, "Certificate Issued!", `Congratulations! You've completed "${targetCourse.title}" and earned a certificate.`, "SUCCESS");
            // Fire certificate email automation using the cert returned by createCertificate
            if (cert) storage.fireEmailAutomation("certificate_issued", req.session.userId!, { courseTitle: targetCourse.title, certificateUrl: `/certificates/${cert.certificateCode}` }).catch(() => {});
          }
          await notify(req.session.userId!, "Course Completed!", `You've completed "${targetCourse.title}". Great work!`, "SUCCESS");
          fireCampaignTrigger("COURSE_COMPLETED", req.session.userId!, targetEnrollment.courseId).catch(() => {});
          storage.fireEmailAutomation("course_complete", req.session.userId!, { courseTitle: targetCourse.title }).catch(() => {});
          storage.checkAndAwardBadges(req.session.userId!).catch(() => {});

          // ── Pathway automation ──────────────────────────────────────────
          // Capture userId synchronously before the async IIFE runs post-response
          const pathwayUserId = req.session.userId!;
          (async () => {
            try {
              const pathwayEntries = await storage.getPathwaysContainingCourse(targetCourse.id);
              for (const entry of pathwayEntries) {
                // Get all steps in this pathway ordered by position
                const steps = await storage.getPathwaySteps(entry.pathwayId);
                const currentIdx = steps.findIndex((s: any) => s.courseId === targetCourse.id);
                if (currentIdx === -1) continue;

                // Update user's pathway progress
                await storage.upsertUserPathwayProgress(pathwayUserId, entry.pathwayId, currentIdx + 1);

                const nextStep = steps[currentIdx + 1];
                if (nextStep) {
                  // Notify in-app about the next course
                  const nextCourse = await storage.getCourseById(nextStep.courseId);
                  if (nextCourse) {
                    await notify(
                      pathwayUserId,
                      "Next Course Ready!",
                      `You've unlocked the next step in "${entry.pathwayName}": "${nextCourse.title}". Keep going!`,
                      "SUCCESS"
                    );
                    // Fire email automation
                    storage.fireEmailAutomation("pathway_next_course", pathwayUserId, {
                      pathwayName: entry.pathwayName,
                      completedCourse: targetCourse.title,
                      nextCourseTitle: nextCourse.title,
                      nextCourseUrl: `/courses/${nextCourse.slug}`,
                    }).catch(() => {});
                  }
                } else {
                  // Completed the full pathway
                  await notify(
                    pathwayUserId,
                    "Pathway Complete!",
                    `Amazing! You've completed the entire "${entry.pathwayName}" pathway!`,
                    "SUCCESS"
                  );
                  storage.fireEmailAutomation("pathway_complete", pathwayUserId, {
                    pathwayName: entry.pathwayName,
                  }).catch(() => {});
                }
              }
            } catch (err) {
              console.error("[pathway automation] error:", err);
            }
          })();
        }
      }

      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== QUIZ ==========
  app.post("/api/quizzes/:quizId/submit", requireAuth, async (req, res) => {
    try {
      const quizId = parseIdParam(req.params.quizId);
      if (quizId === null) return res.status(400).json({ message: "Invalid quiz ID" });
      const { answers, lessonId } = req.body;
      const result = await storage.submitQuizAttempt(req.session.userId!, quizId, answers);

      // If passed, mark lesson complete
      if (result.passed && lessonId) {
        const allEnrollments = await storage.getEnrollmentsByUser(req.session.userId!);
        for (const e of allEnrollments) {
          const courseDetail = await storage.getCourseById(e.courseId);
          if (courseDetail) {
            let found = false;
            for (const subj of courseDetail.subjects || []) {
              for (const mod of subj.modules || []) {
                for (const l of mod.lessons || []) {
                  if (l.id === lessonId) {
                    found = true;
                    await storage.upsertLessonProgress(e.id, lessonId, "COMPLETED");
                    let totalLessons = 0;
                    for (const s of courseDetail.subjects || []) {
                      for (const m of s.modules || []) {
                        totalLessons += (m.lessons || []).length;
                      }
                    }
                    const allProgress = await storage.getLessonProgressByEnrollment(e.id);
                    const completedCount = allProgress.filter((p) => p.status === "COMPLETED").length;
                    const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
                    await storage.updateEnrollment(e.id, {
                      progress: progressPercent,
                      status: progressPercent >= 100 ? "COMPLETED" : "ACTIVE",
                      ...(progressPercent >= 100 ? { completedAt: new Date() } : {}),
                    } as any);
                    if (progressPercent >= 100) {
                      const existingCert = await storage.getCertificateByUserAndCourse(req.session.userId!, e.courseId);
                      if (!existingCert) {
                        await storage.createCertificate(req.session.userId!, e.courseId);
                        await notify(req.session.userId!, "Certificate Issued!", `Congratulations! You've completed "${courseDetail.title}".`, "SUCCESS");
                      }
                      storage.checkAndAwardBadges(req.session.userId!).catch(() => {});
                    }
                    break;
                  }
                }
                if (found) break;
              }
              if (found) break;
            }
          }
          if (result.passed) break;
        }
      }

      const prevAttempts = await storage.getQuizAttemptCount(req.session.userId!, lessonId ?? 0);
      storage.trackEvent(req.session.userId!, "quiz_submit", { lessonId: lessonId ?? undefined, metadata: { score: result.score, passed: result.passed, attemptNumber: prevAttempts + 1 } }).catch(() => {});
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== BUNDLES (public) ==========
  app.get("/api/bundles", async (_req, res) => {
    const bundleList = await storage.getBundles();
    res.json(bundleList);
  });

  app.get("/api/bundles/:slug", async (req, res) => {
    const bundle = await storage.getBundleBySlug(req.params.slug);
    if (!bundle || !bundle.isActive) {
      return res.status(404).json({ message: "Bundle not found" });
    }
    res.json(bundle);
  });

  app.post("/api/bundles/:id/enroll", requireAuth, async (req, res) => {
    try {
      const bundleId = parseIdParam(req.params.id);
      if (bundleId === null) return res.status(400).json({ message: "Invalid bundle ID" });
      const all = await storage.getAllBundles();
      const bundle = all.find(b => b.id === bundleId);

      if (!bundle) return res.status(404).json({ message: "Bundle not found" });

      const enrolledCourses = [];
      for (const course of bundle.courses || []) {
        const existing = await storage.getEnrollment(req.session.userId!, course.id);
        if (!existing) {
          const enrollment = await storage.createEnrollment({
            userId: req.session.userId!,
            courseId: course.id,
            status: "ACTIVE",
            progress: 0,
          });
          enrolledCourses.push(course.id);
        }
      }

      await notify(req.session.userId!, "Bundle Enrolled!", `You've enrolled in bundle "${bundle.title}" with ${enrolledCourses.length} courses.`, "SUCCESS");

      res.json({ ok: true, enrolledCount: enrolledCourses.length });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== CERTIFICATES ==========
  app.get("/api/admin/certificates", requireAdmin as any, async (req, res) => {
    const allCerts = await storage.getAllCertificates();
    res.json(allCerts);
  });

  app.get("/api/certificates/:code", async (req, res) => {
    const cert = await storage.getCertificateByCode(req.params.code);
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    res.json(cert);
  });

  app.get("/api/my/certificates", requireAuth, async (req, res) => {
    const certs = await storage.getCertificatesByUser(req.session.userId!);
    res.json(certs);
  });

  // ========== BADGES ==========
  app.get("/api/badges/definitions", (_req, res) => {
    res.json(BADGE_DEFINITIONS);
  });

  app.get("/api/my/badges", requireAuth, async (req, res) => {
    try {
      const badges = await storage.getUserBadges(req.session.userId!);
      res.json(badges);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // Student's pathway progress
  app.get("/api/my/pathways", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      // Get all active pathways
      const allPathways = await storage.getPathways();
      const activePathways = allPathways.filter((p: any) => p.isActive);
      // Fetch enrollments once outside the loop to avoid N+1 queries
      const enrollments = await storage.getEnrollmentsByUser(userId);
      const enrolledCourseIds = new Set(enrollments.map((e: any) => e.courseId));
      const result = await Promise.all(
        activePathways.map(async (pathway: any) => {
          const steps = await storage.getPathwaySteps(pathway.id);
          // Only include pathways the user has started or where they're enrolled in any course
          const hasStarted = steps.some((s: any) => enrolledCourseIds.has(s.courseId));
          if (!hasStarted) return null;
          const progress = await storage.getUserPathwayProgress(userId, pathway.id);
          const currentStep = progress?.currentStep ?? 0;
          const nextStep = steps[currentStep];
          const nextCourse = nextStep ? await storage.getCourseById(nextStep.courseId) : null;
          return {
            id: pathway.id,
            name: pathway.name,
            description: pathway.description,
            totalSteps: steps.length,
            currentStep,
            completed: currentStep >= steps.length,
            nextCourse: nextCourse ? { id: nextCourse.id, title: nextCourse.title, slug: nextCourse.slug, thumbnail: nextCourse.thumbnail } : null,
          };
        })
      );
      res.json(result.filter(Boolean));
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== NOTIFICATIONS ==========
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const notifs = await storage.getNotificationsByUser(req.session.userId!);
    res.json(notifs);
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    const count = await storage.getUnreadNotificationCount(req.session.userId!);
    res.json({ count });
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const notifId = parseIdParam(req.params.id);
    if (notifId === null) return res.status(400).json({ message: "Invalid notification ID" });
    await storage.markNotificationRead(notifId, req.session.userId!);
    res.json({ ok: true });
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    await storage.markAllNotificationsRead(req.session.userId!);
    res.json({ ok: true });
  });


  // ========== ADMIN STATS ==========
  app.get("/api/admin/stats", requireAdmin as any, async (req, res) => {
    const user = (req as any).currentUser;
    const stats = await storage.getAdminStats(user.id);
    res.json(stats);
  });

  // ========== ADMIN COURSES ==========
  app.get("/api/admin/courses", requireAdmin as any, async (req, res) => {
    const user = (req as any).currentUser;
    const instructorCourses = user.role === "ADMIN"
      ? await storage.getCourses({ allStatuses: true })
      : await storage.getCoursesByInstructor(user.id);
    res.json(instructorCourses);
  });

  app.get("/api/admin/courses/:id", requireAdmin as any, async (req, res) => {
    const user = (req as any).currentUser as User;
    const courseId = parseIdParam(req.params.id);
    if (courseId === null) return res.status(400).json({ message: "Invalid course ID" });
    const course = await storage.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (course.instructorId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(course);
  });

  app.post("/api/admin/courses", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser as User;
      if (!req.body.title || typeof req.body.title !== "string" || req.body.title.trim().length < 3) {
        return res.status(400).json({ message: "Course title must be at least 3 characters" });
      }
      const course = await storage.createCourse({
        ...req.body,
        title: req.body.title.trim(),
        instructorId: user.id,
      });
      res.json(course);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.patch("/api/admin/courses/:id", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser as User;
      const courseId = parseIdParam(req.params.id);
      if (courseId === null) return res.status(400).json({ message: "Invalid course ID" });
      const existing = await storage.getCourseById(courseId);
      if (!existing || (existing.instructorId !== user.id && user.role !== "ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const course = await storage.updateCourse(courseId, req.body);
      res.json(course);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ─── File upload ──────────────────────────────────────────────────────────────
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Only image files are allowed"));
    },
  });

  app.post("/api/admin/upload", requireAdmin as any, upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // ─── Course duplication ────────────────────────────────────────────────────────
  app.post("/api/admin/courses/:id/duplicate", requireAdmin as any, async (req: any, res) => {
    try {
      const courseId = parseIdParam(req.params.id);
      if (courseId === null) return res.status(400).json({ message: "Invalid ID" });
      const user = req.currentUser as User;
      const source = await storage.getCourseById(courseId);
      if (!source) return res.status(404).json({ message: "Course not found" });
      if (source.instructorId !== user.id && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Create the new course as a draft
      const newCourse = await storage.createCourse({
        title: source.title + " (Copy)",
        slug: source.slug + "-copy-" + Date.now(),
        description: source.description,
        shortDescription: source.shortDescription,
        thumbnail: source.thumbnail,
        price: source.price,
        salePrice: source.salePrice,
        status: "DRAFT",
        categoryId: source.categoryId,
        instructorId: user.id,
        level: source.level,
        language: source.language,
        isFree: source.isFree,
        learningOutcomes: source.learningOutcomes,
        prerequisites: source.prerequisites,
      });

      // Copy subjects → modules → lessons → blocks
      for (const subj of (source.subjects ?? []).sort((a: any, b: any) => a.position - b.position)) {
        const newSubj = await storage.createSubject({
          courseId: newCourse.id,
          title: subj.title,
          description: subj.description,
          position: subj.position,
        });
        for (const mod of (subj.modules ?? []).sort((a: any, b: any) => a.position - b.position)) {
          const newMod = await storage.createModule({
            subjectId: newSubj.id,
            title: mod.title,
            description: mod.description,
            position: mod.position,
          });
          for (const les of (mod.lessons ?? []).sort((a: any, b: any) => a.position - b.position)) {
            const newLesson = await storage.createLesson({
              moduleId: newMod.id,
              title: les.title,
              type: les.type,
              position: les.position,
              videoUrl: les.videoUrl,
              content: les.content,
              duration: les.duration,
              dripDays: les.dripDays,
              isFree: les.isFree,
              isPreview: les.isPreview,
              minReadSeconds: les.minReadSeconds,
              minVideoPercent: les.minVideoPercent,
              minQuizScore: les.minQuizScore,
            });
            const blocks = await storage.getLessonBlocks(les.id);
            for (const block of blocks) {
              await storage.createLessonBlock({
                lessonId: newLesson.id,
                type: block.type,
                content: block.content,
                position: block.position,
                settings: block.settings,
              });
            }
          }
        }
      }

      res.json({ id: newCourse.id, title: newCourse.title });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ─── AI outline generator ──────────────────────────────────────────────────────
  app.post("/api/admin/lessons/:id/generate-outline", requireAdmin as any, async (req: any, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) return res.status(400).json({ message: "Invalid ID" });
      const { topic } = req.body;
      if (!topic?.trim()) return res.status(400).json({ message: "Topic is required" });

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(503).json({ message: "AI features require ANTHROPIC_API_KEY to be set in your environment." });

      const client = new Anthropic({ apiKey });

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are a course content expert. Generate a structured lesson outline for the following topic.

Topic: ${topic}

Return a JSON array of content blocks. Each block must be one of these types with the specified content structure:

- HEADING: { "text": "...", "level": "h2" | "h3" }
- TEXT: { "html": "<p>paragraph content here</p>" }
- CALLOUT: { "type": "info" | "warning" | "success", "title": "...", "body": "..." }
- BULLETED_LIST: { "items": ["item1", "item2", ...] }
- NUMBERED_LIST: { "items": ["item1", "item2", ...] }
- CODE: { "language": "javascript" | "python" | "html" | "css" | "bash" | "sql" | "typescript", "code": "..." }
- KNOWLEDGE_CHECK: { "question": "...", "options": ["a", "b", "c", "d"], "correctIndex": 0, "explanation": "..." }

Return ONLY a valid JSON array, no markdown, no explanation. Example format:
[
  { "type": "HEADING", "content": { "text": "Introduction", "level": "h2" } },
  { "type": "TEXT", "content": { "html": "<p>Content here...</p>" } }
]

Create a comprehensive, educational lesson with 8-14 blocks. Include a mix of content types appropriate for the topic. End with a KNOWLEDGE_CHECK block.`,
          },
        ],
      });

      const raw = (message.content[0] as any).text;
      // Extract JSON array from response
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return res.status(500).json({ message: "AI returned unexpected format" });

      const blocks: any[] = JSON.parse(match[0]);

      // Insert blocks into the lesson
      const existing = await storage.getLessonBlocks(lessonId);
      const startPosition = existing.length;

      const created = [];
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const block = await storage.createLessonBlock({
          lessonId,
          type: b.type,
          content: JSON.stringify(b.content),
          position: startPosition + i,
          settings: "{}",
        });
        created.push(block);
      }

      res.json({ created: created.length, blocks: created });
    } catch (e: any) {
      console.error("[AI outline] error:", e);
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  async function verifyCourseOwnership(courseId: number, user: User): Promise<boolean> {
    if (user.role === "ADMIN") return true;
    const course = await storage.getCourseById(courseId);
    return course?.instructorId === user.id;
  }

  async function verifySubjectOwnership(subjectId: number, user: User): Promise<boolean> {
    if (user.role === "ADMIN") return true;
    const instructorCourses = await storage.getCoursesByInstructor(user.id);
    for (const c of instructorCourses) {
      const subs = await storage.getSubjectsByCourse(c.id);
      if (subs.some(s => s.id === subjectId)) return true;
    }
    return false;
  }

  app.post("/api/admin/subjects", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser as User;
      const courseId = parseIdParam(String(req.body.courseId));
      if (courseId === null) return res.status(400).json({ message: "Invalid course ID" });
      if (!await verifyCourseOwnership(courseId, user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const subject = await storage.createSubject({ ...req.body, courseId });
      res.json(subject);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.patch("/api/admin/subjects/:id", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser as User;
      const subjectId = parseIdParam(req.params.id);
      if (subjectId === null) return res.status(400).json({ message: "Invalid subject ID" });
      if (!await verifySubjectOwnership(subjectId, user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const subject = await storage.updateSubject(subjectId, req.body);
      res.json(subject);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.delete("/api/admin/subjects/:id", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser as User;
      const subjectId = parseIdParam(req.params.id);
      if (subjectId === null) return res.status(400).json({ message: "Invalid subject ID" });
      if (!await verifySubjectOwnership(subjectId, user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteSubject(subjectId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/admin/modules", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser as User;
      const subjectId = parseIdParam(String(req.body.subjectId));
      if (subjectId === null) return res.status(400).json({ message: "Invalid subject ID" });
      if (!await verifySubjectOwnership(subjectId, user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const mod = await storage.createModule({ ...req.body, subjectId });
      res.json(mod);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.patch("/api/admin/modules/:id", requireAdmin as any, async (req, res) => {
    try {
      const modId = parseIdParam(req.params.id);
      if (modId === null) return res.status(400).json({ message: "Invalid module ID" });
      const mod = await storage.updateModule(modId, req.body);
      res.json(mod);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.delete("/api/admin/modules/:id", requireAdmin as any, async (req, res) => {
    try {
      const modId = parseIdParam(req.params.id);
      if (modId === null) return res.status(400).json({ message: "Invalid module ID" });
      await storage.deleteModule(modId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/admin/lessons", requireAdmin as any, async (req, res) => {
    try {
      const lesson = await storage.createLesson(req.body);
      res.json(lesson);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.patch("/api/admin/lessons/:id", requireAdmin as any, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });
      const lesson = await storage.updateLesson(lessonId, req.body);
      res.json(lesson);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.delete("/api/admin/lessons/:id", requireAdmin as any, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });
      await storage.deleteLesson(lessonId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/admin/lessons/:id/duplicate", requireAuth, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const lessonId = parseIdParam(req.params.id);
    if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });
    try {
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });
      // Create duplicate lesson
      const newLesson = await storage.createLesson({
        moduleId: lesson.moduleId,
        title: lesson.title + " (copy)",
        type: lesson.type,
        position: lesson.position + 0.5, // insert after original, will be normalized
        videoUrl: lesson.videoUrl || null,
        content: lesson.content || null,
        duration: lesson.duration || null,
        dripDays: lesson.dripDays || null,
        isFree: lesson.isFree ?? false,
        isPreview: lesson.isPreview ?? false,
      });
      // Copy blocks
      const blocks = await storage.getLessonBlocks(lessonId);
      for (const block of blocks) {
        await storage.createLessonBlock({
          lessonId: newLesson.id,
          type: block.type,
          content: block.content,
          position: block.position,
          settings: block.settings,
        });
      }
      res.json(newLesson);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/admin/modules/:id/lessons/reorder", requireAuth, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const moduleId = parseIdParam(req.params.id);
    if (moduleId === null) return res.status(400).json({ message: "Invalid module ID" });
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: "orderedIds required" });
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await storage.updateLesson(orderedIds[i], { position: i });
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/lessons/:id/view", requireAuth, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });
      const allEnrollments = await storage.getEnrollmentsByUser(req.session.userId!);
      let targetCourseForView: any = null;
      for (const enrollment of allEnrollments) {
        const course = await storage.getCourseById(enrollment.courseId);
        if (!course) continue;
        for (const subj of course.subjects || []) {
          for (const mod of subj.modules || []) {
            for (const l of mod.lessons || []) {
              if (l.id === lessonId) {
                targetCourseForView = course;
                // Mark as IN_PROGRESS if not already completed
                const existing = await storage.getLessonProgress(enrollment.id, lessonId);
                if (!existing || existing.status === "NOT_STARTED") {
                  await storage.upsertLessonProgress(enrollment.id, lessonId, "IN_PROGRESS");
                }
                storage.trackEvent(req.session.userId!, "lesson_view", { courseId: course.id, lessonId }).catch(() => {});
                return res.json({ ok: true });
              }
            }
          }
        }
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== ADMIN QUIZ ==========
  app.get("/api/admin/lessons/:id/quiz", requireAdmin as any, async (req, res) => {
    const lessonId = parseIdParam(req.params.id);
    if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });
    const quiz = await storage.getQuizByLesson(lessonId);
    res.json(quiz || null);
  });

  app.post("/api/admin/lessons/:id/quiz", requireAdmin as any, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });
      const { questions } = req.body;
      await storage.upsertQuiz(lessonId, questions);
      const quiz = await storage.getQuizByLesson(lessonId);
      res.json(quiz);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== ADMIN ANALYTICS ==========
  app.get("/api/admin/analytics", analyticsRateLimiter, requireAdmin as any, async (req, res) => {
    try {
      const currentUser = (req as any).currentUser;
      if (currentUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Only admins can access platform analytics" });
      }
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== ADMIN STUDENTS ==========
  app.get("/api/admin/students", requireAdmin as any, async (req, res) => {
    const students = await storage.getStudents();
    res.json(students);
  });

  app.get("/api/admin/students/:id", requireAdmin as any, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      if (studentId === null) return res.status(400).json({ message: "Invalid student ID" });
      const user = await storage.getUser(studentId);
      if (!user) return res.status(404).json({ message: "Student not found" });
      const enrollments = await storage.getEnrollmentsByUser(studentId);
      const certificates = await storage.getCertificatesByUser(studentId);
      const badges = await storage.getUserBadges(studentId);
      const { password: _pw, ...safeUser } = user as any;
      res.json({ user: safeUser, enrollments, certificates, badges });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== ADMIN USERS ==========
  app.get("/api/admin/users", requireAdmin as any, async (req, res) => {
    const currentUser = (req as any).currentUser;
    if (currentUser.role !== "ADMIN") {
      return res.status(403).json({ message: "Only super admins can manage users" });
    }
    const allUsers = await storage.getUsers();
    res.json(allUsers.map(u => ({ id: u.id, username: u.username, name: u.name, email: u.email, role: u.role })));
  });

  app.patch("/api/admin/users/:id/role", requireAdmin as any, async (req, res) => {
    try {
      const currentUser = (req as any).currentUser as User;
      if (currentUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Only super admins can manage users" });
      }
      const userId = parseIdParam(req.params.id);
      if (userId === null) return res.status(400).json({ message: "Invalid user ID" });
      const { role } = req.body;
      if (!["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updated = await storage.updateUserRole(userId, role);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: updated.id, username: updated.username, name: updated.name, email: updated.email, role: updated.role });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== ADMIN COUPONS ==========
  app.get("/api/admin/coupons", requireAdmin as any, async (req, res) => {
    const couponList = await storage.getCoupons();
    res.json(couponList);
  });

  app.post("/api/admin/coupons", requireAdmin as any, async (req, res) => {
    try {
      const coupon = await storage.createCoupon(req.body);
      res.json(coupon);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.delete("/api/admin/coupons/:id", requireAdmin as any, async (req, res) => {
    try {
      const couponId = parseIdParam(req.params.id);
      if (couponId === null) return res.status(400).json({ message: "Invalid coupon ID" });
      await storage.deleteCoupon(couponId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== ADMIN ORDERS ==========
  app.get("/api/admin/orders", requireAdmin as any, async (req, res) => {
    const orderList = await storage.getOrders();
    res.json(orderList);
  });

  app.get("/api/admin/orders/stats", requireAdmin as any, async (req, res) => {
    const orderList = await storage.getOrders();
    const total = orderList.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
    const completed = orderList.filter((o: any) => o.status === "COMPLETED");
    res.json({
      totalOrders: orderList.length,
      completedOrders: completed.length,
      totalRevenue: total,
      averageOrderValue: orderList.length ? total / orderList.length : 0,
    });
  });

  // ========== ADMIN BUNDLES ==========
  app.get("/api/admin/bundles", requireAdmin as any, async (req, res) => {
    const bundleList = await storage.getAllBundles();
    res.json(bundleList);
  });

  app.post("/api/admin/bundles", requireAdmin as any, async (req, res) => {
    try {
      const bundle = await storage.createBundle(req.body);
      res.json(bundle);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.patch("/api/admin/bundles/:id", requireAdmin as any, async (req, res) => {
    try {
      const bundleId = parseIdParam(req.params.id);
      if (bundleId === null) return res.status(400).json({ message: "Invalid bundle ID" });
      const bundle = await storage.updateBundle(bundleId, req.body);
      res.json(bundle);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.delete("/api/admin/bundles/:id", requireAdmin as any, async (req, res) => {
    try {
      const bundleId = parseIdParam(req.params.id);
      if (bundleId === null) return res.status(400).json({ message: "Invalid bundle ID" });
      await storage.deleteBundle(bundleId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/admin/bundles/:id/courses", requireAdmin as any, async (req, res) => {
    try {
      const bundleId = parseIdParam(req.params.id);
      const courseId = parseIdParam(String(req.body.courseId));
      if (bundleId === null || courseId === null) return res.status(400).json({ message: "Invalid bundle or course ID" });
      await storage.addCourseToBundle(bundleId, courseId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.delete("/api/admin/bundles/:id/courses/:courseId", requireAdmin as any, async (req, res) => {
    try {
      const bundleId = parseIdParam(req.params.id);
      const courseId = parseIdParam(req.params.courseId);
      if (bundleId === null || courseId === null) return res.status(400).json({ message: "Invalid bundle or course ID" });
      await storage.removeCourseFromBundle(bundleId, courseId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== ADMIN SITE SETTINGS ==========
  app.post("/api/admin/site-settings", requireAdmin as any, async (req, res) => {
    try {
      const settings = req.body as Record<string, string>;
      for (const [key, value] of Object.entries(settings)) {
        await storage.upsertSiteSetting(key, value);
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== ADMIN GROUPS ==========
  app.get("/api/admin/groups", requireAdmin as any, async (req, res) => {
    const groups = await storage.getStudentGroups();
    res.json(groups);
  });

  app.post("/api/admin/groups", requireAdmin as any, async (req, res) => {
    try {
      const group = await storage.createStudentGroup(req.body);
      res.json(group);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.patch("/api/admin/groups/:id", requireAdmin as any, async (req, res) => {
    try {
      const groupId = parseIdParam(req.params.id);
      if (groupId === null) return res.status(400).json({ message: "Invalid group ID" });
      const group = await storage.updateStudentGroup(groupId, req.body);
      res.json(group);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.delete("/api/admin/groups/:id", requireAdmin as any, async (req, res) => {
    try {
      const groupId = parseIdParam(req.params.id);
      if (groupId === null) return res.status(400).json({ message: "Invalid group ID" });
      await storage.deleteStudentGroup(groupId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/admin/groups/:id/members", requireAdmin as any, async (req, res) => {
    try {
      const groupId = parseIdParam(req.params.id);
      const userId = parseIdParam(String(req.body.userId));
      if (groupId === null || userId === null) return res.status(400).json({ message: "Invalid group or user ID" });
      await storage.addStudentToGroup(groupId, userId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.delete("/api/admin/groups/:id/members/:userId", requireAdmin as any, async (req, res) => {
    try {
      const groupId = parseIdParam(req.params.id);
      const userId = parseIdParam(req.params.userId);
      if (groupId === null || userId === null) return res.status(400).json({ message: "Invalid group or user ID" });
      await storage.removeStudentFromGroup(groupId, userId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  // ========== LESSON BLOCKS ==========
  app.get("/api/lessons/:id/blocks", async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });
      const blocks = await storage.getLessonBlocks(lessonId);
      res.json(blocks);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/lessons/:id/blocks", requireAdmin as any, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });
      const { type, content, position, settings } = req.body;
      const block = await storage.createLessonBlock({
        lessonId,
        type,
        content: content || "{}",
        position: position ?? 0,
        settings: settings || "{}",
      });
      res.json(block);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.patch("/api/lessons/blocks/:blockId", requireAdmin as any, async (req, res) => {
    try {
      const blockId = parseIdParam(req.params.blockId);
      if (blockId === null) return res.status(400).json({ message: "Invalid block ID" });
      const block = await storage.updateLessonBlock(blockId, req.body);
      res.json(block);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.delete("/api/lessons/blocks/:blockId", requireAdmin as any, async (req, res) => {
    try {
      const blockId = parseIdParam(req.params.blockId);
      if (blockId === null) return res.status(400).json({ message: "Invalid block ID" });
      await storage.deleteLessonBlock(blockId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/lessons/:id/blocks/reorder", requireAdmin as any, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) return res.status(400).json({ message: "Invalid lesson ID" });
      const { orderedIds } = req.body;
      await storage.reorderLessonBlocks(lessonId, orderedIds);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });

  app.post("/api/lessons/blocks/:blockId/duplicate", requireAdmin as any, async (req, res) => {
    try {
      const blockId = parseIdParam(req.params.blockId);
      if (blockId === null) return res.status(400).json({ message: "Invalid block ID" });
      const block = await storage.duplicateLessonBlock(blockId);
      res.json(block);
    } catch (e: any) {
      res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message });
    }
  });


  // ========== EMAIL CAMPAIGNS ==========
  app.get("/api/admin/campaigns", requireAdmin as any, async (_req, res) => {
    try {
      const campaigns = await storage.getCampaignStats();
      res.json(campaigns);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.post("/api/admin/campaigns", requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      res.json(campaign);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.patch("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const campaign = await storage.updateCampaign(id, req.body);
      res.json(campaign);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.delete("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteCampaign(id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.get("/api/admin/campaigns/:id/sends", requireAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const sends = await storage.getCampaignSends(id);
      res.json(sends);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  // ========== COURSE PATHWAYS ==========
  app.get("/api/admin/pathways", requireAdmin as any, async (_req, res) => {
    try {
      const pathways = await storage.getPathways();
      // Attach step counts
      const result = await Promise.all(pathways.map(async (p) => {
        const steps = await storage.getPathwaySteps(p.id);
        return { ...p, stepCount: steps.length };
      }));
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.get("/api/admin/pathways/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const pathway = await storage.getPathwayById(id);
      if (!pathway) return res.status(404).json({ message: "Not found" });
      res.json(pathway);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.post("/api/admin/pathways", requireAdmin, async (req, res) => {
    try {
      const pathway = await storage.createPathway(req.body);
      res.json(pathway);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.patch("/api/admin/pathways/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const pathway = await storage.updatePathway(id, req.body);
      res.json(pathway);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.delete("/api/admin/pathways/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      await storage.deletePathway(id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.post("/api/admin/pathways/:id/steps", requireAdmin, async (req, res) => {
    try {
      const pathwayId = parseIdParam(req.params.id);
      if (pathwayId === null) return res.status(400).json({ message: "Invalid ID" });
      const step = await storage.createPathwayStep({ ...req.body, pathwayId });
      res.json(step);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.patch("/api/admin/pathways/:id/steps/:stepId", requireAdmin, async (req, res) => {
    try {
      const stepId = parseIdParam(req.params.stepId);
      if (stepId === null) return res.status(400).json({ message: "Invalid ID" });
      await storage.updatePathwayStep(stepId, req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.delete("/api/admin/pathways/:id/steps/:stepId", requireAdmin, async (req, res) => {
    try {
      const stepId = parseIdParam(req.params.stepId);
      if (stepId === null) return res.status(400).json({ message: "Invalid ID" });
      await storage.deletePathwayStep(stepId);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  // ========== TRACKING ==========
  const ALLOWED_CLIENT_EVENT_TYPES = new Set([
    "scroll_depth", "video_progress", "lesson_abandon", "course_page_view",
    "certificate_view", "time_spent", "checkout_abandon",
  ]);

  app.post("/api/track", trackRateLimiter, async (req, res) => {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { return res.json({ ok: true }); }
      }
      const userId = (req.session as any)?.userId;
      if (!userId) return res.json({ ok: true });

      const { eventType, courseId, lessonId, metadata } = body;

      // Whitelist event types from client
      if (!ALLOWED_CLIENT_EVENT_TYPES.has(eventType)) return res.json({ ok: true });

      // Validate IDs
      const safeMetadata = metadata && typeof metadata === "object"
        ? Object.fromEntries(Object.entries(metadata).slice(0, 10)) // max 10 keys
        : undefined;

      await storage.trackEvent(userId, eventType, {
        courseId: courseId ? (parseInt(courseId, 10) || undefined) : undefined,
        lessonId: lessonId ? (parseInt(lessonId, 10) || undefined) : undefined,
        metadata: safeMetadata,
      });

      // Fire checkout_abandon email automation
      if (eventType === "checkout_abandon" && safeMetadata?.courseTitle) {
        storage.fireEmailAutomation("checkout_abandon", userId, {
          courseTitle: String(safeMetadata.courseTitle),
          courseUrl: safeMetadata.courseUrl ? String(safeMetadata.courseUrl) : "",
        }).catch(() => {});
      }
    } catch {}
    res.json({ ok: true });
  });

  // ========== ENHANCED ANALYTICS ENDPOINTS ==========
  app.get("/api/admin/analytics/activity", analyticsRateLimiter, requireAdmin as any, async (req, res) => {
    const feed = await storage.getActivityFeed(100);
    res.json(feed);
  });

  app.get("/api/admin/analytics/overview", analyticsRateLimiter, requireAdmin as any, async (req, res) => {
    const overview = await storage.getAnalyticsOverview();
    res.json(overview);
  });

  app.get("/api/admin/analytics/courses/:id", analyticsRateLimiter, requireAdmin as any, async (req, res) => {
    const courseId = parseIdParam(req.params.id);
    if (!courseId) return res.status(400).json({ message: "Invalid ID" });
    const data = await storage.getCourseAnalyticsDeep(courseId);
    res.json(data);
  });

  app.get("/api/admin/analytics/time-of-day", analyticsRateLimiter, requireAdmin as any, async (req, res) => {
    const data = await storage.getLearningTimeOfDay();
    res.json(data);
  });

  app.get("/api/admin/analytics/devices", analyticsRateLimiter, requireAdmin as any, async (req, res) => {
    const data = await storage.getDeviceBreakdown();
    res.json(data);
  });

  app.get("/api/admin/analytics/funnel", analyticsRateLimiter, requireAdmin as any, async (req, res) => {
    const data = await storage.getCourseConversionFunnel();
    res.json(data);
  });

  app.get("/api/admin/analytics/dropoff", analyticsRateLimiter, requireAdmin as any, async (req, res) => {
    const data = await storage.getDropOffAnalysis();
    res.json(data);
  });

  // ========== EMAIL TEMPLATES ==========

  // Categories
  app.get("/api/admin/email-categories", requireAdmin as any, async (_req, res) => {
    try {
      const cats = await storage.getEmailTemplateCategories();
      res.json(cats);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.post("/api/admin/email-categories", requireAdmin as any, async (req, res) => {
    try {
      const { name, color, description } = req.body;
      if (!name || typeof name !== "string") return res.status(400).json({ message: "Name is required" });
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const cat = await storage.createEmailTemplateCategory({ name, slug, color, description });
      res.json(cat);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.patch("/api/admin/email-categories/:id", requireAdmin as any, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const updated = await storage.updateEmailTemplateCategory(id, req.body);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.delete("/api/admin/email-categories/:id", requireAdmin as any, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteEmailTemplateCategory(id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  // Templates
  app.get("/api/admin/email-templates", requireAdmin as any, async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseIdParam(String(req.query.categoryId)) : undefined;
      const templates = await storage.getEmailTemplates(categoryId ?? undefined);
      res.json(templates);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.get("/api/admin/email-templates/:id", requireAdmin as any, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const template = await storage.getEmailTemplateById(id);
      if (!template) return res.status(404).json({ message: "Template not found" });
      res.json(template);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.post("/api/admin/email-templates", requireAdmin as any, async (req, res) => {
    try {
      const { name, subject, previewText, categoryId, isSystem } = req.body;
      if (!name || typeof name !== "string") return res.status(400).json({ message: "Name is required" });
      const template = await storage.createEmailTemplate({ name, subject, previewText, categoryId, isSystem });
      res.json(template);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.patch("/api/admin/email-templates/:id", requireAdmin as any, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const updated = await storage.updateEmailTemplate(id, req.body);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.delete("/api/admin/email-templates/:id", requireAdmin as any, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const template = await storage.getEmailTemplateById(id);
      if (!template) return res.status(404).json({ message: "Template not found" });
      if (template.isSystem) return res.status(403).json({ message: "Cannot delete system templates" });
      await storage.deleteEmailTemplate(id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.post("/api/admin/email-templates/:id/preview", requireAdmin as any, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const rendered = await storage.renderEmailTemplate(id, req.body.variables ?? {});
      if (!rendered) return res.status(404).json({ message: "Template not found" });
      res.json(rendered);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  // Automations
  app.get("/api/admin/email-automations", requireAdmin as any, async (_req, res) => {
    try {
      const automations = await storage.getEmailAutomations();
      res.json(automations);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.post("/api/admin/email-automations", requireAdmin as any, async (req, res) => {
    try {
      const { name, trigger, templateId, delayMinutes, description } = req.body;
      if (!name || !trigger) return res.status(400).json({ message: "Name and trigger are required" });
      const automation = await storage.createEmailAutomation({ name, trigger, templateId, delayMinutes, description });
      res.json(automation);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.patch("/api/admin/email-automations/:id", requireAdmin as any, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      const updated = await storage.updateEmailAutomation(id, req.body);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  app.delete("/api/admin/email-automations/:id", requireAdmin as any, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteEmailAutomation(id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : e.message }); }
  });

  return httpServer;
}
