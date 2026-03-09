import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(buf, Buffer.from(hashed, "hex"));
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "learnengine-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  function requireAuth(req: Request, res: Response, next: Function) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }

  async function requireAdmin(req: Request, res: Response, next: Function) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return res.status(403).json({ message: "Forbidden" });
    }
    (req as any).currentUser = user;
    next();
  }

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, email } = req.body;
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        email,
        role: "STUDENT",
      });
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, name: user.name, email: user.email, role: user.role });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, name: user.name, email: user.email, role: user.role });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
    res.json({ id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio });
  });

  app.post("/api/auth/promote-admin", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { secret } = req.body;
      if (!secret || secret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: "Invalid admin secret" });
      }
      const user = await storage.updateUserRole(req.session.userId, "ADMIN");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, username: user.username, name: user.name, email: user.email, role: user.role });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/categories", async (_req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.get("/api/stats", async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.get("/api/courses", async (req, res) => {
    const { search, category, level, sort, featured, limit } = req.query;
    const courses = await storage.getCourses({
      search: search as string,
      category: category as string,
      level: level as string,
      sort: sort as string,
      featured: featured === "true",
      limit: limit ? parseInt(limit as string) : undefined,
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

  app.get("/api/enrollments/check/:slug", requireAuth, async (req, res) => {
    const course = await storage.getCourseBySlug(req.params.slug);
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
      const courseId = parseInt(req.params.id);
      const existing = await storage.getEnrollment(req.session.userId!, courseId);
      if (existing) {
        return res.status(400).json({ message: "Already enrolled" });
      }
      const enrollment = await storage.createEnrollment({
        userId: req.session.userId!,
        courseId,
        status: "ACTIVE",
        progress: 0,
      });
      res.json(enrollment);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/learn/:slug", requireAuth, async (req, res) => {
    const course = await storage.getCourseBySlug(req.params.slug);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const enrollment = await storage.getEnrollment(req.session.userId!, course.id);
    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled" });
    }
    const progress = await storage.getLessonProgressByEnrollment(enrollment.id);
    const progressMap: Record<number, any> = {};
    progress.forEach((p) => {
      progressMap[p.lessonId] = p;
    });
    res.json({ course, enrollment, progressMap });
  });

  app.post("/api/lessons/:id/complete", requireAuth, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const allEnrollments = await storage.getEnrollmentsByUser(req.session.userId!);

      let targetEnrollment: any = null;
      for (const e of allEnrollments) {
        const courseDetail = await storage.getCourseById(e.courseId);
        if (courseDetail) {
          for (const subj of courseDetail.subjects || []) {
            for (const mod of subj.modules || []) {
              for (const l of mod.lessons || []) {
                if (l.id === lessonId) {
                  targetEnrollment = e;
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
        return res.status(404).json({ message: "Enrollment not found for this lesson" });
      }

      await storage.upsertLessonProgress(targetEnrollment.id, lessonId, "COMPLETED");

      const courseDetail = await storage.getCourseById(targetEnrollment.courseId);
      if (courseDetail) {
        let totalLessons = 0;
        for (const subj of courseDetail.subjects || []) {
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
      }

      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/stats", requireAdmin as any, async (req, res) => {
    const user = (req as any).currentUser;
    const stats = await storage.getAdminStats(user.id);
    res.json(stats);
  });

  app.get("/api/admin/courses", requireAdmin as any, async (req, res) => {
    const user = (req as any).currentUser;
    const instructorCourses = user.role === "ADMIN"
      ? await storage.getCourses({ allStatuses: true })
      : await storage.getCoursesByInstructor(user.id);
    res.json(instructorCourses);
  });

  app.get("/api/admin/courses/:id", requireAdmin as any, async (req, res) => {
    const user = (req as any).currentUser;
    const course = await storage.getCourseById(parseInt(req.params.id));
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
      const user = (req as any).currentUser;
      const course = await storage.createCourse({
        ...req.body,
        instructorId: user.id,
      });
      res.json(course);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/courses/:id", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const existing = await storage.getCourseById(parseInt(req.params.id));
      if (!existing || (existing.instructorId !== user.id && user.role !== "ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const course = await storage.updateCourse(parseInt(req.params.id), req.body);
      res.json(course);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  async function verifyCourseOwnership(courseId: number, user: any): Promise<boolean> {
    if (user.role === "ADMIN") return true;
    const course = await storage.getCourseById(courseId);
    return course?.instructorId === user.id;
  }

  async function verifySubjectOwnership(subjectId: number, user: any): Promise<boolean> {
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
      const user = (req as any).currentUser;
      if (!await verifyCourseOwnership(req.body.courseId, user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const subject = await storage.createSubject(req.body);
      res.json(subject);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/subjects/:id", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      if (!await verifySubjectOwnership(parseInt(req.params.id), user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const subject = await storage.updateSubject(parseInt(req.params.id), req.body);
      res.json(subject);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/subjects/:id", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      if (!await verifySubjectOwnership(parseInt(req.params.id), user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteSubject(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/modules", requireAdmin as any, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      if (!await verifySubjectOwnership(req.body.subjectId, user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const mod = await storage.createModule(req.body);
      res.json(mod);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/modules/:id", requireAdmin as any, async (req, res) => {
    try {
      const mod = await storage.updateModule(parseInt(req.params.id), req.body);
      res.json(mod);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/modules/:id", requireAdmin as any, async (req, res) => {
    try {
      await storage.deleteModule(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/lessons", requireAdmin as any, async (req, res) => {
    try {
      const lesson = await storage.createLesson(req.body);
      res.json(lesson);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/lessons/:id", requireAdmin as any, async (req, res) => {
    try {
      const lesson = await storage.updateLesson(parseInt(req.params.id), req.body);
      res.json(lesson);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/lessons/:id", requireAdmin as any, async (req, res) => {
    try {
      await storage.deleteLesson(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/analytics", requireAdmin as any, async (req, res) => {
    try {
      const currentUser = (req as any).currentUser;
      if (currentUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Only admins can access platform analytics" });
      }
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/students", requireAdmin as any, async (req, res) => {
    const students = await storage.getStudents();
    res.json(students);
  });

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
      const currentUser = (req as any).currentUser;
      if (currentUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Only super admins can manage users" });
      }
      const { role } = req.body;
      if (!["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updated = await storage.updateUserRole(parseInt(req.params.id), role);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: updated.id, username: updated.username, name: updated.name, email: updated.email, role: updated.role });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
