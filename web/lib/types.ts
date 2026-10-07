import type { FontPair, Slide, SlideTheme } from "./slide-templates";

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
  linkedin_hashtags: string[];
  instagram_hashtags: string[];
  primary_color: string;
  accent_color: string | null;
  slide_theme: SlideTheme;
  slide_font: FontPair;
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
  created_at: string;
  updated_at: string;
}

export type SlotFormat = "carousel" | "image" | "none";

export interface CalendarSlot {
  weekday: number;
  format: SlotFormat;
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
  emailed_at: string | null;
  replaced_by: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
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
  format: "carousel" | "image";
  status: PostStatus;
  images: string[];
  downloads: { slides: Download[]; pdf: Download | null };
  linkedin: { caption: string | null; hashtags: string[] };
  instagram: { caption: string | null; hashtags: string[] };
  alt_text: string | null;
  error: string | null;
  replaced_by: string | null;
  brand: { name: string; primary: string };
}
