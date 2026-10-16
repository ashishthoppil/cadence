// Called by pg_cron every 15 minutes. Starts today's post for every workspace whose local
// generation time (default 17:00) has just passed and that hasn't had one created yet.
import { admin, getSlot, type Workspace } from "../_shared/db.ts";
import { allowance, consumeFreePost } from "../_shared/billing.ts";
import { noticeEmail, sendEmail } from "../_shared/email.ts";
import { env } from "../_shared/env.ts";
import { assertInternal, callFunction, json, serve } from "../_shared/http.ts";
import { createPost } from "../_shared/pipeline.ts";
import { localTime, timeToMinutes } from "../_shared/time.ts";

/** How long after the scheduled time we still start a missed run (e.g. after downtime). */
const CATCH_UP_MINUTES = 180;

async function notifyUpgrade(w: Workspace, reason: string) {
  if (w.upgrade_notified_at || !w.approval_email) return;
  const email = noticeEmail(w, "Your free posts are used up", `${reason}\n\nYour calendar and settings are saved, so posts start again the moment you subscribe.`, {
    href: `${env.siteUrl}/dashboard/billing`,
    label: "Choose a plan",
  });
  await sendEmail(w.approval_email, email.subject, email.html, email.text).catch(console.error);
  await admin().from("workspaces").update({ upgrade_notified_at: new Date().toISOString() }).eq("id", w.id);
}

serve(async (req) => {
  assertInternal(req);
  const { data, error } = await admin()
    .from("workspaces")
    .select("*")
    .not("onboarded_at", "is", null)
    .not("approval_email", "is", null)
    .eq("paused", false);
  if (error) throw error;

  const started: { workspace: string; post: string }[] = [];
  for (const w of (data ?? []) as Workspace[]) {
    const now = localTime(w.timezone);
    const due = timeToMinutes(w.generate_at);
    if (now.minutes < due || now.minutes >= due + CATCH_UP_MINUTES) continue;

    const slot = await getSlot(w.id, now.weekday);
    if (!slot || slot.format === "none") continue;

    const allowed = await allowance(w, slot.format);
    if (!allowed.ok) {
      await notifyUpgrade(w, allowed.reason!);
      continue;
    }

    const post = await createPost(w, { date: now.date, origin: "schedule", format: allowed.format });
    if (!post) continue; // already generated today
    if (allowed.plan === "free" && !(await consumeFreePost(w))) {
      await admin().from("posts").delete().eq("id", post.id);
      continue;
    }

    const res = await callFunction("generate", { post_id: post.id });
    if (!res.ok) console.error("Could not start generation", post.id, await res.text());
    started.push({ workspace: w.id, post: post.id });
  }

  return json({ checked: data?.length ?? 0, started });
});
