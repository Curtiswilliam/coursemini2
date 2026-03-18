import crypto from "crypto";
import { db } from "./db";
import { webhooks, webhookDeliveries } from "../shared/schema";
import { eq } from "drizzle-orm";

export async function fireWebhook(event: string, payload: Record<string, any>) {
  try {
    const activeWebhooks = await db.select().from(webhooks).where(eq(webhooks.isActive, true));
    for (const wh of activeWebhooks) {
      const events = (wh.events as string[]) || [];
      if (!events.includes(event) && !events.includes("*")) continue;

      const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      if (wh.secret) {
        const sig = crypto.createHmac("sha256", wh.secret).update(body).digest("hex");
        headers["X-CourseMini-Signature"] = `sha256=${sig}`;
      }

      // Fire and forget — log delivery
      fetch(wh.url, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) })
        .then(async (res) => {
          await db.insert(webhookDeliveries).values({
            webhookId: wh.id,
            event,
            payload,
            status: res.ok ? "delivered" : "failed",
            responseCode: res.status,
            error: res.ok ? null : `HTTP ${res.status}`,
          });
        })
        .catch(async (err) => {
          await db.insert(webhookDeliveries).values({
            webhookId: wh.id,
            event,
            payload,
            status: "failed",
            error: String(err),
          });
        });
    }
  } catch (e) {
    console.error("[webhooks] fireWebhook error:", e);
  }
}
