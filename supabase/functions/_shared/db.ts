import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.117.2";
import { env } from "./env.ts";
import { HttpError } from "./http.ts";
import type { Slide, TemplateId } from "./slide-templates.ts";

export type Platform = "linkedin" | "instagram" | "facebook" | "x" | "tiktok";
export type BusinessType = "saas" | "ecommerce" | "services" | "creator" | "local" | "education" | "other";
export type VisualSource = "none" | "uploads" | "stock";
export type PostFormat = "carousel" | "image" | "video";

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
  business_type: BusinessType;
  platforms: Platform[];
  visual_source: VisualSource;
  brand_hashtags: string[];
  primary_color: string;
  accent_color: string | null;
  template: TemplateId;
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
  free_posts_used: number;
  upgrade_notified_at: string | null;
}

export interface CalendarSlot {
  workspace_id: string;
  weekday: number;
  format: PostFormat | "none";
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
  format: PostFormat;
  theme: string | null;
  brief: string | null;
  other_content: string | null;
  status: PostStatus;
  title: string | null;
  slides: Slide[];
  image_paths: string[];
  pdf_path: string | null;
  captions: Captions;
  video_path: string | null;
  video_prompt: string | null;
  video_job: string | null;
  video_started_at: string | null;
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

export type Captions = Partial<Record<Platform, { caption: string; hashtags: string[] }>>;

export interface MediaAsset {
  id: string;
  workspace_id: string;
  path: string;
  url: string;
  width: number | null;
  height: number | null;
  description: string | null;
  use_count: number;
  last_used_at: string | null;
}

export interface Subscription {
  workspace_id: string;
  plan: "image" | "video";
  status: string;
  subscription_id: string | null;
  customer_id: string | null;
  product_id: string | null;
  currency: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
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

/** Resolve the signed-in user from the request's bearer token. */
export async function userFromRequest(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Sign in required");
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Sign in required");
  return data.user;
}

/** Resolve the signed-in user's workspace from the request's bearer token. */
export async function workspaceFromRequest(req: Request): Promise<Workspace> {
  const user = await userFromRequest(req);
  const { data: workspace } = await admin().from("workspaces").select("*").eq("owner_id", user.id).maybeSingle();
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
