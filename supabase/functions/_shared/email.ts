import { env } from "./env.ts";
import { MEDIA_BUCKET, type Post, publicUrl, type Workspace } from "./db.ts";
import { prettyDate } from "./time.ts";

/** Resend fetches attachments from `path` itself, so large files never pass through the function. */
export interface Attachment {
  filename: string;
  path: string;
}

export async function sendEmail(to: string, subject: string, html: string, text: string, attachments?: Attachment[]) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.resendKey}` },
    body: JSON.stringify({ from: env.emailFrom, to: [to], subject, html, text, attachments }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return await res.json();
}

function esc(text: string | null | undefined): string {
  return (text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(text: string | null | undefined): string {
  return esc(text).replace(/\n/g, "<br>");
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "post";
}

/** File names for a post's downloads, e.g. syncv-2026-10-08-slide-01.jpg */
export function downloadNames(post: Post, w: Workspace) {
  const base = `${slug(w.brand_name)}-${post.post_date}`;
  return {
    slide: (i: number) => (post.image_paths.length > 1 ? `${base}-slide-${String(i + 1).padStart(2, "0")}.jpg` : `${base}.jpg`),
    pdf: `${base}-linkedin-carousel.pdf`,
  };
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif";

function shell(preheader: string, inner: string, brandColor: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Cadence</title></head>
<body style="margin:0;padding:0;background:#F3F2F7;font-family:${FONT};color:#16141C;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2F7;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 4px 18px 4px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-size:15px;font-weight:700;letter-spacing:-0.2px;color:#16141C;">
      <span style="display:inline-block;width:22px;height:22px;border-radius:7px;background:${brandColor};vertical-align:-5px;margin-right:8px;"></span>Cadence
    </td>
    <td align="right" style="font-size:12px;color:#7A7787;">Daily content autopilot</td>
  </tr></table>
</td></tr>
${inner}
<tr><td style="padding:22px 8px;font-size:12px;line-height:18px;color:#8A8796;text-align:center;">
  You're receiving this because this address gets the daily posts for your Cadence workspace.<br>
  <a href="${env.siteUrl}/dashboard/settings" style="color:#8A8796;">Change the schedule or email</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string, bg: string, color: string, border = bg) {
  return `<a href="${href}" style="display:inline-block;padding:13px 22px;border-radius:12px;background:${bg};color:${color};border:1px solid ${border};font-size:15px;font-weight:700;text-decoration:none;margin:4px 6px 4px 0;">${label}</a>`;
}

function captionCard(platform: string, dot: string, caption: string | null, hashtags: string[]) {
  return `<tr><td style="padding:0 24px 16px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ECEAF2;border-radius:14px;">
    <tr><td style="padding:16px 18px 6px 18px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5E5A68;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:8px;background:${dot};margin-right:8px;vertical-align:1px;"></span>${platform} caption
    </td></tr>
    <tr><td style="padding:6px 18px 16px 18px;font-size:14px;line-height:22px;color:#16141C;">${paragraphs(caption)}<br><br><span style="color:#5B3FD0;">${
    esc(hashtags.map((t) => `#${t}`).join(" "))
  }</span></td></tr>
  </table>
</td></tr>`;
}

function slideGrid(post: Post) {
  const urls = post.image_paths.map((p) => publicUrl(MEDIA_BUCKET, p));
  if (urls.length === 1) {
    return `<tr><td align="center" style="padding:0 24px 20px 24px;"><img src="${urls[0]}" width="360" alt="${
      esc(post.alt_text)
    }" style="display:block;width:100%;max-width:360px;border-radius:14px;border:1px solid #ECEAF2;"></td></tr>`;
  }
  const rows: string[] = [];
  for (let i = 0; i < urls.length; i += 2) {
    const cell = (u?: string, n?: number) =>
      u
        ? `<td width="50%" style="padding:6px;" valign="top"><img src="${u}" width="264" alt="Slide ${n}" style="display:block;width:100%;border-radius:12px;border:1px solid #ECEAF2;"></td>`
        : `<td width="50%" style="padding:6px;"></td>`;
    rows.push(`<tr>${cell(urls[i], i + 1)}${cell(urls[i + 1], i + 2)}</tr>`);
  }
  return `<tr><td style="padding:0 18px 18px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${
    rows.join("")
  }</table></td></tr>`;
}

