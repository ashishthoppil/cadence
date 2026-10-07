// Called by pg_cron every 15 minutes. Starts today's post for every workspace whose local
// generation time (default 17:00) has just passed and that hasn't had one created yet.
import { admin, getSlot, type Workspace } from "../_shared/db.ts";
import { assertInternal, callFunction, json, serve } from "../_shared/http.ts";
import { createPost } from "../_shared/pipeline.ts";
import { localTime, timeToMinutes } from "../_shared/time.ts";

/** How long after the scheduled time we still start a missed run (e.g. after downtime). */
const CATCH_UP_MINUTES = 180;

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

    const post = await createPost(w, { date: now.date, origin: "schedule" });
    if (!post) continue; // already generated today

    const res = await callFunction("generate", { post_id: post.id });
    if (!res.ok) console.error("Could not start generation", post.id, await res.text());
    started.push({ workspace: w.id, post: post.id });
  }

  return json({ checked: data?.length ?? 0, started });
});
