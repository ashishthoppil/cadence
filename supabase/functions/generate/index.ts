// Generates a post. Internal callers (the scheduler) pass an existing `post_id`; signed-in
// users can ask for a fresh post for today (or a given date) from the dashboard.
import { admin, workspaceFromRequest } from "../_shared/db.ts";
import { HttpError, isInternal, json, runInBackground, serve } from "../_shared/http.ts";
import { createPost, runGeneration } from "../_shared/pipeline.ts";
import { localTime } from "../_shared/time.ts";

serve(async (req) => {
  const body = await req.json().catch(() => ({}));

  if (isInternal(req)) {
    if (!body.post_id) throw new HttpError(400, "post_id is required");
    runInBackground(runGeneration(body.post_id));
    return json({ post_id: body.post_id }, 202);
  }

  const w = await workspaceFromRequest(req);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date ?? "") ? body.date : localTime(w.timezone).date;
  const post = await createPost(w, { date, origin: "manual", feedback: body.feedback ?? null });
  if (!post) throw new HttpError(409, "Could not create the post");

  // The newest version for a day replaces any earlier finished one.
  await admin()
    .from("posts")
    .update({ status: "superseded", replaced_by: post.id })
    .eq("workspace_id", w.id)
    .eq("post_date", date)
    .eq("status", "ready")
    .neq("id", post.id);

  runInBackground(runGeneration(post.id));
  return json({ post_id: post.id }, 202);
});
