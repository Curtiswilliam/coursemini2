import { storage } from "./storage";
import { sendEmail } from "./email";

type TriggerType = "USER_SIGNUP" | "EMAIL_VERIFIED" | "COURSE_ENROLLED" | "COURSE_COMPLETED" | "PATHWAY_STEP_COMPLETED";

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

async function dispatchSend(sendId: number, campaign: any, user: any, vars: Record<string, string>) {
  const subject = renderTemplate(campaign.subject, vars);
  const body = renderTemplate(campaign.body, vars);
  try {
    await sendEmail({
      to: { email: user.email, name: user.name },
      subject,
      html: body,
    });
    await storage.updateCampaignSend(sendId, { status: "SENT", sentAt: new Date() });
  } catch (e) {
    await storage.updateCampaignSend(sendId, { status: "FAILED", error: String(e) });
    throw e;
  }
}

export async function fireCampaignTrigger(
  trigger: TriggerType,
  userId: number,
  courseId?: number,
): Promise<void> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return;

    const campaigns = await storage.getActiveCampaignsByTrigger(trigger, courseId ?? null);
    const course = courseId ? await storage.getCourseById(courseId) : null;

    const vars: Record<string, string> = {
      user_name: user.name,
      user_email: user.email,
      course_title: course?.title ?? "",
      course_url: course ? `/courses/${course.slug}` : "",
    };

    for (const campaign of campaigns) {
      const scheduledAt = new Date(Date.now() + (campaign.delayHours ?? 0) * 3_600_000);
      const send = await storage.createCampaignSend({
        campaignId: campaign.id,
        userId,
        courseId: courseId ?? null,
        status: "PENDING",
        scheduledAt,
      } as any);

      if ((campaign.delayHours ?? 0) === 0) {
        await dispatchSend(send.id, campaign, user, vars);
      } else {
        // Schedule for later — fire via setTimeout (process stays alive in dev)
        setTimeout(async () => {
          try {
            await dispatchSend(send.id, campaign, user, vars);
          } catch (e) {
            await storage.updateCampaignSend(send.id, { status: "FAILED", error: String(e) });
          }
        }, (campaign.delayHours ?? 0) * 3_600_000);
      }
    }

    // Pathway progression — only on COURSE_COMPLETED
    if (trigger === "COURSE_COMPLETED" && courseId) {
      await handlePathwayProgression(userId, courseId, user, vars);
    }
  } catch (e) {
    console.error("[campaigns] fireCampaignTrigger error:", e);
  }
}

async function handlePathwayProgression(
  userId: number,
  courseId: number,
  user: any,
  baseVars: Record<string, string>,
) {
  const pathwayMatches = await storage.getPathwaysContainingCourse(courseId);

  for (const match of pathwayMatches) {
    // Update user's progress in this pathway
    await storage.upsertUserPathwayProgress(userId, match.pathwayId, match.position);

    // Fire the step's linked campaign (if any) — it markets the NEXT course
    if (match.campaignId) {
      const campaign = await storage.getCampaignById(match.campaignId);
      if (!campaign || !campaign.isActive) continue;

      // Find the next step in this pathway
      const steps = await storage.getPathwaySteps(match.pathwayId);
      const nextStep = steps.find((s: any) => s.position === match.position + 1);
      const nextCourse = nextStep ? await storage.getCourseById(nextStep.courseId) : null;

      const vars: Record<string, string> = {
        ...baseVars,
        pathway_name: match.pathwayName ?? "",
        next_course_title: nextCourse?.title ?? "",
        next_course_url: nextCourse ? `/courses/${nextCourse.slug}` : "",
      };

      const scheduledAt = new Date(Date.now() + (campaign.delayHours ?? 0) * 3_600_000);
      const send = await storage.createCampaignSend({
        campaignId: campaign.id,
        userId,
        courseId: nextStep?.courseId ?? null,
        status: "PENDING",
        scheduledAt,
      } as any);

      if ((campaign.delayHours ?? 0) === 0) {
        await dispatchSend(send.id, campaign, user, vars);
      } else {
        setTimeout(async () => {
          try {
            await dispatchSend(send.id, campaign, user, vars);
          } catch (e) {
            await storage.updateCampaignSend(send.id, { status: "FAILED", error: String(e) });
          }
        }, (campaign.delayHours ?? 0) * 3_600_000);
      }
    }
  }
}
