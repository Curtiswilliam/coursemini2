import { storage } from "./storage";
import { sendEmail } from "./email";
import { db } from "./db";
import { dripEmails, users, courses, activityEvents } from "../shared/schema";
import { eq, lte, and, desc } from "drizzle-orm";

const APP_URL = process.env.APP_URL || "http://localhost:5000";

async function buildDripEmail(type: string, user: any, course: any) {
  const courseUrl = course ? `${APP_URL}/learn/${course.slug}` : APP_URL;
  const templates: Record<string, { subject: string; html: string }> = {
    day1: {
      subject: `Welcome to ${course?.title || "your course"} — let's get started!`,
      html: `<p>Hi ${user.name},</p><p>You're enrolled in <strong>${course?.title}</strong>. Your learning journey starts now.</p><p><a href="${courseUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0">Start Learning</a></p><p>Tip: even 15 minutes a day adds up fast.</p><p>The CourseMini Team</p>`,
    },
    day3: {
      subject: `How's ${course?.title || "your course"} going?`,
      html: `<p>Hi ${user.name},</p><p>Just checking in on your progress with <strong>${course?.title}</strong>. You're 3 days in — great time to build some momentum.</p><p><a href="${courseUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0">Continue Learning</a></p><p>The CourseMini Team</p>`,
    },
    day7: {
      subject: `One week in — keep your ${course?.title || "course"} momentum going`,
      html: `<p>Hi ${user.name},</p><p>It's been a week since you started <strong>${course?.title}</strong>. Learners who make it to week 2 are 3x more likely to complete the course.</p><p><a href="${courseUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0">Jump Back In</a></p><p>The CourseMini Team</p>`,
    },
    day30: {
      subject: `Still thinking about ${course?.title || "your course"}?`,
      html: `<p>Hi ${user.name},</p><p>A month ago you started <strong>${course?.title}</strong>. There's still time to finish strong and earn your certificate.</p><p><a href="${courseUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0">Pick Up Where You Left Off</a></p><p>The CourseMini Team</p>`,
    },
    post_complete_day3: {
      subject: `Loved ${course?.title || "your course"}? Leave a quick review`,
      html: `<p>Hi ${user.name},</p><p>Congrats again on completing <strong>${course?.title}</strong>! Your feedback helps other learners. Would you mind leaving a quick review?</p><p><a href="${APP_URL}/courses/${course?.slug}" style="background:#10b981;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0">Leave a Review</a></p><p>The CourseMini Team</p>`,
    },
    post_complete_day7: {
      subject: `What's next after ${course?.title || "your course"}?`,
      html: `<p>Hi ${user.name},</p><p>You completed <strong>${course?.title}</strong> — amazing work. Ready for your next challenge? Browse our course library to keep growing.</p><p><a href="${APP_URL}/courses" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0">Explore More Courses</a></p><p>The CourseMini Team</p>`,
    },
    inactivity: {
      subject: `We miss you at CourseMini — your progress is waiting`,
      html: `<p>Hi ${user.name},</p><p>It's been a while since you last logged in. Your courses are still here, right where you left them.</p><p><a href="${APP_URL}/dashboard" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0">Get Back to Learning</a></p><p>The CourseMini Team</p>`,
    },
  };
  return templates[type] || { subject: "Update from CourseMini", html: `<p>Hi ${user.name}, check out CourseMini!</p>` };
}

export async function processDripEmails() {
  try {
    const now = new Date();
    const pending = await db
      .select()
      .from(dripEmails)
      .where(and(eq(dripEmails.status, "pending"), lte(dripEmails.scheduledAt, now)))
      .limit(50);

    for (const drip of pending) {
      try {
        const [user] = await db.select().from(users).where(eq(users.id, drip.userId));
        if (!user || (user as any).isActive === false) {
          await db.update(dripEmails).set({ status: "skipped" }).where(eq(dripEmails.id, drip.id));
          continue;
        }
        let course = null;
        if (drip.courseId) {
          const [c] = await db.select().from(courses).where(eq(courses.id, drip.courseId));
          course = c;
        }
        const { subject, html } = await buildDripEmail(drip.type, user, course);
        await sendEmail({ to: { email: user.email, name: user.name }, subject, html });
        await db.update(dripEmails).set({ status: "sent", sentAt: now }).where(eq(dripEmails.id, drip.id));
      } catch (e) {
        await db.update(dripEmails).set({ status: "skipped" }).where(eq(dripEmails.id, drip.id));
      }
    }
  } catch (e) {
    console.error("[drip] processDripEmails error:", e);
  }
}

export async function scheduleDripSequence(userId: number, courseId: number) {
  const now = Date.now();
  const entries = [
    { type: "day1", delayMs: 60 * 60 * 1000 },
    { type: "day3", delayMs: 3 * 24 * 60 * 60 * 1000 },
    { type: "day7", delayMs: 7 * 24 * 60 * 60 * 1000 },
    { type: "day30", delayMs: 30 * 24 * 60 * 60 * 1000 },
  ];
  for (const e of entries) {
    await db.insert(dripEmails).values({
      userId,
      courseId,
      type: e.type,
      scheduledAt: new Date(now + e.delayMs),
      status: "pending",
    });
  }
}

export async function schedulePostCompletionSequence(userId: number, courseId: number) {
  const now = Date.now();
  const entries = [
    { type: "post_complete_day3", delayMs: 3 * 24 * 60 * 60 * 1000 },
    { type: "post_complete_day7", delayMs: 7 * 24 * 60 * 60 * 1000 },
  ];
  for (const e of entries) {
    await db.insert(dripEmails).values({
      userId,
      courseId,
      type: e.type,
      scheduledAt: new Date(now + e.delayMs),
      status: "pending",
    });
  }
}

export async function scheduleInactivityEmail(userId: number) {
  const existing = await db
    .select()
    .from(dripEmails)
    .where(and(eq(dripEmails.userId, userId), eq(dripEmails.type, "inactivity"), eq(dripEmails.status, "pending")));
  if (existing.length > 0) return;
  await db.insert(dripEmails).values({
    userId,
    courseId: null,
    type: "inactivity",
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "pending",
  });
}

export async function checkAndScheduleInactivity() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const allStudents = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(and(eq(users.role, "STUDENT"), eq(users.isActive, true)));

    for (const student of allStudents) {
      const [lastLogin] = await db
        .select()
        .from(activityEvents)
        .where(and(eq(activityEvents.userId, student.id), eq(activityEvents.eventType, "login")))
        .orderBy(desc(activityEvents.createdAt))
        .limit(1);

      if (!lastLogin || lastLogin.createdAt < sevenDaysAgo) {
        await scheduleInactivityEmail(student.id);
      }
    }
  } catch (e) {
    console.error("[drip] checkAndScheduleInactivity error:", e);
  }
}

export function startDripProcessor() {
  processDripEmails();
  setInterval(processDripEmails, 60 * 60 * 1000);
  // Check inactivity daily
  checkAndScheduleInactivity();
  setInterval(checkAndScheduleInactivity, 24 * 60 * 60 * 1000);
}
