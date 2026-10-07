import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}

export const MEDIA_BUCKET = "post-media";
export const BRAND_BUCKET = "brand-assets";

export function mediaUrl(path: string) {
  return supabase().storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Call an Edge Function and surface its `{ error }` message on failure. */
export async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        message = (await context.json()).error ?? message;
      } catch {
        /* keep default message */
      }
    }
    throw new Error(message);
  }
  return data as T;
}
