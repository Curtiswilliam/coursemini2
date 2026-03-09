import { db } from "./db";
import { eq, and, desc, asc, ilike, sql, count } from "drizzle-orm";
import {
  users, courses, categories, chapters, lessons,
  enrollments, lessonProgress, reviews,
  type InsertUser, type User,
  type InsertCourse, type Course,
  type InsertCategory, type Category,
  type InsertChapter, type Chapter,
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

  getCourses(filters?: { search?: string; category?: string; level?: string; sort?: string; featured?: boolean; limit?: number }): Promise<any[]>;
  getCourseBySlug(slug: string): Promise<any | undefined>;
  getCourseById(id: number): Promise<any | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined>;
  getCoursesByInstructor(instructorId: number): Promise<any[]>;

  getChaptersByCourse(courseId: number): Promise<Chapter[]>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: number, data: Partial<InsertChapter>): Promise<Chapter | undefined>;
  deleteChapter(id: number): Promise<void>;

  getLessonsByChapter(chapterId: number): Promise<Lesson[]>;
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

  async getCourses(filters?: { search?: string; category?: string; level?: string; sort?: string; featured?: boolean; limit?: number }): Promise<any[]> {
    const allCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.status, "PUBLISHED"))
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

        const courseChapters = await db.select().from(chapters).where(eq(chapters.courseId, course.id));
        let lessonCount = 0;
        for (const ch of courseChapters) {
          const [lc] = await db.select({ count: count() }).from(lessons).where(eq(lessons.chapterId, ch.id));
          lessonCount += lc.count;
        }

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

    const courseChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.courseId, course.id))
      .orderBy(asc(chapters.position));

    const chaptersWithLessons = await Promise.all(
      courseChapters.map(async (ch) => {
        const chLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.chapterId, ch.id))
          .orderBy(asc(lessons.position));
        return { ...ch, lessons: chLessons };
      })
    );

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
      chapters: chaptersWithLessons,
      enrollmentCount: enrollCount.count,
      reviews: reviewsWithUsers,
    };
  }

  async getCourseById(id: number): Promise<any | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) return undefined;

    const courseChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.courseId, course.id))
      .orderBy(asc(chapters.position));

    const chaptersWithLessons = await Promise.all(
      courseChapters.map(async (ch) => {
        const chLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.chapterId, ch.id))
          .orderBy(asc(lessons.position));
        return { ...ch, lessons: chLessons };
      })
    );

    const [enrollCount] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.courseId, course.id));

    return {
      ...course,
      chapters: chaptersWithLessons,
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

  async getChaptersByCourse(courseId: number): Promise<Chapter[]> {
    return db.select().from(chapters).where(eq(chapters.courseId, courseId)).orderBy(asc(chapters.position));
  }

  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const [created] = await db.insert(chapters).values(chapter).returning();
    return created;
  }

  async updateChapter(id: number, data: Partial<InsertChapter>): Promise<Chapter | undefined> {
    const [updated] = await db.update(chapters).set(data).where(eq(chapters.id, id)).returning();
    return updated;
  }

  async deleteChapter(id: number): Promise<void> {
    await db.delete(chapters).where(eq(chapters.id, id));
  }

  async getLessonsByChapter(chapterId: number): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.chapterId, chapterId)).orderBy(asc(lessons.position));
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
    const courseIds = instructorCourses.map((c) => c.id);

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
