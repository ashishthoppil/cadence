// Post page actions, authorised either by the token in the daily email (public post page)
// or by the signed-in owner (dashboard).
import {
  admin,
  getWorkspace,
  MEDIA_BUCKET,
  type Post,
  publicUrl,
  updatePost,
  type Workspace,
  workspaceFromRequest,
} from "../_shared/db.ts";
import { sha256Hex } from "../_shared/crypto.ts";
import { downloadNames } from "../_shared/email.ts";
import { HttpError, json, runInBackground, serve } from "../_shared/http.ts";
import { createPost, runGeneration, sendPostEmail } from "../_shared/pipeline.ts";

type Action = "get" | "regenerate" | "resend";

async function resolve(req: Request, body: Record<string, unknown>, action: Action) {
  if (typeof body.token === "string" && body.token) {
    const { data } = await admin()
      .from("posts")
      .select("*")
      .eq("review_token_hash", await sha256Hex(body.token))
      .maybeSingle();
    if (!data) throw new HttpError(404, "This link is no longer valid.");
    const post = data as Post;
    if (post.review_expires_at && new Date(post.review_expires_at) < new Date()) {
      throw new HttpError(410, "This link has expired. Open the dashboard to see the post.");
    }
    if (action === "resend") throw new HttpError(403, "Sign in to resend the email.");
    return { post, workspace: await getWorkspace(post.workspace_id) };
  }

  const workspace = await workspaceFromRequest(req);
  const { data } = await admin()
    .from("posts")
    .select("*")
    .eq("id", String(body.post_id ?? ""))
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!data) throw new HttpError(404, "Post not found");
  return { post: data as Post, workspace };
}

function view(post: Post, w: Workspace) {
  const names = downloadNames(post, w);
  const download = (path: string, name: string) => `${publicUrl(MEDIA_BUCKET, path)}?download=${encodeURIComponent(name)}`;
  return {
    id: post.id,
    title: post.title,
    theme: post.theme,
    post_date: post.post_date,
    format: post.format,
    status: post.status,
    images: post.image_paths.map((p) => publicUrl(MEDIA_BUCKET, p)),
    downloads: {
      slides: post.image_paths.map((p, i) => ({ name: names.slide(i), url: download(p, names.slide(i)) })),
      pdf: post.pdf_path ? { name: names.pdf, url: download(post.pdf_path, names.pdf) } : null,
    },
    linkedin: { caption: post.linkedin_caption, hashtags: post.linkedin_hashtags },
    instagram: { caption: post.instagram_caption, hashtags: post.instagram_hashtags },
    alt_text: post.alt_text,
    error: post.error,
    replaced_by: post.replaced_by,
    brand: { name: w.brand_name, primary: w.primary_color },
  };
}

serve(async (req) => {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = (body.action ?? "get") as Action;
  let { post, workspace } = await resolve(req, body, action);

  switch (action) {
    case "get":
      break;

    case "regenerate": {
      if (post.status === "superseded") throw new HttpError(409, "A newer version already replaced this post.");
      if (post.status === "generating") throw new HttpError(409, "This post is still being generated.");
      const feedback = typeof body.feedback === "string" ? body.feedback.slice(0, 1000) : null;
      const next = await createPost(workspace, { date: post.post_date, origin: "regenerate", feedback });
      if (!next) throw new HttpError(409, "Could not start a new version");
      post = await updatePost(post.id, { status: "superseded", replaced_by: next.id });
      runInBackground(runGeneration(next.id));
      break;
    }

    case "resend": {
      if (post.status !== "ready") throw new HttpError(409, "Only finished posts can be emailed.");
      await sendPostEmail(post.id);
      break;
    }

    default:
      throw new HttpError(400, "Unknown action");
  }

  return json(view(post, workspace));
});
