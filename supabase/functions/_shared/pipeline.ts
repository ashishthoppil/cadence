// Generation → rendering → delivery email.
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { admin, getPost, getSlot, getWorkspace, MEDIA_BUCKET, type Post, updatePost, type Workspace } from "./db.ts";
import { generateContent } from "./openai.ts";
import { isDarkTheme, type SlideBrand } from "./slide-templates.ts";
import { callFunction } from "./http.ts";
import { randomToken, sha256Hex } from "./crypto.ts";
import { noticeEmail, postEmail, sendEmail } from "./email.ts";
import { env } from "./env.ts";
import { weekdayOf } from "./time.ts";

/** How long the link in the email keeps working. */
const LINK_TTL = 30 * 86_400_000;

export function slideBrand(w: Workspace): SlideBrand {
  const dark = isDarkTheme({ theme: w.slide_theme, primary: w.primary_color });
  const normal = w.logo_url ? { url: w.logo_url, aspect: w.logo_aspect || 1 } : null;
  const inverse = w.logo_inverse_url ? { url: w.logo_inverse_url, aspect: w.logo_inverse_aspect || 1 } : null;
  return {
    name: w.brand_name,
    handle: w.handle,
    primary: w.primary_color,
    accent: w.accent_color,
    theme: w.slide_theme,
    font: w.slide_font,
    logo: dark ? inverse ?? normal : normal,
    cta: w.cta,
  };
}

// ---------------------------------------------------------------------------
// Creating & generating posts

export async function createPost(
  w: Workspace,
  opts: { date: string; origin: Post["origin"]; feedback?: string | null },
): Promise<Post | null> {
  const weekday = weekdayOf(opts.date);
  const slot = await getSlot(w.id, weekday);
  const { data, error } = await admin()
    .from("posts")
    .insert({
      workspace_id: w.id,
      post_date: opts.date,
      weekday,
      origin: opts.origin,
      format: slot?.format === "image" ? "image" : "carousel",
      theme: slot?.theme || null,
      brief: slot?.brief || null,
      other_content: slot?.other_content || null,
      feedback: opts.feedback || null,
      status: "generating",
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") return null; // today's scheduled post already exists
    throw error;
  }
  return data as Post;
}

async function recentTitles(w: Workspace, excludeId: string) {
  const { data } = await admin()
    .from("posts")
    .select("title")
    .eq("workspace_id", w.id)
    .neq("id", excludeId)
    .not("title", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []).map((r) => r.title as string);
}

async function renderSlides(post: Post, w: Workspace): Promise<string[]> {
  const brand = slideBrand(w);
  const total = post.slides.length;
  return await Promise.all(
    post.slides.map(async (slide, index) => {
      const path = `${w.id}/${post.id}/slide-${String(index + 1).padStart(2, "0")}.jpg`;
      let lastError = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await callFunction("render-slide", { slide, index, total, brand, path });
        if (res.ok) return path;
        lastError = await res.text();
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
      throw new Error(`Slide ${index + 1} failed to render: ${lastError.slice(0, 300)}`);
    }),
  );
}

/** One PDF of all slides — upload it to LinkedIn as a document to get a swipeable carousel. */
async function buildPdf(post: Post, paths: string[], w: Workspace): Promise<string> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(post.title ?? w.brand_name);
  pdf.setAuthor(w.brand_name);
  for (const path of paths) {
    const { data, error } = await admin().storage.from(MEDIA_BUCKET).download(path);
    if (error) throw error;
    const image = await pdf.embedJpg(new Uint8Array(await data.arrayBuffer()));
    const page = pdf.addPage([1080, 1350]);
    page.drawImage(image, { x: 0, y: 0, width: 1080, height: 1350 });
  }
  const bytes = await pdf.save();
  const pdfPath = `${w.id}/${post.id}/carousel.pdf`;
  const { error } = await admin().storage.from(MEDIA_BUCKET).upload(pdfPath, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;
  return pdfPath;
}

/** Email the finished post (with a fresh link to its page) to the workspace's address. */
export async function sendPostEmail(postId: string) {
  let post = await getPost(postId);
  const w = await getWorkspace(post.workspace_id);
  if (!w.approval_email) throw new Error("No delivery email is set");
  const token = randomToken();
  post = await updatePost(post.id, {
    review_token_hash: await sha256Hex(token),
    review_expires_at: new Date(Date.now() + LINK_TTL).toISOString(),
  });
  const email = postEmail(post, w, token);
  await sendEmail(w.approval_email, email.subject, email.html, email.text, email.attachments);
  await updatePost(post.id, { emailed_at: new Date().toISOString(), error: null });
}

export async function runGeneration(postId: string) {
  let post = await getPost(postId);
  const w = await getWorkspace(post.workspace_id);
  try {
    const content = await generateContent(
      w,
      { format: post.format, theme: post.theme ?? "", brief: post.brief ?? "", weekday: post.weekday },
      await recentTitles(w, post.id),
      post.feedback,
    );
    post = await updatePost(post.id, {
      title: content.title,
      slides: content.slides,
      linkedin_caption: content.linkedin.caption,
      linkedin_hashtags: content.linkedin.hashtags,
      instagram_caption: content.instagram.caption,
      instagram_hashtags: content.instagram.hashtags,
      alt_text: content.alt_text,
      model: content.model,
    });

    const paths = await renderSlides(post, w);
    const pdfPath = paths.length > 1 ? await buildPdf(post, paths, w) : null;
    await updatePost(post.id, { image_paths: paths, pdf_path: pdfPath, status: "ready", error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Generation failed", post.id, message);
    await updatePost(post.id, { status: "failed", error: message });
    if (w.approval_email) {
      const email = noticeEmail(
        w,
        "Today's post couldn't be generated",
        `Something went wrong while creating "${post.theme ?? "today's post"}":\n${message}\n\nYou can try again from the dashboard.`,
        { href: `${env.siteUrl}/dashboard/posts/${post.id}`, label: "Open dashboard" },
      );
      await sendEmail(w.approval_email, email.subject, email.html, email.text).catch(console.error);
    }
    return;
  }

  // The post is ready even if the email bounces; the dashboard can resend it.
  try {
    await sendPostEmail(post.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Post email failed", post.id, message);
    await updatePost(post.id, { error: `Email failed: ${message}` });
  }
}
