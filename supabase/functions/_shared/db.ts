import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.117.2";
import { env } from "./env.ts";
import { HttpError } from "./http.ts";
import type { Slide } from "./slide-templates.ts";

export interface Workspace {
  id: string;
  owner_id: string;
  brand_name: string;
  website: string | null;
  description: string | null;
  products: string | null;
  audience: string | null;
  tone: string | null;
  cta: string | null;
  handle: string | null;
  language: string;
  avoid: string | null;
  linkedin_hashtags: string[];
  instagram_hashtags: string[];
  primary_color: string;
  accent_color: string | null;
  slide_theme: "midnight" | "paper" | "bold";
  slide_font: "inter" | "jakarta" | "editorial";
  logo_url: string | null;
  logo_aspect: number | null;
  logo_inverse_url: string | null;
  logo_inverse_aspect: number | null;
  carousel_length: number;
  approval_email: string | null;
  timezone: string;
  generate_at: string;
  paused: boolean;
  ai_model: string | null;
  onboarded_at: string | null;
}

export interface CalendarSlot {
  workspace_id: string;
  weekday: number;
  format: "carousel" | "image" | "none";
  theme: string;
  brief: string;
  other_content: string;
}

export type PostStatus = "generating" | "ready" | "superseded" | "failed";

export interface Post {
  id: string;
  workspace_id: string;
  post_date: string;
  weekday: number;
  origin: "schedule" | "manual" | "regenerate";
  format: "carousel" | "image";
  theme: string | null;
  brief: string | null;
  other_content: string | null;
  status: PostStatus;
  title: string | null;
  slides: Slide[];
  image_paths: string[];
  pdf_path: string | null;
  linkedin_caption: string | null;
  linkedin_hashtags: string[];
  instagram_caption: string | null;
  instagram_hashtags: string[];
  alt_text: string | null;
  feedback: string | null;
  model: string | null;
  review_token_hash: string | null;
  review_expires_at: string | null;
  emailed_at: string | null;
  replaced_by: string | null;
  error: string | null;
  created_at: string;
}

let client: SupabaseClient | null = null;

/** Service-role client. Bypasses RLS — every query must scope by workspace itself. */
export function admin(): SupabaseClient {
  client ??= createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function publicUrl(bucket: string, path: string): string {
  return `${env.supabaseUrl}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const MEDIA_BUCKET = "post-media";

/** Resolve the signed-in user's workspace from the request's bearer token. */
export async function workspaceFromRequest(req: Request): Promise<Workspace> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Sign in required");
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Sign in required");
  const { data: workspace } = await admin().from("workspaces").select("*").eq("owner_id", data.user.id).maybeSingle();
  if (!workspace) throw new HttpError(404, "Finish onboarding first");
  return workspace as Workspace;
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const { data, error } = await admin().from("workspaces").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Workspace;
}

export async function getPost(id: string): Promise<Post> {
  const { data, error } = await admin().from("posts").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: string, patch: Partial<Post>): Promise<Post> {
  const { data, error } = await admin().from("posts").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Post;
}

export async function getSlot(workspaceId: string, weekday: number): Promise<CalendarSlot | null> {
  const { data } = await admin()
    .from("calendar_slots")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("weekday", weekday)
    .maybeSingle();
  return (data as CalendarSlot) ?? null;
}