export function postEmail(post: Post, workspace: Workspace, token: string) {
  const page = `${env.siteUrl}/review/${token}`;
  const brandColor = workspace.primary_color || "#6D28D9";
  const carousel = post.image_paths.length > 1;
  const names = downloadNames(post, workspace);
  const pdfUrl = post.pdf_path ? publicUrl(MEDIA_BUCKET, post.pdf_path) : null;
  const kind = carousel ? `${post.image_paths.length}-slide carousel` : "Single image post";

  const howTo = carousel
    ? `<strong>Instagram:</strong> save the attached slides and post them as a carousel, in order.<br><strong>LinkedIn:</strong> add the attached PDF as a document${
      pdfUrl ? ` (<a href="${pdfUrl}?download=${encodeURIComponent(names.pdf)}" style="color:#5B3FD0;">download</a>)` : ""
    } — it shows as a swipeable carousel.`
    : `Save the attached image and post it with the captions below.`;

  const reminders = post.other_content?.trim()
    ? `<tr><td style="padding:0 24px 20px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6FB;border-radius:12px;"><tr><td style="padding:14px 16px;font-size:13px;line-height:20px;color:#3F3B4A;"><strong>Also on today's plan:</strong><br>${
      paragraphs(post.other_content)
    }</td></tr></table></td></tr>`
    : "";

  const inner = `<tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #ECEAF2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:26px 24px 6px 24px;">
  <span style="display:inline-block;padding:5px 11px;border-radius:999px;background:#F1EDFE;color:#5B3FD0;font-size:12px;font-weight:700;">${
    esc(post.theme || "Today's post")
  }</span>
  <span style="font-size:12px;color:#7A7787;margin-left:8px;">${esc(prettyDate(post.post_date))} · ${esc(kind)}</span>
</td></tr>
<tr><td style="padding:10px 24px 6px 24px;font-size:24px;line-height:31px;font-weight:800;letter-spacing:-0.4px;">${
    esc(post.title)
  }</td></tr>
<tr><td style="padding:0 24px 18px 24px;font-size:14px;line-height:22px;color:#5E5A68;">Today's post is ready to publish. The ${
    carousel ? "slides are" : "image is"
  } attached to this email and the captions are below.</td></tr>
<tr><td style="padding:0 24px 22px 24px;">
  ${button(page, "Open post page", brandColor, "#FFFFFF")}
  ${button(`${page}?action=regenerate`, "Regenerate", "#FFFFFF", "#16141C", "#DDDAE6")}
</td></tr>
${slideGrid(post)}
<tr><td style="padding:0 24px 18px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6FB;border-radius:12px;"><tr><td style="padding:14px 16px;font-size:13px;line-height:21px;color:#3F3B4A;">${howTo}</td></tr></table></td></tr>
${captionCard("LinkedIn", "#0A66C2", post.linkedin_caption, post.linkedin_hashtags)}
${captionCard("Instagram", "#E1306C", post.instagram_caption, post.instagram_hashtags)}
${reminders}
<tr><td style="padding:4px 24px 26px 24px;font-size:13px;color:#5E5A68;">On your phone? <a href="${page}" style="color:#5B3FD0;font-weight:700;">Open the post page</a> to copy each caption with one tap and save the slides.</td></tr>
</table></td></tr>`;

  const text = [
    `${post.title}`,
    `${prettyDate(post.post_date)} · ${post.theme ?? ""}`,
    ``,
    `Post page (download & copy): ${page}`,
    `Regenerate: ${page}?action=regenerate`,
    ``,
    `LINKEDIN`,
    post.linkedin_caption ?? "",
    post.linkedin_hashtags.map((t) => `#${t}`).join(" "),
    ``,
    `INSTAGRAM`,
    post.instagram_caption ?? "",
    post.instagram_hashtags.map((t) => `#${t}`).join(" "),
  ].join("\n");

  const attachments: Attachment[] = post.image_paths.map((p, i) => ({
    filename: names.slide(i),
    path: publicUrl(MEDIA_BUCKET, p),
  }));
  if (pdfUrl) attachments.push({ filename: names.pdf, path: pdfUrl });

  return {
    subject: `Ready to post: ${post.title}`,
    html: shell(`${post.theme ?? "Today's post"} is ready — slides attached, captions inside.`, inner, brandColor),
    text,
    attachments,
  };
}

export function noticeEmail(workspace: Workspace, title: string, message: string, cta?: { href: string; label: string }) {
  const brandColor = workspace.primary_color || "#6D28D9";
  const inner = `<tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #ECEAF2;padding:26px 24px;">
  <div style="font-size:20px;line-height:28px;font-weight:800;letter-spacing:-0.3px;margin-bottom:8px;">${esc(title)}</div>
  <div style="font-size:14px;line-height:22px;color:#5E5A68;margin-bottom:${cta ? 18 : 0}px;">${paragraphs(message)}</div>
  ${cta ? button(cta.href, esc(cta.label), brandColor, "#FFFFFF") : ""}
</td></tr>`;
  return { subject: title, html: shell(title, inner, brandColor), text: `${title}\n\n${message}${cta ? `\n\n${cta.href}` : ""}` };
}
