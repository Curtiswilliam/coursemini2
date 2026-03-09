import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  real,
  serial,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["ADMIN", "INSTRUCTOR", "STUDENT"]);
export const courseStatusEnum = pgEnum("course_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const courseLevelEnum = pgEnum("course_level", ["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["ACTIVE", "COMPLETED", "EXPIRED", "SUSPENDED"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["VIDEO", "TEXT", "QUIZ", "ASSIGNMENT", "DOWNLOAD", "AUDIO"]);
export const progressStatusEnum = pgEnum("progress_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  bio: text("bio"),
  role: roleEnum("role").notNull().default("STUDENT"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  thumbnail: text("thumbnail"),
  price: real("price").default(0),
  salePrice: real("sale_price"),
  status: courseStatusEnum("status").notNull().default("DRAFT"),
  categoryId: integer("category_id").references(() => categories.id),
  instructorId: integer("instructor_id").references(() => users.id).notNull(),
  level: courseLevelEnum("level").default("BEGINNER"),
  language: text("language").default("English"),
  learningOutcomes: text("learning_outcomes"),
  prerequisites: text("prerequisites"),
  isFree: boolean("is_free").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "cascade" }).notNull(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: lessonTypeEnum("type").notNull().default("TEXT"),
  position: integer("position").notNull().default(0),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }).notNull(),
  duration: integer("duration"),
  content: text("content"),
  videoUrl: text("video_url"),
  isFree: boolean("is_free").default(false),
  isPreview: boolean("is_preview").default(false),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  status: enrollmentStatusEnum("status").notNull().default("ACTIVE"),
  progress: real("progress").default(0),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id, { onDelete: "cascade" }).notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  status: progressStatusEnum("status").notNull().default("NOT_STARTED"),
  completedAt: timestamp("completed_at"),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true, completedAt: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true, completedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
