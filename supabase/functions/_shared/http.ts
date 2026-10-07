import { env } from "./env.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cadence-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function redirect(url: string): Response {
  return new Response(null, { status: 302, headers: { Location: url } });
}

/** Wrap a handler with CORS preflight handling and consistent error responses. */
export function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
    }
  });
}

export function isInternal(req: Request): boolean {
  const given = req.headers.get("x-cadence-secret");
  return !!given && timingSafeEqual(given, env.internalSecret);
}

export function assertInternal(req: Request) {
  if (!isInternal(req)) throw new HttpError(401, "Unauthorized");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Fire a request at another Edge Function of this project with the internal secret. */
export function callFunction(name: string, body: unknown): Promise<Response> {
  return fetch(`${env.functionsUrl}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cadence-secret": env.internalSecret },
    body: JSON.stringify(body),
  });
}

/** Keep work running after the response is sent (Supabase Edge Runtime background tasks). */
export function runInBackground(promise: Promise<unknown>) {
  const guarded = promise.catch((err) => console.error("Background task failed", err));
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(guarded);
}
