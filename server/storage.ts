import { db } from "./db";
import { eq, and, desc, asc, ilike, sql, count } from "drizzle-orm";
import {
  users, courses, categories, subjects, modules, lessons,
  enrollments, lessonProgress, reviews,
  type InsertUser, type User,
  type InsertCourse, type Course,
  type InsertCategory, type Category,
  type InsertSubject, type Subject,
  type InsertModule, type Module,
  type InsertLesson, type Lesson,
  type InsertEnrollment, type Enrollment,
  type InsertLessonProgress, type LessonProgress,
  type InsertReview, type Review,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;

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
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, data: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<void>;

  getEnrollmentsByUser(userId: number): Promise<any[]>;
  getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, data: Partial<InsertEnrollment>): Promise<void>;

  getLessonProgressByEnrollment(enrollmentId: number): Promise<LessonProgress[]>;
  upsertLessonProgress(enrollmentId: number, lessonId: number, status: string): Promise<void>;

  getStats(): Promise<any>;
  getAdminStats(instructorId: number): Promise<any>;
  getStudents(): Promise<any[]>;
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

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ role: role as any }).where(eq(users.id, id)).returning();
    return updated;
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
            return { ...mod, lessons: modLessons };
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

  async getStudents(): Promise<any[]> {
    const allStudents = await db.select().from(users).where(eq(users.role, "STUDENT"));
    return Promise.all(
      allStudents.map(async (student) => {
        const [enrollCount] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.userId, student.id));
        return { ...student, enrollmentCount: enrollCount.count, password: undefined };
      })
    );
  }
}

export const storage = new DatabaseStorage();
