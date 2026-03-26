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
  unique,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["ADMIN", "INSTRUCTOR", "STUDENT"]);
export const courseStatusEnum = pgEnum("course_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const courseLevelEnum = pgEnum("course_level", ["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["ACTIVE", "COMPLETED", "EXPIRED", "SUSPENDED"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["VIDEO", "TEXT", "QUIZ", "ASSIGNMENT", "DOWNLOAD", "AUDIO"]);
export const progressStatusEnum = pgEnum("progress_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);
export const couponTypeEnum = pgEnum("coupon_type", ["PERCENTAGE", "FIXED"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "COMPLETED", "REFUNDED"]);
export const notificationTypeEnum = pgEnum("notification_type", ["INFO", "SUCCESS", "WARNING"]);
export const affiliateReferralStatusEnum = pgEnum("affiliate_referral_status", ["PENDING", "APPROVED", "PAID"]);
export const quizQuestionTypeEnum = pgEnum("quiz_question_type", ["MULTIPLE_CHOICE", "TRUE_FALSE"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  phone: text("phone"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  country: text("country"),
  stateRegion: text("state_region"),
  dateOfBirth: text("date_of_birth"),
  avatar: text("avatar"),
  bio: text("bio"),
  role: roleEnum("role").notNull().default("STUDENT"),
  isActive: boolean("is_active").notNull().default(true),
  highestQualification: text("highest_qualification"),
  workStatus: text("work_status"),
  birthYear: integer("birth_year"),
  interests: jsonb("interests"),
  intakeCompletedAt: timestamp("intake_completed_at"),
  weeklyGoalLessons: integer("weekly_goal_lessons").default(5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
});

export const phoneVerifications = pgTable("phone_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
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
  archivedAt: timestamp("archived_at"),
  waitlistEnabled: boolean("waitlist_enabled").default(false),
  salesHeadline: text("sales_headline"),
  salesSubheadline: text("sales_subheadline"),
  salesVideoUrl: text("sales_video_url"),
  salesTestimonials: jsonb("sales_testimonials"),
  salesFaq: jsonb("sales_faq"),
  salesFeatures: jsonb("sales_features"),
  landingPageEnabled: boolean("landing_page_enabled").default(false),
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
  dripDays: integer("drip_days"),
  minReadSeconds: integer("min_read_seconds"),
  minVideoPercent: integer("min_video_percent"),
  minQuizScore: integer("min_quiz_score"),
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

// Coupons
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: couponTypeEnum("type").notNull().default("PERCENTAGE"),
  value: real("value").notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  courseId: integer("course_id").references(() => courses.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  couponId: integer("coupon_id").references(() => coupons.id),
  amount: real("amount").notNull(),
  originalAmount: real("original_amount").notNull(),
  status: orderStatusEnum("status").notNull().default("COMPLETED"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bundles
export const bundles = pgTable("bundles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  price: real("price").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bundleCourses = pgTable("bundle_courses", {
  id: serial("id").primaryKey(),
  bundleId: integer("bundle_id").references(() => bundles.id, { onDelete: "cascade" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
});

// Certificates
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  certificateCode: text("certificate_code").notNull().unique(),
});

// User Badges
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  badgeKey: text("badge_key").notNull(),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
});

// Activity Events
export const activityEvents = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  lessonId: integer("lesson_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ActivityEvent = typeof activityEvents.$inferSelect;

// ─── Email Templates ──────────────────────────────────────────────────────────

export const emailTemplateCategories = pgTable("email_template_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  color: text("color").notNull().default("#6366f1"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull().default(""),
  previewText: text("preview_text").default(""),
  categoryId: integer("category_id").references(() => emailTemplateCategories.id, { onDelete: "set null" }),
  blocks: jsonb("blocks").notNull().default([]),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailAutomations = pgTable("email_automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(),
  templateId: integer("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  delayMinutes: integer("delay_minutes").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Site Settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
});

// Student Groups / Cohorts
export const studentGroups = pgTable("student_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentGroupMembers = pgTable("student_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => studentGroups.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
});

// Quizzes
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull().unique(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }).notNull(),
  question: text("question").notNull(),
  type: quizQuestionTypeEnum("type").notNull().default("MULTIPLE_CHOICE"),
  position: integer("position").notNull().default(0),
});

export const quizOptions = pgTable("quiz_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => quizQuestions.id, { onDelete: "cascade" }).notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  score: real("score").notNull(),
  passed: boolean("passed").notNull().default(false),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Affiliates
export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  code: text("code").notNull().unique(),
  commissionRate: real("commission_rate").notNull().default(0.3),
  totalEarned: real("total_earned").notNull().default(0),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateReferrals = pgTable("affiliate_referrals", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  commission: real("commission").notNull(),
  status: affiliateReferralStatusEnum("status").notNull().default("PENDING"),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull().default("INFO"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== EMAIL CAMPAIGNS ==========
export const campaignTriggerEnum = pgEnum("campaign_trigger", [
  "USER_SIGNUP", "EMAIL_VERIFIED", "COURSE_ENROLLED", "COURSE_COMPLETED", "PATHWAY_STEP_COMPLETED",
]);
export const campaignSendStatusEnum = pgEnum("campaign_send_status", ["PENDING", "SENT", "FAILED"]);

export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: campaignTriggerEnum("trigger_type").notNull(),
  delayHours: integer("delay_hours").notNull().default(0),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignSends = pgTable("campaign_sends", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  status: campaignSendStatusEnum("status").notNull().default("PENDING"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== COURSE PATHWAYS ==========
export const coursePathways = pgTable("course_pathways", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pathwaySteps = pgTable("pathway_steps", {
  id: serial("id").primaryKey(),
  pathwayId: integer("pathway_id").references(() => coursePathways.id, { onDelete: "cascade" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  position: integer("position").notNull().default(0),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
});

export const userPathwayProgress = pgTable("user_pathway_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  pathwayId: integer("pathway_id").references(() => coursePathways.id, { onDelete: "cascade" }).notNull(),
  currentStep: integer("current_step").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blockTypeEnum = pgEnum("block_type", [
  "TEXT", "HEADING", "IMAGE", "VIDEO", "BUTTON", "DIVIDER",
  "QUOTE", "BULLETED_LIST", "NUMBERED_LIST", "ACCORDION", "TABS",
  "PROCESS", "FLASHCARDS", "KNOWLEDGE_CHECK", "TABLE", "GALLERY",
  "CALLOUT", "TIMELINE", "CODE", "FILE", "NEXT_BUTTON", "NOTES", "VIDEO_DESCRIPTION"
]);

export const lessonNotes = pgTable("lesson_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessonBookmarks = pgTable("lesson_bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseWaitlist = pgTable("course_waitlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dripEmails = pgTable("drip_emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: jsonb("events").notNull().default([]),
  secret: text("secret"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhook_id").references(() => webhooks.id, { onDelete: "cascade" }).notNull(),
  event: text("event").notNull(),
  payload: jsonb("payload"),
  status: text("status").notNull().default("pending"),
  responseCode: integer("response_code"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessonBlocks = pgTable("lesson_blocks", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  type: blockTypeEnum("type").notNull(),
  content: text("content").notNull().default("{}"),
  position: integer("position").notNull().default(0),
  settings: text("settings").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type LessonBlock = typeof lessonBlocks.$inferSelect;
export type InsertLessonBlock = typeof lessonBlocks.$inferInsert;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true, completedAt: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true, completedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true, usedCount: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertBundleSchema = createInsertSchema(bundles).omit({ id: true, createdAt: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issuedAt: true });
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true });
export const insertStudentGroupSchema = createInsertSchema(studentGroups).omit({ id: true, createdAt: true });
export const insertStudentGroupMemberSchema = createInsertSchema(studentGroupMembers).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true });
export const insertQuizOptionSchema = createInsertSchema(quizOptions).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, completedAt: true });
export const insertAffiliateSchema = createInsertSchema(affiliates).omit({ id: true, createdAt: true });
export const insertAffiliateReferralSchema = createInsertSchema(affiliateReferrals).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertLessonBlockSchema = createInsertSchema(lessonBlocks).omit({ id: true, createdAt: true });
export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({ id: true, createdAt: true });
export const insertCampaignSendSchema = createInsertSchema(campaignSends).omit({ id: true, createdAt: true });
export const insertCoursePathwaySchema = createInsertSchema(coursePathways).omit({ id: true, createdAt: true });
export const insertPathwayStepSchema = createInsertSchema(pathwaySteps).omit({ id: true });
export const insertUserPathwayProgressSchema = createInsertSchema(userPathwayProgress).omit({ id: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, awardedAt: true });
export const insertLessonNoteSchema = createInsertSchema(lessonNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLessonBookmarkSchema = createInsertSchema(lessonBookmarks).omit({ id: true, createdAt: true });
export const insertCourseWaitlistSchema = createInsertSchema(courseWaitlist).omit({ id: true, createdAt: true });
export const insertDripEmailSchema = createInsertSchema(dripEmails).omit({ id: true, createdAt: true });
export const insertWebhookSchema = createInsertSchema(webhooks).omit({ id: true, createdAt: true });
export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries).omit({ id: true, createdAt: true });

// Types
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
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertBundle = z.infer<typeof insertBundleSchema>;
export type Bundle = typeof bundles.$inferSelect;
export type BundleCourse = typeof bundleCourses.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertStudentGroup = z.infer<typeof insertStudentGroupSchema>;
export type StudentGroup = typeof studentGroups.$inferSelect;
export type StudentGroupMember = typeof studentGroupMembers.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizOption = typeof quizOptions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = typeof affiliates.$inferSelect;
export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertLessonBlockSchema = z.infer<typeof insertLessonBlockSchema>;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertCampaignSend = z.infer<typeof insertCampaignSendSchema>;
export type CampaignSend = typeof campaignSends.$inferSelect;
export type InsertCoursePathway = z.infer<typeof insertCoursePathwaySchema>;
export type CoursePathway = typeof coursePathways.$inferSelect;
export type InsertPathwayStep = z.infer<typeof insertPathwayStepSchema>;
export type PathwayStep = typeof pathwaySteps.$inferSelect;
export type UserPathwayProgress = typeof userPathwayProgress.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

export type EmailTemplateCategory = typeof emailTemplateCategories.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type EmailAutomation = typeof emailAutomations.$inferSelect;

export type LessonNote = typeof lessonNotes.$inferSelect;
export type InsertLessonNote = z.infer<typeof insertLessonNoteSchema>;
export type LessonBookmark = typeof lessonBookmarks.$inferSelect;
export type InsertLessonBookmark = z.infer<typeof insertLessonBookmarkSchema>;
export type CourseWaitlist = typeof courseWaitlist.$inferSelect;
export type InsertCourseWaitlist = z.infer<typeof insertCourseWaitlistSchema>;
export type DripEmail = typeof dripEmails.$inferSelect;
export type InsertDripEmail = z.infer<typeof insertDripEmailSchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = z.infer<typeof insertWebhookDeliverySchema>;
