import type { Workspace } from "./types";

const EDITABLE: (keyof Workspace)[] = [
  "brand_name", "website", "description", "products", "audience", "tone", "cta", "handle", "language", "avoid",
  "linkedin_hashtags", "instagram_hashtags", "primary_color", "accent_color", "slide_theme", "slide_font",
  "logo_url", "logo_aspect", "logo_inverse_url", "logo_inverse_aspect", "carousel_length",
  "approval_email", "timezone", "generate_at", "paused", "ai_model",
];

/** Only the columns the browser is meant to write. */
export function pickEditable(draft: Partial<Workspace>): Partial<Workspace> {
  return Object.fromEntries(Object.entries(draft).filter(([k]) => EDITABLE.includes(k as keyof Workspace)));
}
