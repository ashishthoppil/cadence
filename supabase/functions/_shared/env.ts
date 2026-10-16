function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return Deno.env.get(name) || fallback;
}

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get serviceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  /** Shared by pg_cron → scheduler and function → function calls. */
  get internalSecret() {
    return required("CADENCE_INTERNAL_SECRET");
  },
  /** Public URL of the web app, e.g. https://cadence.example.com */
  get siteUrl() {
    return required("SITE_URL").replace(/\/$/, "");
  },
  get openaiKey() {
    return required("OPENAI_API_KEY");
  },
  get openaiModel() {
    return optional("OPENAI_MODEL", "gpt-5-mini");
  },
  get resendKey() {
    return required("RESEND_API_KEY");
  },
  get emailFrom() {
    return optional("EMAIL_FROM", "Cadence <onboarding@resend.dev>");
  },
  get functionsUrl() {
    return `${required("SUPABASE_URL")}/functions/v1`;
  },

  // Gemini — short videos
  get geminiKey() {
    return required("GEMINI_API_KEY");
  },
  get geminiVideoModel() {
    return optional("GEMINI_VIDEO_MODEL", "gemini-omni-1.1-flash");
  },

  // Stock photos for brands without their own (optional). Pixabay is the default; Pexels
  // still works for anyone who already has a key (new Pexels keys are paused).
  get pixabayKey() {
    return Deno.env.get("PIXABAY_API_KEY") ?? "";
  },
  get pexelsKey() {
    return Deno.env.get("PEXELS_API_KEY") ?? "";
  },

  // Dodo Payments
  get dodoKey() {
    return required("DODO_API_KEY");
  },
  get dodoWebhookSecret() {
    return required("DODO_WEBHOOK_SECRET");
  },
  get dodoBaseUrl() {
    return optional("DODO_ENV", "test") === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
  },
  dodoProduct(plan: "image" | "video", currency: "INR" | "USD") {
    return required(`DODO_PRODUCT_${plan.toUpperCase()}_${currency}`);
  },
};
