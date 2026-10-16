// Plans, free-tier accounting and Dodo Payments.
import { admin, type PostFormat, type Subscription, type Workspace } from "./db.ts";
import { env } from "./env.ts";
import { ENTITLED_STATUSES, FREE_POSTS, type PlanId } from "./plans.ts";

export type Plan = "free" | PlanId;

export async function subscriptionOf(workspaceId: string): Promise<Subscription | null> {
  const { data } = await admin().from("subscriptions").select("*").eq("workspace_id", workspaceId).maybeSingle();
  return (data as Subscription) ?? null;
}

export async function planOf(workspaceId: string): Promise<Plan> {
  const sub = await subscriptionOf(workspaceId);
  return sub && ENTITLED_STATUSES.includes(sub.status) ? sub.plan : "free";
}

export interface Allowance {
  ok: boolean;
  plan: Plan;
  /** The format to actually make (video falls back to a carousel without the video plan). */
  format: PostFormat;
  reason?: string;
}

/** Decide whether a post can be generated now, and in which format. */
export async function allowance(w: Workspace, wanted: PostFormat): Promise<Allowance> {
  const plan = await planOf(w.id);
  const format: PostFormat = wanted === "video" && plan !== "video" ? "carousel" : wanted;
  if (plan === "free" && w.free_posts_used >= FREE_POSTS) {
    return {
      ok: false,
      plan,
      format,
      reason: `You've used your ${FREE_POSTS} free posts. Choose a plan to keep your daily posts coming.`,
    };
  }
  return { ok: true, plan, format };
}

/** Count one free post. Returns false if the free allowance ran out in the meantime. */
export async function consumeFreePost(w: Workspace): Promise<boolean> {
  const { data } = await admin()
    .from("workspaces")
    .update({ free_posts_used: w.free_posts_used + 1 })
    .eq("id", w.id)
    .eq("free_posts_used", w.free_posts_used)
    .lt("free_posts_used", FREE_POSTS)
    .select("id");
  return !!data?.length;
}

// ---------------------------------------------------------------------------
// Dodo Payments API

async function dodo<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.dodoBaseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.dodoKey}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Dodo Payments ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

export function createCheckout(opts: {
  productId: string;
  email: string;
  name?: string | null;
  returnUrl: string;
  metadata: Record<string, string>;
}) {
  return dodo<{ session_id: string; checkout_url: string | null }>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      product_cart: [{ product_id: opts.productId, quantity: 1 }],
      customer: { email: opts.email, ...(opts.name ? { name: opts.name } : {}) },
      return_url: opts.returnUrl,
      metadata: opts.metadata,
    }),
  });
}

export function changePlan(subscriptionId: string, productId: string) {
  return dodo(`/subscriptions/${encodeURIComponent(subscriptionId)}/change-plan`, {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity: 1, proration_billing_mode: "prorated_immediately" }),
  });
}

export async function portalLink(customerId: string, returnUrl: string) {
  const params = new URLSearchParams({ return_url: returnUrl });
  const res = await dodo<{ link: string }>(
    `/customers/${encodeURIComponent(customerId)}/customer-portal/session?${params}`,
    { method: "POST" },
  );
  return res.link;
}

/** Which plan/currency a Dodo product ID stands for (products are configured per plan and currency). */
export function productPlan(productId: string): { plan: PlanId; currency: "INR" | "USD" } | null {
  for (const plan of ["image", "video"] as const) {
    for (const currency of ["INR", "USD"] as const) {
      const id = Deno.env.get(`DODO_PRODUCT_${plan.toUpperCase()}_${currency}`);
      if (id && id === productId) return { plan, currency };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Webhooks (Standard Webhooks: HMAC-SHA256 over "id.timestamp.body")

function decodeBase64(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

export async function verifyWebhook(req: Request, body: string): Promise<boolean> {
  const id = req.headers.get("webhook-id");
  const timestamp = req.headers.get("webhook-timestamp");
  const signatures = req.headers.get("webhook-signature");
  if (!id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const secret = env.dodoWebhookSecret;
  const keyBytes = secret.startsWith("whsec_") ? decodeBase64(secret.slice(6)) : new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)));
  const expected = btoa(String.fromCharCode(...mac));

  return signatures.split(" ").some((entry) => {
    const [, sig] = entry.split(",");
    if (!sig || sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}
