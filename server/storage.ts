import { db } from "./db";
import { eq, and, desc, asc, count, inArray, isNull, sql } from "drizzle-orm";
import {
  users, courses, categories, subjects, modules, lessons,
  enrollments, lessonProgress, reviews,
  coupons, orders, bundles, bundleCourses, certificates, siteSettings,
  studentGroups, studentGroupMembers,
  quizzes, quizQuestions, quizOptions, quizAttempts,
  affiliates, affiliateReferrals, notifications,
  lessonBlocks, emailVerifications, phoneVerifications, passwordResetTokens,
  emailCampaigns, campaignSends, coursePathways, pathwaySteps, userPathwayProgress,
  userBadges, activityEvents,
  emailTemplateCategories, emailTemplates, emailAutomations,
  type InsertUser, type User,
  type InsertCourse, type Course,
  type InsertCategory, type Category,
  type InsertSubject, type Subject,
  type InsertModule, type Module,
  type InsertLesson, type Lesson,
  type InsertEnrollment, type Enrollment,
  type InsertLessonProgress, type LessonProgress,
  type InsertReview, type Review,
  type InsertCoupon, type Coupon,
  type InsertOrder, type Order,
  type InsertBundle, type Bundle, type BundleCourse,
  type InsertCertificate, type Certificate,
  type SiteSetting,
  type InsertStudentGroup, type StudentGroup, type StudentGroupMember,
  type Quiz, type QuizQuestion, type QuizOption, type QuizAttempt,
  type InsertAffiliate, type Affiliate, type AffiliateReferral,
  type InsertNotification, type Notification,
  type LessonBlock, type InsertLessonBlock,
  type EmailCampaign, type InsertEmailCampaign,
  type CampaignSend, type InsertCampaignSend,
  type CoursePathway, type InsertCoursePathway,
  type PathwayStep, type InsertPathwayStep,
  type UserPathwayProgress,
  type EmailTemplateCategory, type EmailTemplate, type EmailAutomation,
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;

  createEmailVerification(userId: number, code: string, expiresAt: Date): Promise<void>;
  getLatestEmailVerification(userId: number): Promise<any | undefined>;
  markEmailVerificationUsed(id: number): Promise<void>;
  createPhoneVerification(userId: number, phone: string, code: string, expiresAt: Date): Promise<void>;
  getLatestPhoneVerification(userId: number): Promise<any | undefined>;
  markPhoneVerificationUsed(id: number): Promise<void>;

  createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<any | undefined>;
  markPasswordResetTokenUsed(id: number): Promise<void>;

  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  getCourses(filters?: { search?: string; category?: string; level?: string; sort?: string; featured?: boolean; limit?: number; allStatuses?: boolean }): Promise<any[]>;
  getCourseBySlug(slug: string): Promise<any | undefined>;
  getCourseById(id: number): Promise<any | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined>;
  getCoursesByInstructor(instructorId: number): Promise<any[]>;

  getSubjectsByCourse(courseId: number): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, data: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<void>;

  getModulesBySubject(subjectId: number): Promise<Module[]>;
  createModule(mod: InsertModule): Promise<Module>;
  updateModule(id: number, data: Partial<InsertModule>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<void>;

  getLessonsByModule(moduleId: number): Promise<Lesson[]>;
  getLessonById(id: number): Promise<any | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, data: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<void>;

  getEnrollmentsByUser(userId: number): Promise<any[]>;
  getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, data: Partial<InsertEnrollment>): Promise<void>;

  getLessonProgressByEnrollment(enrollmentId: number): Promise<LessonProgress[]>;
  getLessonProgress(enrollmentId: number, lessonId: number): Promise<any | undefined>;
  upsertLessonProgress(enrollmentId: number, lessonId: number, status: string): Promise<void>;

  getStats(): Promise<any>;
  getAdminStats(instructorId: number): Promise<any>;
  getAnalytics(): Promise<any>;
  getStudents(): Promise<any[]>;

  getLessonBlocks(lessonId: number): Promise<LessonBlock[]>;
  createLessonBlock(data: InsertLessonBlock): Promise<LessonBlock>;
  updateLessonBlock(id: number, data: Partial<InsertLessonBlock>): Promise<LessonBlock>;
  deleteLessonBlock(id: number): Promise<void>;
  reorderLessonBlocks(lessonId: number, orderedIds: number[]): Promise<void>;
  duplicateLessonBlock(id: number): Promise<LessonBlock>;

  // Email Campaigns
  getCampaigns(): Promise<EmailCampaign[]>;
  getCampaignById(id: number): Promise<EmailCampaign | undefined>;
  createCampaign(data: InsertEmailCampaign): Promise<EmailCampaign>;
  updateCampaign(id: number, data: Partial<InsertEmailCampaign>): Promise<EmailCampaign>;
  deleteCampaign(id: number): Promise<void>;
  getActiveCampaignsByTrigger(trigger: string, courseId?: number | null): Promise<EmailCampaign[]>;
  createCampaignSend(data: InsertCampaignSend): Promise<CampaignSend>;
  updateCampaignSend(id: number, data: Partial<CampaignSend>): Promise<void>;
  getCampaignSends(campaignId: number): Promise<any[]>;
  getCampaignStats(): Promise<any[]>;

  // Course Pathways
  getPathways(): Promise<CoursePathway[]>;
  getPathwayById(id: number): Promise<any | undefined>;
  createPathway(data: InsertCoursePathway): Promise<CoursePathway>;
  updatePathway(id: number, data: Partial<InsertCoursePathway>): Promise<CoursePathway>;
  deletePathway(id: number): Promise<void>;
  getPathwaySteps(pathwayId: number): Promise<any[]>;
  createPathwayStep(data: InsertPathwayStep): Promise<PathwayStep>;
  updatePathwayStep(id: number, data: Partial<InsertPathwayStep>): Promise<void>;
  deletePathwayStep(id: number): Promise<void>;
  getPathwaysContainingCourse(courseId: number): Promise<any[]>;
  getUserPathwayProgress(userId: number, pathwayId: number): Promise<UserPathwayProgress | undefined>;
  upsertUserPathwayProgress(userId: number, pathwayId: number, currentStep: number): Promise<void>;

  getUserBadges(userId: number): Promise<{ badgeKey: string; awardedAt: Date }[]>;
  awardBadge(userId: number, badgeKey: string): Promise<void>;
  getAllUserBadges(): Promise<any[]>;
  checkAndAwardBadges(userId: number): Promise<void>;

  // Analytics tracking
  trackEvent(userId: number, eventType: string, data?: { courseId?: number; lessonId?: number; metadata?: any }): Promise<void>;
  getActivityFeed(limit?: number): Promise<any[]>;
  getAnalyticsOverview(): Promise<any>;
  getCourseAnalyticsDeep(courseId: number): Promise<any>;
  getStudentTimeSpent(userId: number): Promise<any[]>;
  getQuizAttemptCount(userId: number, lessonId: number): Promise<number>;
  getLearningTimeOfDay(): Promise<any[]>;
  getDeviceBreakdown(): Promise<any[]>;
  getCourseConversionFunnel(): Promise<any[]>;
  getDropOffAnalysis(): Promise<any[]>;

  // Email template categories
  getEmailTemplateCategories(): Promise<EmailTemplateCategory[]>;
  createEmailTemplateCategory(data: { name: string; slug: string; color?: string; description?: string }): Promise<EmailTemplateCategory>;
  updateEmailTemplateCategory(id: number, data: Partial<{ name: string; color: string; description: string }>): Promise<EmailTemplateCategory | undefined>;
  deleteEmailTemplateCategory(id: number): Promise<void>;

  // Email templates
  getEmailTemplates(categoryId?: number): Promise<any[]>;
  getEmailTemplateById(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(data: { name: string; subject?: string; previewText?: string; categoryId?: number; isSystem?: boolean }): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, data: Partial<{ name: string; subject: string; previewText: string; categoryId: number | null; blocks: any[] }>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<void>;

  // Email automations
  getEmailAutomations(): Promise<any[]>;
  getEmailAutomationByTrigger(trigger: string): Promise<EmailAutomation | undefined>;
  createEmailAutomation(data: { name: string; trigger: string; templateId?: number; delayMinutes?: number; description?: string }): Promise<EmailAutomation>;
  updateEmailAutomation(id: number, data: Partial<{ name: string; trigger: string; templateId: number | null; isActive: boolean; delayMinutes: number; description: string }>): Promise<EmailAutomation | undefined>;
  deleteEmailAutomation(id: number): Promise<void>;

  // Email rendering and sending
  renderEmailTemplate(templateId: number, variables: Record<string, string>): Promise<{ subject: string; html: string } | null>;
  fireEmailAutomation(trigger: string, userId: number, variables?: Record<string, string>): Promise<void>;
  seedSystemEmailTemplates(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data as any).where(eq(users.id, id)).returning();
    return updated;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ role: role as any }).where(eq(users.id, id)).returning();
    return updated;
  }

  async createEmailVerification(userId: number, code: string, expiresAt: Date): Promise<void> {
    await db.insert(emailVerifications).values({ userId, code, expiresAt });
  }

  async getLatestEmailVerification(userId: number): Promise<any | undefined> {
    const [row] = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, userId))
      .orderBy(desc(emailVerifications.id))
      .limit(1);
    return row;
  }

  async markEmailVerificationUsed(id: number): Promise<void> {
    await db.update(emailVerifications).set({ usedAt: new Date() }).where(eq(emailVerifications.id, id));
  }

  async createPhoneVerification(userId: number, phone: string, code: string, expiresAt: Date): Promise<void> {
    await db.insert(phoneVerifications).values({ userId, phone, code, expiresAt });
  }

  async getLatestPhoneVerification(userId: number): Promise<any | undefined> {
    const [row] = await db
      .select()
      .from(phoneVerifications)
      .where(eq(phoneVerifications.userId, userId))
      .orderBy(desc(phoneVerifications.id))
      .limit(1);
    return row;
  }

  async markPhoneVerificationUsed(id: number): Promise<void> {
    await db.update(phoneVerifications).set({ usedAt: new Date() }).where(eq(phoneVerifications.id, id));
  }

  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  }

  async getPasswordResetToken(token: string): Promise<any | undefined> {
    const [row] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return row;
  }

  async markPasswordResetTokenUsed(id: number): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  private async getCourseFullData(course: Course) {
    const courseSubjects = await db
      .select()
      .from(subjects)
      .where(eq(subjects.courseId, course.id))
      .orderBy(asc(subjects.position));

    const subjectsWithModules = await Promise.all(
      courseSubjects.map(async (subj) => {
        const subjModules = await db
          .select()
          .from(modules)
          .where(eq(modules.subjectId, subj.id))
          .orderBy(asc(modules.position));

        const modulesWithLessons = await Promise.all(
          subjModules.map(async (mod) => {
            const modLessons = await db
              .select()
              .from(lessons)
              .where(eq(lessons.moduleId, mod.id))
              .orderBy(asc(lessons.position));
            // Attach quiz data for QUIZ lessons
            const lessonsWithQuiz = await Promise.all(
              modLessons.map(async (lesson) => {
                const [blockCountResult] = await db
                  .select({ count: count() })
                  .from(lessonBlocks)
                  .where(eq(lessonBlocks.lessonId, lesson.id));
                const blockCount = blockCountResult?.count || 0;
                if (lesson.type === "QUIZ") {
                  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lesson.id));
                  if (quiz) {
                    const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id)).orderBy(asc(quizQuestions.position));
                    const questionsWithOptions = await Promise.all(
                      questions.map(async (q) => {
                        const opts = await db.select().from(quizOptions).where(eq(quizOptions.questionId, q.id));
                        return { ...q, options: opts };
                      })
                    );
                    return { ...lesson, blockCount, quiz: { ...quiz, questions: questionsWithOptions } };
                  }
                }
                return { ...lesson, blockCount };
              })
            );
            return { ...mod, lessons: lessonsWithQuiz };
          })
        );

        return { ...subj, modules: modulesWithLessons };
      })
    );

    return subjectsWithModules;
  }

  private async getLessonCount(courseId: number): Promise<number> {
    const courseSubjects = await db.select().from(subjects).where(eq(subjects.courseId, courseId));
    let total = 0;
    for (const subj of courseSubjects) {
      const subjModules = await db.select().from(modules).where(eq(modules.subjectId, subj.id));
      for (const mod of subjModules) {
        const [lc] = await db.select({ count: count() }).from(lessons).where(eq(lessons.moduleId, mod.id));
        total += lc.count;
      }
    }
    return total;
  }

  async getCourses(filters?: { search?: string; category?: string; level?: string; sort?: string; featured?: boolean; limit?: number; allStatuses?: boolean }): Promise<any[]> {
    const allCourses = await db
      .select()
      .from(courses)
      .where(filters?.allStatuses ? undefined : eq(courses.status, "PUBLISHED"))
      .orderBy(desc(courses.createdAt));

    const enriched = await Promise.all(
      allCourses.map(async (course) => {
        const [instructor] = await db
          .select({ id: users.id, name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, course.instructorId));

        const cat = course.categoryId
          ? (await db.select().from(categories).where(eq(categories.id, course.categoryId)))[0]
          : null;

        const [enrollCount] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));

        const lessonCount = await this.getLessonCount(course.id);

        const reviewList = await db.select().from(reviews).where(eq(reviews.courseId, course.id));
        const avgRating = reviewList.length > 0
          ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
          : 0;

        return {
          ...course,
          instructor,
          category: cat,
          enrollmentCount: enrollCount.count,
          lessonCount,
          averageRating: avgRating,
        };
      })
    );

    let filtered = enriched;

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s) ||
          c.shortDescription?.toLowerCase().includes(s)
      );
    }

    if (filters?.category && filters.category !== "all") {
      filtered = filtered.filter((c) => c.category?.slug === filters.category);
    }

    if (filters?.level && filters.level !== "all") {
      filtered = filtered.filter((c) => c.level === filters.level);
    }

    if (filters?.sort === "popular") {
      filtered.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
    } else if (filters?.sort === "rating") {
      filtered.sort((a, b) => b.averageRating - a.averageRating);
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  async getCourseBySlug(slug: string): Promise<any | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    if (!course) return undefined;

    const [instructor] = await db
      .select({ id: users.id, name: users.name, avatar: users.avatar, bio: users.bio })
      .from(users)
      .where(eq(users.id, course.instructorId));

    const cat = course.categoryId
      ? (await db.select().from(categories).where(eq(categories.id, course.categoryId)))[0]
      : null;

    const subjectsData = await this.getCourseFullData(course);

    const [enrollCount] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.courseId, course.id));

    const reviewList = await db.select().from(reviews).where(eq(reviews.courseId, course.id));
    const reviewsWithUsers = await Promise.all(
      reviewList.map(async (r) => {
        const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, r.userId));
        return { ...r, user: u };
      })
    );

    return {
      ...course,
      instructor,
      category: cat,
      subjects: subjectsData,
      enrollmentCount: enrollCount.count,
      reviews: reviewsWithUsers,
    };
  }

  async getCourseById(id: number): Promise<any | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) return undefined;

    const subjectsData = await this.getCourseFullData(course);

    const [enrollCount] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.courseId, course.id));

    return {
      ...course,
      subjects: subjectsData,
      enrollmentCount: enrollCount?.count || 0,
    };
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }

  async updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(courses).set({ ...data, updatedAt: new Date() }).where(eq(courses.id, id)).returning();
    return updated;
  }

  async getCoursesByInstructor(instructorId: number): Promise<any[]> {
    const instructorCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.instructorId, instructorId))
      .orderBy(desc(courses.updatedAt));

    return Promise.all(
      instructorCourses.map(async (course) => {
        const [enrollCount] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));
        return { ...course, enrollmentCount: enrollCount?.count || 0 };
      })
    );
  }

  async getSubjectsByCourse(courseId: number): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.courseId, courseId)).orderBy(asc(subjects.position));
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [created] = await db.insert(subjects).values(subject).returning();
    return created;
  }

  async updateSubject(id: number, data: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [updated] = await db.update(subjects).set(data).where(eq(subjects.id, id)).returning();
    return updated;
  }

  async deleteSubject(id: number): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  async getModulesBySubject(subjectId: number): Promise<Module[]> {
    return db.select().from(modules).where(eq(modules.subjectId, subjectId)).orderBy(asc(modules.position));
  }

  async createModule(mod: InsertModule): Promise<Module> {
    const [created] = await db.insert(modules).values(mod).returning();
    return created;
  }

  async updateModule(id: number, data: Partial<InsertModule>): Promise<Module | undefined> {
    const [updated] = await db.update(modules).set(data).where(eq(modules.id, id)).returning();
    return updated;
  }

  async deleteModule(id: number): Promise<void> {
    await db.delete(modules).where(eq(modules.id, id));
  }

  async getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.moduleId, moduleId)).orderBy(asc(lessons.position));
  }

  async getLessonById(id: number): Promise<any | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [created] = await db.insert(lessons).values(lesson).returning();
    return created;
  }

  async updateLesson(id: number, data: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updated] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return updated;
  }

  async deleteLesson(id: number): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  async getEnrollmentsByUser(userId: number): Promise<any[]> {
    const userEnrollments = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));

    return Promise.all(
      userEnrollments.map(async (enrollment) => {
        const [course] = await db.select().from(courses).where(eq(courses.id, enrollment.courseId));
        return { ...enrollment, course };
      })
    );
  }

  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [created] = await db.insert(enrollments).values(enrollment).returning();
    return created;
  }

  async updateEnrollment(id: number, data: Partial<InsertEnrollment>): Promise<void> {
    await db.update(enrollments).set(data).where(eq(enrollments.id, id));
  }

  async getLessonProgressByEnrollment(enrollmentId: number): Promise<LessonProgress[]> {
    return db.select().from(lessonProgress).where(eq(lessonProgress.enrollmentId, enrollmentId));
  }

  async getLessonProgress(enrollmentId: number, lessonId: number): Promise<any | undefined> {
    const [progress] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.enrollmentId, enrollmentId), eq(lessonProgress.lessonId, lessonId)));
    return progress;
  }

  async upsertLessonProgress(enrollmentId: number, lessonId: number, status: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.enrollmentId, enrollmentId), eq(lessonProgress.lessonId, lessonId)));

    if (existing) {
      await db
        .update(lessonProgress)
        .set({ status: status as any, completedAt: status === "COMPLETED" ? new Date() : null })
        .where(eq(lessonProgress.id, existing.id));
    } else {
      await db.insert(lessonProgress).values({
        enrollmentId,
        lessonId,
        status: status as any,
        completedAt: status === "COMPLETED" ? new Date() : null,
      });
    }
  }

  async getStats(): Promise<any> {
    const [courseCount] = await db.select({ count: count() }).from(courses).where(eq(courses.status, "PUBLISHED"));
    const [studentCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "STUDENT"));
    const [instructorCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "INSTRUCTOR"));
    const [completionCount] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.status, "COMPLETED"));

    return {
      courseCount: courseCount.count,
      studentCount: studentCount.count,
      instructorCount: instructorCount.count,
      completionCount: completionCount.count,
    };
  }

  async getAdminStats(instructorId: number): Promise<any> {
    const instructorCourses = await db.select().from(courses).where(eq(courses.instructorId, instructorId));

    let enrollmentCount = 0;
    let studentSet = new Set<number>();
    let publishedCount = 0;

    for (const c of instructorCourses) {
      if (c.status === "PUBLISHED") publishedCount++;
      const courseEnrollments = await db.select().from(enrollments).where(eq(enrollments.courseId, c.id));
      enrollmentCount += courseEnrollments.length;
      courseEnrollments.forEach((e) => studentSet.add(e.userId));
    }

    return {
      courseCount: instructorCourses.length,
      studentCount: studentSet.size,
      enrollmentCount,
      publishedCount,
    };
  }

  async getAnalytics(): Promise<any> {
    const [totalCourses] = await db.select({ count: count() }).from(courses);
    const [publishedCourses] = await db.select({ count: count() }).from(courses).where(eq(courses.status, "PUBLISHED"));
    const [draftCourses] = await db.select({ count: count() }).from(courses).where(eq(courses.status, "DRAFT"));
    const [totalStudents] = await db.select({ count: count() }).from(users).where(eq(users.role, "STUDENT"));
    const [totalInstructors] = await db.select({ count: count() }).from(users).where(eq(users.role, "INSTRUCTOR"));
    const [totalAdmins] = await db.select({ count: count() }).from(users).where(eq(users.role, "ADMIN"));
    const [totalEnrollments] = await db.select({ count: count() }).from(enrollments);
    const [activeEnrollments] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.status, "ACTIVE"));
    const [completedEnrollments] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.status, "COMPLETED"));
    const [totalLessons] = await db.select({ count: count() }).from(lessons);
    const [totalSubjects] = await db.select({ count: count() }).from(subjects);
    const [totalModules] = await db.select({ count: count() }).from(modules);
    const [completedLessons] = await db.select({ count: count() }).from(lessonProgress).where(eq(lessonProgress.status, "COMPLETED"));

    const allCourses = await db.select().from(courses).orderBy(desc(courses.createdAt));
    const courseAnalytics = await Promise.all(
      allCourses.map(async (course) => {
        const [instructor] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, course.instructorId));

        const [enrollCount] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));

        const [completedCount] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(and(eq(enrollments.courseId, course.id), eq(enrollments.status, "COMPLETED")));

        const courseSubjects = await db.select().from(subjects).where(eq(subjects.courseId, course.id));
        let lessonCount = 0;
        for (const subj of courseSubjects) {
          const subjModules = await db.select().from(modules).where(eq(modules.subjectId, subj.id));
          for (const mod of subjModules) {
            const [lc] = await db.select({ count: count() }).from(lessons).where(eq(lessons.moduleId, mod.id));
            lessonCount += lc.count;
          }
        }

        const courseEnrollments = await db.select().from(enrollments).where(eq(enrollments.courseId, course.id));
        const avgProgress = courseEnrollments.length > 0
          ? courseEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / courseEnrollments.length
          : 0;

        const reviewList = await db.select().from(reviews).where(eq(reviews.courseId, course.id));
        const avgRating = reviewList.length > 0
          ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
          : 0;

        return {
          id: course.id,
          title: course.title,
          slug: course.slug,
          status: course.status,
          instructor: instructor?.name || "Unknown",
          enrollments: enrollCount.count,
          completions: completedCount.count,
          completionRate: enrollCount.count > 0 ? Math.round((completedCount.count / enrollCount.count) * 100) : 0,
          lessonCount,
          subjectCount: courseSubjects.length,
          avgProgress: Math.round(avgProgress),
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviewList.length,
          createdAt: course.createdAt,
        };
      })
    );

    const allCategories = await db.select().from(categories);
    const categoryBreakdown = await Promise.all(
      allCategories.map(async (cat) => {
        const catCourses = allCourses.filter(c => c.categoryId === cat.id);
        let catEnrollments = 0;
        for (const c of catCourses) {
          const [ec] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.courseId, c.id));
          catEnrollments += ec.count;
        }
        return {
          name: cat.name,
          slug: cat.slug,
          courseCount: catCourses.length,
          enrollments: catEnrollments,
        };
      })
    );

    const recentEnrollments = await db
      .select()
      .from(enrollments)
      .orderBy(desc(enrollments.enrolledAt))
      .limit(10);

    const recentEnrollmentsWithDetails = await Promise.all(
      recentEnrollments.map(async (enrollment) => {
        const [student] = await db
          .select({ name: users.name, username: users.username })
          .from(users)
          .where(eq(users.id, enrollment.userId));
        const [course] = await db
          .select({ title: courses.title, slug: courses.slug })
          .from(courses)
          .where(eq(courses.id, enrollment.courseId));
        return {
          id: enrollment.id,
          studentName: student?.name || "Unknown",
          studentUsername: student?.username || "",
          courseTitle: course?.title || "Unknown",
          courseSlug: course?.slug || "",
          status: enrollment.status,
          progress: Math.round(enrollment.progress || 0),
          enrolledAt: enrollment.enrolledAt,
        };
      })
    );

    const topInstructors = await Promise.all(
      (await db.select().from(users).where(eq(users.role, "INSTRUCTOR"))).map(async (instructor) => {
        const instrCourses = allCourses.filter(c => c.instructorId === instructor.id);
        let totalEnroll = 0;
        for (const c of instrCourses) {
          const [ec] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.courseId, c.id));
          totalEnroll += ec.count;
        }
        return {
          name: instructor.name,
          username: instructor.username,
          courseCount: instrCourses.length,
          totalEnrollments: totalEnroll,
        };
      })
    );

    return {
      overview: {
        totalCourses: totalCourses.count,
        publishedCourses: publishedCourses.count,
        draftCourses: draftCourses.count,
        totalStudents: totalStudents.count,
        totalInstructors: totalInstructors.count,
        totalAdmins: totalAdmins.count,
        totalUsers: totalStudents.count + totalInstructors.count + totalAdmins.count,
        totalEnrollments: totalEnrollments.count,
        activeEnrollments: activeEnrollments.count,
        completedEnrollments: completedEnrollments.count,
        totalLessons: totalLessons.count,
        totalSubjects: totalSubjects.count,
        totalModules: totalModules.count,
        completedLessonProgress: completedLessons.count,
        overallCompletionRate: totalEnrollments.count > 0 ? Math.round((completedEnrollments.count / totalEnrollments.count) * 100) : 0,
      },
      courseAnalytics,
      categoryBreakdown,
      recentEnrollments: recentEnrollmentsWithDetails,
      topInstructors,
    };
  }

  async getStudents(): Promise<any[]> {
    const allStudents = await db.select().from(users).where(eq(users.role, "STUDENT"));
    if (allStudents.length === 0) return [];

    const studentIds = allStudents.map((s) => s.id);

    // Fetch all enrollments, certificates, and group memberships in 3 queries instead of N*3
    const [allEnrollments, allCerts, allGroupMembers] = await Promise.all([
      db.select({ userId: enrollments.userId }).from(enrollments).where(inArray(enrollments.userId, studentIds)),
      db.select().from(certificates).where(inArray(certificates.userId, studentIds)),
      db.select({ userId: studentGroupMembers.userId }).from(studentGroupMembers).where(inArray(studentGroupMembers.userId, studentIds)),
    ]);

    // Build lookup maps
    const enrollCountMap = new Map<number, number>();
    for (const e of allEnrollments) {
      enrollCountMap.set(e.userId, (enrollCountMap.get(e.userId) ?? 0) + 1);
    }
    const certMap = new Map<number, typeof allCerts>();
    for (const c of allCerts) {
      if (!certMap.has(c.userId)) certMap.set(c.userId, []);
      certMap.get(c.userId)!.push(c);
    }
    const groupCountMap = new Map<number, number>();
    for (const gm of allGroupMembers) {
      groupCountMap.set(gm.userId, (groupCountMap.get(gm.userId) ?? 0) + 1);
    }

    return allStudents.map((student) => ({
      ...student,
      password: undefined,
      enrollmentCount: enrollCountMap.get(student.id) ?? 0,
      certificates: certMap.get(student.id) ?? [],
      groupCount: groupCountMap.get(student.id) ?? 0,
    }));
  }

  // ========== COUPONS ==========
  async getCoupons(): Promise<any[]> {
    const all = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return Promise.all(all.map(async (c) => {
      const course = c.courseId ? (await db.select({ title: courses.title }).from(courses).where(eq(courses.id, c.courseId)))[0] : null;
      return { ...c, courseName: course?.title || null };
    }));
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase()));
    return coupon;
  }

  async createCoupon(data: InsertCoupon): Promise<Coupon> {
    const [created] = await db.insert(coupons).values({ ...data, code: data.code.toUpperCase() }).returning();
    return created;
  }

  async deleteCoupon(id: number): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async incrementCouponUsage(id: number): Promise<void> {
    const [c] = await db.select().from(coupons).where(eq(coupons.id, id));
    if (c) {
      await db.update(coupons).set({ usedCount: (c.usedCount || 0) + 1 }).where(eq(coupons.id, id));
    }
  }

  // ========== ORDERS ==========
  async getOrders(): Promise<any[]> {
    const all = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return Promise.all(all.map(async (o) => {
      const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, o.userId));
      const [course] = await db.select({ title: courses.title, slug: courses.slug }).from(courses).where(eq(courses.id, o.courseId));
      const coupon = o.couponId ? (await db.select({ code: coupons.code }).from(coupons).where(eq(coupons.id, o.couponId)))[0] : null;
      return { ...o, user, course, coupon };
    }));
  }

  async createOrder(data: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(data).returning();
    return created;
  }

  // ========== BUNDLES ==========
  async getBundles(): Promise<any[]> {
    const all = await db.select().from(bundles).where(eq(bundles.isActive, true)).orderBy(desc(bundles.createdAt));
    return Promise.all(all.map(async (b) => {
      const bc = await db.select().from(bundleCourses).where(eq(bundleCourses.bundleId, b.id));
      const bundledCourses = await Promise.all(bc.map(async (item) => {
        const [c] = await db.select({ id: courses.id, title: courses.title, slug: courses.slug, thumbnail: courses.thumbnail }).from(courses).where(eq(courses.id, item.courseId));
        return c;
      }));
      return { ...b, courses: bundledCourses.filter(Boolean) };
    }));
  }

  async getAllBundles(): Promise<any[]> {
    const all = await db.select().from(bundles).orderBy(desc(bundles.createdAt));
    return Promise.all(all.map(async (b) => {
      const bc = await db.select().from(bundleCourses).where(eq(bundleCourses.bundleId, b.id));
      const bundledCourses = await Promise.all(bc.map(async (item) => {
        const [c] = await db.select({ id: courses.id, title: courses.title, slug: courses.slug, thumbnail: courses.thumbnail }).from(courses).where(eq(courses.id, item.courseId));
        return c;
      }));
      return { ...b, courses: bundledCourses.filter(Boolean) };
    }));
  }

  async getBundleBySlug(slug: string): Promise<any | undefined> {
    const [bundle] = await db.select().from(bundles).where(eq(bundles.slug, slug));
    if (!bundle) return undefined;
    const bc = await db.select().from(bundleCourses).where(eq(bundleCourses.bundleId, bundle.id));
    const bundledCourses = await Promise.all(bc.map(async (item) => {
      const [c] = await db.select().from(courses).where(eq(courses.id, item.courseId));
      return c;
    }));
    return { ...bundle, courses: bundledCourses.filter(Boolean) };
  }

  async createBundle(data: InsertBundle): Promise<Bundle> {
    const [created] = await db.insert(bundles).values(data).returning();
    return created;
  }

  async updateBundle(id: number, data: Partial<InsertBundle>): Promise<Bundle | undefined> {
    const [updated] = await db.update(bundles).set(data).where(eq(bundles.id, id)).returning();
    return updated;
  }

  async deleteBundle(id: number): Promise<void> {
    await db.delete(bundles).where(eq(bundles.id, id));
  }

  async addCourseToBundle(bundleId: number, courseId: number): Promise<void> {
    await db.insert(bundleCourses).values({ bundleId, courseId });
  }

  async removeCourseFromBundle(bundleId: number, courseId: number): Promise<void> {
    await db.delete(bundleCourses).where(and(eq(bundleCourses.bundleId, bundleId), eq(bundleCourses.courseId, courseId)));
  }

  // ========== CERTIFICATES ==========
  async getCertificateByCode(code: string): Promise<any | undefined> {
    const [cert] = await db.select().from(certificates).where(eq(certificates.certificateCode, code));
    if (!cert) return undefined;
    const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, cert.userId));
    const [course] = await db.select({ title: courses.title, slug: courses.slug }).from(courses).where(eq(courses.id, cert.courseId));
    return { ...cert, user, course };
  }

  async getCertificateByUserAndCourse(userId: number, courseId: number): Promise<Certificate | undefined> {
    const [cert] = await db.select().from(certificates).where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)));
    return cert;
  }

  async createCertificate(userId: number, courseId: number): Promise<Certificate> {
    const code = `CERT-${nanoid(10).toUpperCase()}`;
    const [created] = await db.insert(certificates).values({ userId, courseId, certificateCode: code }).returning();
    return created;
  }

  async getCertificatesByUser(userId: number): Promise<any[]> {
    const certs = await db.select().from(certificates).where(eq(certificates.userId, userId));
    return Promise.all(certs.map(async (c) => {
      const [course] = await db.select({ title: courses.title, slug: courses.slug }).from(courses).where(eq(courses.id, c.courseId));
      return { ...c, course };
    }));
  }

  async getAllCertificates(): Promise<any[]> {
    const certs = await db.select().from(certificates);
    return Promise.all(certs.map(async (c) => {
      const [course] = await db.select({ title: courses.title, slug: courses.slug }).from(courses).where(eq(courses.id, c.courseId));
      const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, c.userId));
      return { ...c, course, user };
    }));
  }

  // ========== SITE SETTINGS ==========
  async getSiteSettings(): Promise<Record<string, string>> {
    const all = await db.select().from(siteSettings);
    const result: Record<string, string> = {};
    for (const s of all) {
      result[s.key] = s.value || "";
    }
    return result;
  }

  async upsertSiteSetting(key: string, value: string): Promise<void> {
    const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    if (existing) {
      await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value });
    }
  }

  // ========== STUDENT GROUPS ==========
  async getStudentGroups(): Promise<any[]> {
    const groups = await db.select().from(studentGroups).orderBy(desc(studentGroups.createdAt));
    return Promise.all(groups.map(async (g) => {
      const members = await db.select().from(studentGroupMembers).where(eq(studentGroupMembers.groupId, g.id));
      const course = g.courseId ? (await db.select({ title: courses.title }).from(courses).where(eq(courses.id, g.courseId)))[0] : null;
      const memberUsers = await Promise.all(members.map(async (m) => {
        const [u] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, m.userId));
        return u;
      }));
      return { ...g, members: memberUsers.filter(Boolean), memberCount: members.length, courseName: course?.title || null };
    }));
  }

  async createStudentGroup(data: InsertStudentGroup): Promise<StudentGroup> {
    const [created] = await db.insert(studentGroups).values(data).returning();
    return created;
  }

  async updateStudentGroup(id: number, data: Partial<InsertStudentGroup>): Promise<StudentGroup | undefined> {
    const [updated] = await db.update(studentGroups).set(data).where(eq(studentGroups.id, id)).returning();
    return updated;
  }

  async deleteStudentGroup(id: number): Promise<void> {
    await db.delete(studentGroups).where(eq(studentGroups.id, id));
  }

  async addStudentToGroup(groupId: number, userId: number): Promise<void> {
    const [existing] = await db.select().from(studentGroupMembers).where(and(eq(studentGroupMembers.groupId, groupId), eq(studentGroupMembers.userId, userId)));
    if (!existing) {
      await db.insert(studentGroupMembers).values({ groupId, userId });
    }
  }

  async removeStudentFromGroup(groupId: number, userId: number): Promise<void> {
    await db.delete(studentGroupMembers).where(and(eq(studentGroupMembers.groupId, groupId), eq(studentGroupMembers.userId, userId)));
  }

  // ========== QUIZZES ==========
  async getQuizByLesson(lessonId: number): Promise<any | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
    if (!quiz) return undefined;
    const qs = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id)).orderBy(asc(quizQuestions.position));
    const questionsWithOptions = await Promise.all(qs.map(async (q) => {
      const opts = await db.select().from(quizOptions).where(eq(quizOptions.questionId, q.id));
      return { ...q, options: opts };
    }));
    return { ...quiz, questions: questionsWithOptions };
  }

  async createQuiz(lessonId: number): Promise<Quiz> {
    const [created] = await db.insert(quizzes).values({ lessonId }).returning();
    return created;
  }

  async upsertQuiz(lessonId: number, questions: Array<{ question: string; type: string; position: number; options: Array<{ text: string; isCorrect: boolean }> }>): Promise<void> {
    let [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
    if (!quiz) {
      const [created] = await db.insert(quizzes).values({ lessonId }).returning();
      quiz = created;
    }
    // Delete existing questions (cascade deletes options)
    const existingQs = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id));
    for (const eq_ of existingQs) {
      await db.delete(quizOptions).where(eq(quizOptions.questionId, eq_.id));
    }
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quiz.id));

    // Insert new questions
    for (const q of questions) {
      const [newQ] = await db.insert(quizQuestions).values({
        quizId: quiz.id,
        question: q.question,
        type: q.type as any,
        position: q.position,
      }).returning();
      for (const opt of q.options) {
        await db.insert(quizOptions).values({ questionId: newQ.id, text: opt.text, isCorrect: opt.isCorrect });
      }
    }
  }

  async submitQuizAttempt(userId: number, quizId: number, answers: Record<number, number>): Promise<{ score: number; passed: boolean; correct: number; total: number }> {
    const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));
    let correct = 0;
    for (const q of questions) {
      const selectedOptionId = answers[q.id];
      if (selectedOptionId) {
        const [opt] = await db.select().from(quizOptions).where(eq(quizOptions.id, selectedOptionId));
        if (opt?.isCorrect) correct++;
      }
    }
    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;
    const passed = score >= 70;
    await db.insert(quizAttempts).values({ userId, quizId, score, passed });
    return { score, passed, correct, total: questions.length };
  }

  // ========== AFFILIATES ==========
  async getAffiliates(): Promise<any[]> {
    const all = await db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
    return Promise.all(all.map(async (a) => {
      const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, a.userId));
      return { ...a, user };
    }));
  }

  async getAffiliateByCode(code: string): Promise<Affiliate | undefined> {
    const [aff] = await db.select().from(affiliates).where(eq(affiliates.code, code));
    return aff;
  }

  async getAffiliateByUserId(userId: number): Promise<Affiliate | undefined> {
    const [aff] = await db.select().from(affiliates).where(eq(affiliates.userId, userId));
    return aff;
  }

  async createAffiliate(userId: number): Promise<Affiliate> {
    const code = `REF${nanoid(6).toUpperCase()}`;
    const [created] = await db.insert(affiliates).values({ userId, code, commissionRate: 0.3, totalEarned: 0, isActive: false }).returning();
    return created;
  }

  async updateAffiliate(id: number, data: Partial<InsertAffiliate>): Promise<Affiliate | undefined> {
    const [updated] = await db.update(affiliates).set(data).where(eq(affiliates.id, id)).returning();
    return updated;
  }

  async createAffiliateReferral(affiliateId: number, orderId: number, commission: number): Promise<void> {
    await db.insert(affiliateReferrals).values({ affiliateId, orderId, commission, status: "PENDING" });
    // Update total earned
    const [aff] = await db.select().from(affiliates).where(eq(affiliates.id, affiliateId));
    if (aff) {
      await db.update(affiliates).set({ totalEarned: (aff.totalEarned || 0) + commission }).where(eq(affiliates.id, affiliateId));
    }
  }

  // ========== NOTIFICATIONS ==========
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(data).returning();
    return created;
  }

  async markNotificationRead(id: number, userId: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.count;
  }

  // ========== LESSON BLOCKS ==========
  async getLessonBlocks(lessonId: number): Promise<LessonBlock[]> {
    return db.select().from(lessonBlocks).where(eq(lessonBlocks.lessonId, lessonId)).orderBy(asc(lessonBlocks.position));
  }

  async createLessonBlock(data: InsertLessonBlock): Promise<LessonBlock> {
    const [created] = await db.insert(lessonBlocks).values(data).returning();
    return created;
  }

  async updateLessonBlock(id: number, data: Partial<InsertLessonBlock>): Promise<LessonBlock> {
    const [updated] = await db.update(lessonBlocks).set(data).where(eq(lessonBlocks.id, id)).returning();
    return updated;
  }

  async deleteLessonBlock(id: number): Promise<void> {
    await db.delete(lessonBlocks).where(eq(lessonBlocks.id, id));
  }

  async reorderLessonBlocks(lessonId: number, orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(lessonBlocks).set({ position: i }).where(and(eq(lessonBlocks.id, orderedIds[i]), eq(lessonBlocks.lessonId, lessonId)));
    }
  }

  async duplicateLessonBlock(id: number): Promise<LessonBlock> {
    const [block] = await db.select().from(lessonBlocks).where(eq(lessonBlocks.id, id));
    if (!block) throw new Error("Block not found");
    const [created] = await db.insert(lessonBlocks).values({
      lessonId: block.lessonId,
      type: block.type,
      content: block.content,
      position: block.position + 1,
      settings: block.settings,
    }).returning();
    return created;
  }

  // ========== EMAIL CAMPAIGNS ==========
  async getCampaigns(): Promise<EmailCampaign[]> {
    return db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async getCampaignById(id: number): Promise<EmailCampaign | undefined> {
    const [row] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return row;
  }

  async createCampaign(data: InsertEmailCampaign): Promise<EmailCampaign> {
    const [row] = await db.insert(emailCampaigns).values(data).returning();
    return row;
  }

  async updateCampaign(id: number, data: Partial<InsertEmailCampaign>): Promise<EmailCampaign> {
    const [row] = await db.update(emailCampaigns).set(data).where(eq(emailCampaigns.id, id)).returning();
    return row;
  }

  async deleteCampaign(id: number): Promise<void> {
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  }

  async getActiveCampaignsByTrigger(trigger: string, courseId?: number | null): Promise<EmailCampaign[]> {
    const rows = await db.select().from(emailCampaigns).where(eq(emailCampaigns.isActive, true));
    return rows.filter((c) => {
      if ((c.triggerType as string) !== trigger) return false;
      if (c.courseId === null || c.courseId === undefined) return true;
      return c.courseId === courseId;
    });
  }

  async createCampaignSend(data: InsertCampaignSend): Promise<CampaignSend> {
    const [row] = await db.insert(campaignSends).values(data).returning();
    return row;
  }

  async updateCampaignSend(id: number, data: Partial<CampaignSend>): Promise<void> {
    await db.update(campaignSends).set(data as any).where(eq(campaignSends.id, id));
  }

  async getCampaignSends(campaignId: number): Promise<any[]> {
    const rows = await db
      .select({
        id: campaignSends.id,
        campaignId: campaignSends.campaignId,
        userId: campaignSends.userId,
        status: campaignSends.status,
        scheduledAt: campaignSends.scheduledAt,
        sentAt: campaignSends.sentAt,
        error: campaignSends.error,
        userName: users.name,
        userEmail: users.email,
      })
      .from(campaignSends)
      .leftJoin(users, eq(campaignSends.userId, users.id))
      .where(eq(campaignSends.campaignId, campaignId))
      .orderBy(desc(campaignSends.createdAt));
    return rows;
  }

  async getCampaignStats(): Promise<any[]> {
    const all = await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
    const stats = await Promise.all(all.map(async (c) => {
      const sends = await db.select().from(campaignSends).where(eq(campaignSends.campaignId, c.id));
      return {
        ...c,
        totalSends: sends.length,
        sentCount: sends.filter((s) => s.status === "SENT").length,
        pendingCount: sends.filter((s) => s.status === "PENDING").length,
        failedCount: sends.filter((s) => s.status === "FAILED").length,
      };
    }));
    return stats;
  }

  // ========== COURSE PATHWAYS ==========
  async getPathways(): Promise<CoursePathway[]> {
    return db.select().from(coursePathways).orderBy(desc(coursePathways.createdAt));
  }

  async getPathwayById(id: number): Promise<any | undefined> {
    const [pathway] = await db.select().from(coursePathways).where(eq(coursePathways.id, id));
    if (!pathway) return undefined;
    const steps = await this.getPathwaySteps(id);
    return { ...pathway, steps };
  }

  async createPathway(data: InsertCoursePathway): Promise<CoursePathway> {
    const [row] = await db.insert(coursePathways).values(data).returning();
    return row;
  }

  async updatePathway(id: number, data: Partial<InsertCoursePathway>): Promise<CoursePathway> {
    const [row] = await db.update(coursePathways).set(data).where(eq(coursePathways.id, id)).returning();
    return row;
  }

  async deletePathway(id: number): Promise<void> {
    await db.delete(coursePathways).where(eq(coursePathways.id, id));
  }

  async getPathwaySteps(pathwayId: number): Promise<any[]> {
    const rows = await db
      .select({
        id: pathwaySteps.id,
        pathwayId: pathwaySteps.pathwayId,
        courseId: pathwaySteps.courseId,
        position: pathwaySteps.position,
        campaignId: pathwaySteps.campaignId,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        campaignName: emailCampaigns.name,
      })
      .from(pathwaySteps)
      .leftJoin(courses, eq(pathwaySteps.courseId, courses.id))
      .leftJoin(emailCampaigns, eq(pathwaySteps.campaignId, emailCampaigns.id))
      .where(eq(pathwaySteps.pathwayId, pathwayId))
      .orderBy(asc(pathwaySteps.position));
    return rows;
  }

  async createPathwayStep(data: InsertPathwayStep): Promise<PathwayStep> {
    const [row] = await db.insert(pathwaySteps).values(data).returning();
    return row;
  }

  async updatePathwayStep(id: number, data: Partial<InsertPathwayStep>): Promise<void> {
    await db.update(pathwaySteps).set(data).where(eq(pathwaySteps.id, id));
  }

  async deletePathwayStep(id: number): Promise<void> {
    await db.delete(pathwaySteps).where(eq(pathwaySteps.id, id));
  }

  async getPathwaysContainingCourse(courseId: number): Promise<any[]> {
    return db
      .select({
        stepId: pathwaySteps.id,
        pathwayId: pathwaySteps.pathwayId,
        courseId: pathwaySteps.courseId,
        position: pathwaySteps.position,
        campaignId: pathwaySteps.campaignId,
        pathwayName: coursePathways.name,
        pathwayIsActive: coursePathways.isActive,
      })
      .from(pathwaySteps)
      .innerJoin(coursePathways, eq(pathwaySteps.pathwayId, coursePathways.id))
      .where(and(eq(pathwaySteps.courseId, courseId), eq(coursePathways.isActive, true)));
  }

  async getUserPathwayProgress(userId: number, pathwayId: number): Promise<UserPathwayProgress | undefined> {
    const [row] = await db.select().from(userPathwayProgress)
      .where(and(eq(userPathwayProgress.userId, userId), eq(userPathwayProgress.pathwayId, pathwayId)));
    return row;
  }

  async upsertUserPathwayProgress(userId: number, pathwayId: number, currentStep: number): Promise<void> {
    const existing = await this.getUserPathwayProgress(userId, pathwayId);
    if (existing) {
      await db.update(userPathwayProgress)
        .set({ currentStep, updatedAt: new Date() })
        .where(eq(userPathwayProgress.id, existing.id));
    } else {
      await db.insert(userPathwayProgress).values({ userId, pathwayId, currentStep, updatedAt: new Date() });
    }
  }

  // ========== BADGES ==========
  async getUserBadges(userId: number): Promise<{ badgeKey: string; awardedAt: Date }[]> {
    const rows = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    return rows.map((r) => ({ badgeKey: r.badgeKey, awardedAt: r.awardedAt }));
  }

  async awardBadge(userId: number, badgeKey: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, badgeKey)));
    if (existing) return;
    await db.insert(userBadges).values({ userId, badgeKey });
    await this.trackEvent(userId, "badge_earned", { metadata: { badgeKey } });
    // Fire badge_earned email automation (best-effort)
    this.fireEmailAutomation("badge_earned", userId, { badgeName: badgeKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) }).catch(() => {});
  }

  async getAllUserBadges(): Promise<any[]> {
    return db.select().from(userBadges).orderBy(desc(userBadges.awardedAt));
  }

  async checkAndAwardBadges(userId: number): Promise<void> {
    try {
      // Get all enrollments
      const allEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
      const completedEnrollments = allEnrollments.filter((e) => e.status === "COMPLETED");
      const completedCount = completedEnrollments.length;
      const totalEnrollments = allEnrollments.length;

      // Get current badges
      const currentBadges = await this.getUserBadges(userId);
      const earnedKeys = new Set(currentBadges.map((b) => b.badgeKey));

      const award = (key: string) => {
        if (!earnedKeys.has(key)) {
          earnedKeys.add(key);
          return this.awardBadge(userId, key);
        }
        return Promise.resolve();
      };

      const promises: Promise<void>[] = [];

      if (completedCount >= 1) promises.push(award("first_course"));
      if (completedCount >= 2) promises.push(award("mini_learner"));
      if (completedCount >= 3) promises.push(award("mini_pro"));
      if (completedCount >= 5) promises.push(award("mini_scholar"));
      if (completedCount >= 10) promises.push(award("mini_master"));
      if (totalEnrollments >= 5) promises.push(award("knowledge_seeker"));

      // certified: 3+ certificates
      const certs = await db.select().from(certificates).where(eq(certificates.userId, userId));
      if (certs.length >= 3) promises.push(award("certified"));

      // perfectionist: any enrollment with progress = 100
      const perfectEnrollment = allEnrollments.find((e) => (e.progress || 0) >= 100);
      if (perfectEnrollment) promises.push(award("perfectionist"));

      // speed_runner: completed within 24 hours of enrolling
      const speedDone = completedEnrollments.some((e) => {
        if (!e.completedAt) return false;
        const diff = new Date(e.completedAt).getTime() - new Date(e.enrolledAt).getTime();
        return diff <= 24 * 60 * 60 * 1000;
      });
      if (speedDone) promises.push(award("speed_runner"));

      // hat_trick: 3 courses completed in any 7-day window
      if (completedCount >= 3) {
        const completedDates = completedEnrollments
          .filter((e) => e.completedAt)
          .map((e) => new Date(e.completedAt!).getTime())
          .sort((a, b) => a - b);
        let hatTrickEarned = false;
        for (let i = 0; i <= completedDates.length - 3; i++) {
          if (completedDates[i + 2] - completedDates[i] <= 7 * 24 * 60 * 60 * 1000) {
            hatTrickEarned = true;
            break;
          }
        }
        if (hatTrickEarned) promises.push(award("hat_trick"));
      }

      // mini_expert: completed all courses in at least one pathway
      const allPathways = await db.select().from(coursePathways).where(eq(coursePathways.isActive, true));
      for (const pathway of allPathways) {
        const steps = await db.select().from(pathwaySteps).where(eq(pathwaySteps.pathwayId, pathway.id));
        if (steps.length === 0) continue;
        const completedCourseIds = new Set(completedEnrollments.map((e) => e.courseId));
        const allCompleted = steps.every((s) => completedCourseIds.has(s.courseId));
        if (allCompleted) {
          promises.push(award("mini_expert"));
          break;
        }
      }

      await Promise.all(promises);
    } catch (err) {
      // Non-fatal — badge checking should not break the main flow
      console.error("checkAndAwardBadges error:", err);
    }
  }

  // ========== ACTIVITY EVENTS / TRACKING ==========
  async trackEvent(userId: number, eventType: string, data?: { courseId?: number; lessonId?: number; metadata?: any }): Promise<void> {
    try {
      await db.insert(activityEvents).values({
        userId,
        eventType,
        courseId: data?.courseId ?? null,
        lessonId: data?.lessonId ?? null,
        metadata: data?.metadata ?? null,
      });
    } catch (_err) {
      // Tracking should never crash the app — silently ignore errors
    }
  }

  async getActivityFeed(limit = 50): Promise<any[]> {
    try {
      const rows = await db
        .select({
          id: activityEvents.id,
          eventType: activityEvents.eventType,
          lessonId: activityEvents.lessonId,
          metadata: activityEvents.metadata,
          createdAt: activityEvents.createdAt,
          userName: users.name,
          userEmail: users.email,
          courseTitle: courses.title,
        })
        .from(activityEvents)
        .leftJoin(users, eq(activityEvents.userId, users.id))
        .leftJoin(courses, eq(activityEvents.courseId, courses.id))
        .orderBy(desc(activityEvents.createdAt))
        .limit(limit);
      return rows;
    } catch (_err) {
      return [];
    }
  }

  async getAnalyticsOverview(): Promise<any> {
    try {
      // Get base analytics
      const base = await this.getAnalytics();

      // Enrollments per day (last 30 days)
      const enrollmentsPerDay = await db.execute(sql`
        SELECT DATE(enrolled_at) as date, COUNT(*)::int as count
        FROM enrollments
        WHERE enrolled_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(enrolled_at)
        ORDER BY date
      `);

      // Completions per day (last 30 days)
      const completionsPerDay = await db.execute(sql`
        SELECT DATE(completed_at) as date, COUNT(*)::int as count
        FROM enrollments
        WHERE completed_at IS NOT NULL AND completed_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(completed_at)
        ORDER BY date
      `);

      // Time spent per day (last 30 days, from time_spent events)
      const timeSpentPerDay = await db.execute(sql`
        SELECT DATE(created_at) as date, COALESCE(SUM((metadata->>'seconds')::integer), 0)::int as seconds
        FROM activity_events
        WHERE event_type = 'time_spent' AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      // Active users per day (last 30 days)
      const activeUsersPerDay = await db.execute(sql`
        SELECT DATE(created_at) as date, COUNT(DISTINCT user_id)::int as count
        FROM activity_events
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      return {
        ...base,
        enrollmentsPerDay: enrollmentsPerDay.rows,
        completionsPerDay: completionsPerDay.rows,
        timeSpentPerDay: timeSpentPerDay.rows,
        activeUsersPerDay: activeUsersPerDay.rows,
      };
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("getAnalyticsOverview error:", err);
      }
      return await this.getAnalytics();
    }
  }

  async getCourseAnalyticsDeep(courseId: number): Promise<any> {
    try {
      const course = await this.getCourseById(courseId);
      if (!course) return null;

      // Get all lessons for this course
      const allLessons: any[] = [];
      for (const subj of course.subjects || []) {
        for (const mod of subj.modules || []) {
          for (const lesson of mod.lessons || []) {
            allLessons.push(lesson);
          }
        }
      }

      // Get all enrollments for this course
      const courseEnrollments = await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
      const enrolledCount = courseEnrollments.length;

      // Per-lesson stats
      const lessonStats = await Promise.all(allLessons.map(async (lesson) => {
        // How many students viewed this lesson
        const viewedResult = await db.execute(sql`
          SELECT COUNT(DISTINCT user_id)::int as count
          FROM activity_events
          WHERE event_type = 'lesson_view' AND lesson_id = ${lesson.id}
        `);
        const viewedCount = (viewedResult.rows[0] as any)?.count || 0;

        // How many completed this lesson
        const completedResult = await db.execute(sql`
          SELECT COUNT(DISTINCT lp.enrollment_id)::int as count
          FROM lesson_progress lp
          JOIN enrollments e ON e.id = lp.enrollment_id
          WHERE lp.lesson_id = ${lesson.id} AND lp.status = 'COMPLETED' AND e.course_id = ${courseId}
        `);
        const completedCount = (completedResult.rows[0] as any)?.count || 0;

        // Average time spent (seconds)
        const timeResult = await db.execute(sql`
          SELECT COALESCE(AVG((metadata->>'seconds')::integer), 0)::int as avg_seconds
          FROM activity_events
          WHERE event_type = 'time_spent' AND lesson_id = ${lesson.id}
        `);
        const avgSeconds = (timeResult.rows[0] as any)?.avg_seconds || 0;

        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          viewedCount,
          completedCount,
          viewedPct: enrolledCount > 0 ? Math.round((viewedCount / enrolledCount) * 100) : 0,
          completedPct: enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0,
          avgSeconds,
        };
      }));

      // Enrollment funnel
      const startedCount = allLessons.length > 0 ? (await db.execute(sql`
        SELECT COUNT(DISTINCT user_id)::int as count
        FROM activity_events
        WHERE event_type = 'lesson_view' AND lesson_id = ${allLessons[0].id}
      `)).rows[0] as any : { count: 0 };

      const halfwayLesson = allLessons[Math.floor(allLessons.length / 2)];
      const halfwayCount = halfwayLesson ? (await db.execute(sql`
        SELECT COUNT(DISTINCT user_id)::int as count
        FROM activity_events
        WHERE event_type = 'lesson_view' AND lesson_id = ${halfwayLesson.id}
      `)).rows[0] as any : { count: 0 };

      const completedEnrollCount = courseEnrollments.filter(e => e.status === "COMPLETED").length;

      const funnel = [
        { stage: "Enrolled", count: enrolledCount },
        { stage: "Started", count: startedCount?.count || 0 },
        { stage: "Halfway", count: halfwayCount?.count || 0 },
        { stage: "Completed", count: completedEnrollCount },
      ];

      // Quiz scores per lesson
      const quizScores = await db.execute(sql`
        SELECT l.id as lesson_id, l.title as lesson_title,
               AVG(qa.score)::numeric(5,1) as avg_score,
               COUNT(qa.id)::int as attempt_count
        FROM quizzes q
        JOIN lessons l ON l.id = q.lesson_id
        JOIN quiz_attempts qa ON qa.quiz_id = q.id
        JOIN modules m ON m.id = l.module_id
        JOIN subjects s ON s.id = m.subject_id
        WHERE s.course_id = ${courseId}
        GROUP BY l.id, l.title
      `);

      return {
        courseId,
        courseTitle: course.title,
        enrolledCount,
        lessonStats,
        funnel,
        quizScores: quizScores.rows,
      };
    } catch (err) {
      console.error("getCourseAnalyticsDeep error:", err);
      return null;
    }
  }

  async getStudentTimeSpent(userId: number): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT ae.course_id as "courseId", c.title as "courseTitle",
               COALESCE(SUM((ae.metadata->>'seconds')::integer), 0)::int as "totalSeconds"
        FROM activity_events ae
        LEFT JOIN courses c ON c.id = ae.course_id
        WHERE ae.event_type = 'time_spent' AND ae.user_id = ${userId}
        GROUP BY ae.course_id, c.title
      `);
      return result.rows as any[];
    } catch (_err) {
      return [];
    }
  }

  async getQuizAttemptCount(userId: number, lessonId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(activityEvents)
      .where(and(
        eq(activityEvents.userId, userId),
        eq(activityEvents.eventType, "quiz_submit"),
        eq(activityEvents.lessonId, lessonId)
      ));
    return result[0]?.count ?? 0;
  }

  async getLearningTimeOfDay(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*)::int as count
        FROM activity_events
        WHERE event_type IN ('lesson_view', 'lesson_complete', 'time_spent')
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `);
      return result.rows as any[];
    } catch (_err) {
      return [];
    }
  }

  async getDeviceBreakdown(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          metadata->>'isMobile' as is_mobile,
          COUNT(*)::int as count
        FROM activity_events
        WHERE event_type = 'login' AND metadata->>'isMobile' IS NOT NULL
        GROUP BY metadata->>'isMobile'
      `);
      return result.rows as any[];
    } catch (_err) {
      return [];
    }
  }

  async getCourseConversionFunnel(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          c.id, c.title,
          COUNT(DISTINCT CASE WHEN ae.event_type = 'course_page_view' THEN ae.user_id END) as page_views,
          COUNT(DISTINCT CASE WHEN ae.event_type = 'course_enroll' THEN ae.user_id END) as enrollments,
          COUNT(DISTINCT CASE WHEN ae.event_type = 'lesson_complete' THEN ae.user_id END) as started,
          COUNT(DISTINCT CASE WHEN e.status = 'COMPLETED' THEN e.user_id END) as completed
        FROM courses c
        LEFT JOIN activity_events ae ON ae.course_id = c.id
        LEFT JOIN enrollments e ON e.course_id = c.id
        GROUP BY c.id, c.title
        ORDER BY page_views DESC
        LIMIT 20
      `);
      return result.rows as any[];
    } catch (_err) {
      return [];
    }
  }

  async getDropOffAnalysis(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          ae.lesson_id,
          l.title as lesson_title,
          c.title as course_title,
          COUNT(CASE WHEN ae.event_type = 'lesson_view' THEN 1 END)::int as views,
          COUNT(CASE WHEN ae.event_type = 'lesson_abandon' THEN 1 END)::int as abandons,
          COUNT(CASE WHEN ae.event_type = 'lesson_complete' THEN 1 END)::int as completions,
          AVG(CASE WHEN ae.event_type = 'lesson_abandon' THEN (ae.metadata->>'secondsSpent')::int END) as avg_seconds_before_abandon
        FROM activity_events ae
        LEFT JOIN lessons l ON l.id = ae.lesson_id
        LEFT JOIN courses c ON c.id = ae.course_id
        WHERE ae.lesson_id IS NOT NULL
        GROUP BY ae.lesson_id, l.title, c.title
        HAVING COUNT(CASE WHEN ae.event_type = 'lesson_view' THEN 1 END) > 0
        ORDER BY abandons DESC
        LIMIT 50
      `);
      return result.rows as any[];
    } catch (_err) {
      return [];
    }
  }

  // ─── Email Template Categories ─────────────────────────────────────────────

  async getEmailTemplateCategories(): Promise<EmailTemplateCategory[]> {
    return db.select().from(emailTemplateCategories).orderBy(asc(emailTemplateCategories.name));
  }

  async createEmailTemplateCategory(data: { name: string; slug: string; color?: string; description?: string }): Promise<EmailTemplateCategory> {
    const [created] = await db.insert(emailTemplateCategories).values({
      name: data.name,
      slug: data.slug,
      color: data.color ?? "#6366f1",
      description: data.description,
    }).returning();
    return created;
  }

  async updateEmailTemplateCategory(id: number, data: Partial<{ name: string; color: string; description: string }>): Promise<EmailTemplateCategory | undefined> {
    const [updated] = await db.update(emailTemplateCategories).set(data).where(eq(emailTemplateCategories.id, id)).returning();
    return updated;
  }

  async deleteEmailTemplateCategory(id: number): Promise<void> {
    await db.delete(emailTemplateCategories).where(eq(emailTemplateCategories.id, id));
  }

  // ─── Email Templates ───────────────────────────────────────────────────────

  async getEmailTemplates(categoryId?: number): Promise<any[]> {
    await this.seedSystemEmailTemplates();
    const rows = await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
    const cats = await db.select().from(emailTemplateCategories);
    const catMap = new Map(cats.map(c => [c.id, c]));
    let result = rows.map(t => ({ ...t, category: t.categoryId ? catMap.get(t.categoryId) ?? null : null }));
    if (categoryId != null) {
      result = result.filter(t => t.categoryId === categoryId);
    }
    return result;
  }

  async getEmailTemplateById(id: number): Promise<EmailTemplate | undefined> {
    const [row] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return row;
  }

  async createEmailTemplate(data: { name: string; subject?: string; previewText?: string; categoryId?: number; isSystem?: boolean }): Promise<EmailTemplate> {
    const [created] = await db.insert(emailTemplates).values({
      name: data.name,
      subject: data.subject ?? "",
      previewText: data.previewText ?? "",
      categoryId: data.categoryId ?? null,
      blocks: [],
      isSystem: data.isSystem ?? false,
    }).returning();
    return created;
  }

  async updateEmailTemplate(id: number, data: Partial<{ name: string; subject: string; previewText: string; categoryId: number | null; blocks: any[] }>): Promise<EmailTemplate | undefined> {
    const [updated] = await db.update(emailTemplates).set({ ...data, updatedAt: new Date() }).where(eq(emailTemplates.id, id)).returning();
    return updated;
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  // ─── Email Automations ─────────────────────────────────────────────────────

  async getEmailAutomations(): Promise<any[]> {
    const rows = await db.select().from(emailAutomations).orderBy(asc(emailAutomations.name));
    const tmplIds = rows.map(r => r.templateId).filter((id): id is number => id != null);
    let tmplMap = new Map<number, EmailTemplate>();
    if (tmplIds.length > 0) {
      const tmpls = await db.select().from(emailTemplates).where(inArray(emailTemplates.id, tmplIds));
      tmplMap = new Map(tmpls.map(t => [t.id, t]));
    }
    return rows.map(r => ({ ...r, template: r.templateId ? tmplMap.get(r.templateId) ?? null : null }));
  }

  async getEmailAutomationByTrigger(trigger: string): Promise<EmailAutomation | undefined> {
    const [row] = await db.select().from(emailAutomations)
      .where(and(eq(emailAutomations.trigger, trigger), eq(emailAutomations.isActive, true)))
      .limit(1);
    return row;
  }

  async createEmailAutomation(data: { name: string; trigger: string; templateId?: number; delayMinutes?: number; description?: string }): Promise<EmailAutomation> {
    const [created] = await db.insert(emailAutomations).values({
      name: data.name,
      trigger: data.trigger,
      templateId: data.templateId ?? null,
      delayMinutes: data.delayMinutes ?? 0,
      description: data.description,
      isActive: true,
    }).returning();
    return created;
  }

  async updateEmailAutomation(id: number, data: Partial<{ name: string; trigger: string; templateId: number | null; isActive: boolean; delayMinutes: number; description: string }>): Promise<EmailAutomation | undefined> {
    const [updated] = await db.update(emailAutomations).set(data).where(eq(emailAutomations.id, id)).returning();
    return updated;
  }

  async deleteEmailAutomation(id: number): Promise<void> {
    await db.delete(emailAutomations).where(eq(emailAutomations.id, id));
  }

  // ─── Email Rendering ───────────────────────────────────────────────────────

  private blockToHtml(block: { type: string; content: Record<string, any> }): string {
    const { type, content } = block;
    switch (type) {
      case "HEADING": {
        const level = content.level ?? 1;
        const align = content.align ?? "left";
        const sizes: Record<number, string> = { 1: "28px", 2: "22px", 3: "18px" };
        const size = sizes[level] ?? "28px";
        return `<h${level} style="font-size:${size};font-weight:700;color:#111827;margin:0 0 16px 0;text-align:${align};">${content.text ?? ""}</h${level}>`;
      }
      case "TEXT": {
        return `<p style="font-size:16px;line-height:1.6;color:#374151;margin:0 0 16px 0;">${content.html ?? content.text ?? ""}</p>`;
      }
      case "BUTTON": {
        const align = content.align ?? "center";
        const color = content.color ?? "#6366f1";
        return `<div style="text-align:${align};margin:16px 0;"><a href="${content.url ?? "#"}" style="display:inline-block;background:${color};color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">${content.text ?? "Click here"}</a></div>`;
      }
      case "IMAGE": {
        const align = content.align ?? "center";
        return `<div style="text-align:${align};margin:16px 0;"><img src="${content.url ?? ""}" alt="${content.alt ?? ""}" style="max-width:100%;height:auto;" /></div>`;
      }
      case "DIVIDER": {
        return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`;
      }
      case "SPACER": {
        const height = content.height ?? 24;
        return `<div style="height:${height}px;"></div>`;
      }
      case "VARIABLE": {
        return content.variable ?? "";
      }
      default:
        return "";
    }
  }

  async renderEmailTemplate(templateId: number, variables: Record<string, string>): Promise<{ subject: string; html: string } | null> {
    const template = await this.getEmailTemplateById(templateId);
    if (!template) return null;

    const blocks: any[] = Array.isArray(template.blocks) ? template.blocks as any[] : [];
    const blocksHtml = blocks.map(b => this.blockToHtml(b)).join("\n");

    const shell = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="padding:40px;">
          ${blocksHtml}
        </td></tr>
        <tr><td style="padding:20px 40px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;">
          Sent by CourseMini by EQC Institute • <a href="{{siteUrl}}" style="color:#9ca3af;">{{siteUrl}}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let html = shell;
    let subject = template.subject ?? "";

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      html = html.split(placeholder).join(value);
      subject = subject.split(placeholder).join(value);
    }

    return { subject, html };
  }

  async fireEmailAutomation(trigger: string, userId: number, variables?: Record<string, string>): Promise<void> {
    const automation = await this.getEmailAutomationByTrigger(trigger);
    if (!automation || !automation.templateId) return;

    const user = await this.getUser(userId);
    if (!user) return;

    const mergedVars: Record<string, string> = {
      studentName: user.name,
      studentEmail: user.email,
      siteUrl: process.env.SITE_URL ?? "http://localhost:5000",
      ...variables,
    };

    const rendered = await this.renderEmailTemplate(automation.templateId, mergedVars);
    if (!rendered) return;

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n📧 [EMAIL AUTOMATION: ${trigger}]`);
      console.log(`   To: ${user.email} (${user.name})`);
      console.log(`   Subject: ${rendered.subject}`);
      console.log(`   Template: ${automation.name}`);
      console.log(`   [HTML body omitted in dev — ${rendered.html.length} chars]\n`);
    }
    // In production: send via nodemailer or other provider
  }

  // ─── System Email Template Seeding ────────────────────────────────────────

  async seedSystemEmailTemplates(): Promise<void> {
    const existing = await db.select({ id: emailTemplates.id }).from(emailTemplates).where(eq(emailTemplates.isSystem, true)).limit(1);
    if (existing.length > 0) return;

    const makeBlocks = (heading: string, body: string, buttonText: string, buttonVar: string, buttonColor = "#6366f1") => [
      { id: "1", type: "HEADING", content: { text: heading, level: 1, align: "center" } },
      { id: "2", type: "TEXT", content: { html: body } },
      { id: "3", type: "DIVIDER", content: {} },
      { id: "4", type: "BUTTON", content: { text: buttonText, url: buttonVar, color: buttonColor, align: "center" } },
    ];

    const templates = [
      {
        name: "Welcome Email",
        subject: "Welcome to CourseMini by EQC Institute, {{studentName}}!",
        isSystem: true,
        blocks: makeBlocks(
          "Welcome to CourseMini by EQC Institute! 🎉",
          "Hi {{studentName}},<br><br>We're thrilled to have you on board. CourseMini by EQC Institute is your go-to platform for learning new skills and advancing your career. Start exploring our courses today!",
          "Start Learning",
          "{{siteUrl}}",
          "#6366f1"
        ),
      },
      {
        name: "Course Enrollment Confirmation",
        subject: "You're enrolled in {{courseTitle}}!",
        isSystem: true,
        blocks: makeBlocks(
          "You're enrolled! 📚",
          "Hi {{studentName}},<br><br>You've successfully enrolled in <strong>{{courseTitle}}</strong>. Your learning journey starts now!",
          "Start Course",
          "{{courseUrl}}",
          "#10b981"
        ),
      },
      {
        name: "Course Completion",
        subject: "Congratulations on completing {{courseTitle}}!",
        isSystem: true,
        blocks: makeBlocks(
          "Congratulations! 🎓",
          "Hi {{studentName}},<br><br>You've completed <strong>{{courseTitle}}</strong>. Amazing work — your certificate is waiting for you!",
          "View Certificate",
          "{{certificateUrl}}",
          "#f59e0b"
        ),
      },
      {
        name: "Certificate Issued",
        subject: "Your certificate for {{courseTitle}} is ready!",
        isSystem: true,
        blocks: makeBlocks(
          "Your Certificate is Ready! 📜",
          "Congratulations {{studentName}}! Your certificate for <strong>{{courseTitle}}</strong> is ready to download and share.",
          "View Certificate",
          "{{certificateUrl}}",
          "#f59e0b"
        ),
      },
      {
        name: "Badge Earned",
        subject: "You earned the {{badgeName}} badge!",
        isSystem: true,
        blocks: makeBlocks(
          "You earned a badge! ⭐",
          "Hi {{studentName}},<br><br>You've earned the <strong>{{badgeName}}</strong> badge. Keep up the fantastic work!",
          "View My Badges",
          "{{siteUrl}}/dashboard",
          "#8b5cf6"
        ),
      },
    ];

    for (const tmpl of templates) {
      await db.insert(emailTemplates).values({
        name: tmpl.name,
        subject: tmpl.subject,
        previewText: "",
        categoryId: null,
        blocks: tmpl.blocks,
        isSystem: true,
      });
    }
  }
}

export const storage = new DatabaseStorage();
