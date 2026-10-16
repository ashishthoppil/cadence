// Short vertical videos with Gemini Omni Flash (Interactions API).
// Docs: https://ai.google.dev/gemini-api/docs/omni and /background-execution
import { env } from "./env.ts";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

function headers() {
  return { "x-goog-api-key": env.geminiKey, "Content-Type": "application/json", "Api-Revision": "2026-05-20" };
}

export interface VideoOutput {
  bytes: Uint8Array<ArrayBuffer>;
  mimeType: string;
}

export type VideoState =
  | { status: "running"; id: string }
  | { status: "done"; id: string; video: VideoOutput }
  | { status: "failed"; id: string; error: string };

interface VideoPart {
  data?: string;
  uri?: string;
  mime_type?: string;
}

/** Find the generated video in an interaction, wherever the response nests it. */
function findVideo(node: unknown): VideoPart | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findVideo(item);
      if (hit) return hit;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  if (obj.type === "video" && (typeof obj.data === "string" || typeof obj.uri === "string")) return obj as VideoPart;
  for (const value of Object.values(obj)) {
    const hit = findVideo(value);
    if (hit) return hit;
  }
  return null;
}

async function download(part: VideoPart): Promise<VideoOutput> {
  const mimeType = part.mime_type ?? "video/mp4";
  if (part.data) return { bytes: Uint8Array.from(atob(part.data), (c) => c.charCodeAt(0)), mimeType };
  const uri = part.uri!;
  const url = /:download/.test(uri) ? uri : `${uri.replace(/\?.*$/, "")}:download?alt=media`;
  let res = await fetch(url, { headers: { "x-goog-api-key": env.geminiKey } });
  if (!res.ok) res = await fetch(uri, { headers: { "x-goog-api-key": env.geminiKey } });
  if (!res.ok) throw new Error(`Video download failed (${res.status})`);
  return { bytes: new Uint8Array(await res.arrayBuffer()), mimeType };
}

async function toState(data: Record<string, unknown>): Promise<VideoState> {
  const id = String(data.id ?? data.name ?? "");
  const status = String(data.status ?? "");
  const errorMessage = (data.error as { message?: string } | undefined)?.message;
  if (status === "failed" || status === "cancelled" || errorMessage) {
    return { status: "failed", id, error: errorMessage ?? `Video generation ${status}` };
  }
  const part = findVideo(data.steps ?? data.outputs ?? data);
  if (part) return { status: "done", id, video: await download(part) };
  if (status === "completed") return { status: "failed", id, error: "The video model finished without returning a video" };
  return { status: "running", id };
}

/** Start a video. Runs in the background when the API allows it; otherwise waits for the result. */
export async function startVideo(prompt: string, image: { data: string; mimeType: string } | null): Promise<VideoState> {
  const body = {
    model: env.geminiVideoModel,
    input: image
      ? [{ type: "text", text: prompt }, { type: "image", data: image.data, mime_type: image.mimeType }]
      : prompt,
    response_format: { type: "video", aspect_ratio: "9:16", resolution: "720p", delivery: "uri" },
    ...(image ? { generation_config: { video_config: { task: "image_to_video" } } } : {}),
  };

  let res = await fetch(`${BASE}/interactions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ...body, background: true }),
  });
  if (res.status === 400) {
    const text = await res.text();
    if (!/background/i.test(text)) throw new Error(`Gemini video request failed: ${text.slice(0, 400)}`);
    // This model doesn't support background runs: generate synchronously instead.
    res = await fetch(`${BASE}/interactions`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  }
  if (!res.ok) throw new Error(`Gemini video request failed (${res.status}): ${(await res.text()).slice(0, 400)}`);
  return await toState(await res.json());
}

export async function pollVideo(id: string): Promise<VideoState> {
  const res = await fetch(`${BASE}/interactions/${encodeURIComponent(id)}`, { headers: headers() });
  if (!res.ok) throw new Error(`Gemini video status failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return await toState(await res.json());
}
