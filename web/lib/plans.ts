// GENERATED from supabase/functions/_shared/plans.ts — edit that file, then run `npm run sync:shared`.
// Plans and limits, shared by the Edge Functions and the web app (synced copy at
// web/lib/plans.ts via `npm run sync:shared`). Keep this file dependency-free.

export type PlanId = "image" | "video";
export type Currency = "INR" | "USD";

export const FREE_POSTS = 3;

export interface PlanInfo {
  id: PlanId;
  name: string;
  tagline: string;
  price: Record<Currency, number>;
  features: string[];
  video: boolean;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  image: {
    id: "image",
    name: "Image Only",
    tagline: "Daily carousels and image posts",
    price: { INR: 1499, USD: 45 },
    video: false,
    features: [
      "A post every day from your content calendar",
      "Carousels and single-image posts",
      "20 on-brand templates",
      "Captions and hashtags for each platform",
      "Your photos or stock photos on slides",
      "Unlimited regenerations",
    ],
  },
  video: {
    id: "video",
    name: "Image + Videos",
    tagline: "Everything, plus AI-made short videos",
    price: { INR: 2999, USD: 89 },
    video: true,
    features: [
      "Everything in Image Only",
      "Short vertical videos for Reels, Shorts and TikTok",
      "Product photos brought to life as video",
      "Video captions and hashtags per platform",
    ],
  },
};

/** Subscription statuses that keep a plan's features switched on. */
export const ENTITLED_STATUSES = ["active", "past_due"];

export function formatPrice(amount: number, currency: Currency) {
  return currency === "INR" ? `₹${amount.toLocaleString("en-IN")}` : `$${amount}`;
}
