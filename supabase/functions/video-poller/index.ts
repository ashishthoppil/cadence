// Called by pg_cron every minute while a video is rendering. Collects finished videos from
// Gemini, stores them and sends the post email.
import { admin, getWorkspace, type Post } from "../_shared/db.ts";
import { assertInternal, json, serve } from "../_shared/http.ts";
import { failPost, finishVideo } from "../_shared/pipeline.ts";
import { pollVideo } from "../_shared/video.ts";

/** Give up on a video after this long. */
const TIMEOUT_MS = 25 * 60_000;

serve(async (req) => {
  assertInternal(req);
  const { data } = await admin()
    .from("posts")
    .select("*")
    .eq("format", "video")
    .eq("status", "generating")
    .not("video_job", "is", null)
    .limit(10);

  const results: Record<string, string> = {};
  for (const post of (data ?? []) as Post[]) {
    try {
      const state = await pollVideo(post.video_job!);
      if (state.status === "done") {
        await finishVideo(post.id, state.video);
        results[post.id] = "ready";
      } else if (state.status === "failed") {
        await failPost(post, await getWorkspace(post.workspace_id), state.error);
        results[post.id] = "failed";
      } else if (post.video_started_at && Date.now() - new Date(post.video_started_at).getTime() > TIMEOUT_MS) {
        await failPost(post, await getWorkspace(post.workspace_id), "The video took too long to render. Try regenerating it.");
        results[post.id] = "timed out";
      } else {
        results[post.id] = "running";
      }
    } catch (err) {
      console.error("Video poll failed", post.id, err);
      results[post.id] = "error";
    }
  }
  return json({ checked: data?.length ?? 0, results });
});
