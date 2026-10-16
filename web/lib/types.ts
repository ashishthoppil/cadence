import type { Slide, TemplateId } from "./slide-templates";

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
  language: "en-GB" | "en-US";
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
  created_at: string;
  updated_at: string;
}

export type SlotFormat = PostFormat | "none";

export interface CalendarSlot {
  weekday: number;
  format: SlotFormat;
  theme: string;
  brief: string;
  other_content: string;
}

export type PostStatus = "generating" | "ready" | "superseded" | "failed";

export type Captions = Partial<Record<Platform, { caption: string; hashtags: string[] }>>;

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
  video_path: string | null;
  captions: Captions;
  alt_text: string | null;
  feedback: string | null;
  model: string | null;
  emailed_at: string | null;
  replaced_by: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  workspace_id: string;
  path: string;
  url: string;
  width: number | null;
  height: number | null;
  description: string | null;
  use_count: number;
  created_at: string;
}

export interface Subscription {
  workspace_id: string;
  plan: "image" | "video";
  status: string;
  customer_id: string | null;
  currency: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface Download {
  name: string;
  url: string;
}

/** Shape returned by the `review` Edge Function. */
export interface ReviewView {
  id: string;
  title: string | null;
  theme: string | null;
  post_date: string;
  format: PostFormat;
  status: PostStatus;
  images: string[];
  video: string | null;
  credits: string[];
  downloads: { slides: Download[]; pdf: Download | null; video: Download | null };
  captions: Captions;
  platforms: Platform[];
  alt_text: string | null;
  error: string | null;
  replaced_by: string | null;
  brand: { name: string; primary: string };
}
