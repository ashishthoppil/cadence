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
};
