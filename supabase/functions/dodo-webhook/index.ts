// Dodo Payments webhook: keeps the `subscriptions` table in sync.
import { admin } from "../_shared/db.ts";
import { productPlan, verifyWebhook } from "../_shared/billing.ts";
import { json, serve } from "../_shared/http.ts";

interface SubscriptionData {
  payload_type?: string;
  subscription_id?: string;
  status?: string;
  product_id?: string;
  currency?: string;
  next_billing_date?: string;
  cancel_at_next_billing_date?: boolean;
  customer?: { customer_id?: string; email?: string };
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  const raw = await req.text();
  if (!(await verifyWebhook(req, raw))) return json({ error: "Invalid signature" }, 401);

  const event = JSON.parse(raw) as { type?: string; data?: SubscriptionData };
  const data = event.data ?? {};
  if (!event.type?.startsWith("subscription.") || !data.subscription_id) return json({ ignored: event.type });

  // Find the workspace: checkout metadata first, then the paying customer's email.
  let workspaceId = typeof data.metadata?.workspace_id === "string" ? data.metadata.workspace_id : null;
  if (!workspaceId) {
    const { data: existing } = await admin()
      .from("subscriptions")
      .select("workspace_id")
      .eq("subscription_id", data.subscription_id)
      .maybeSingle();
    workspaceId = existing?.workspace_id ?? null;
  }
  if (!workspaceId && data.customer?.email) {
    const { data: found } = await admin().rpc("workspace_for_email", { lookup: data.customer.email });
    workspaceId = (found as string | null) ?? null;
  }
  if (!workspaceId) {
    console.error("Webhook for unknown workspace", data.subscription_id, data.customer?.email);
    return json({ error: "Unknown workspace" }, 200);
  }

  const mapped = data.product_id ? productPlan(data.product_id) : null;
  const plan = mapped?.plan ?? (data.metadata?.plan === "video" ? "video" : "image");
  const status = data.status ?? (event.type === "subscription.active" ? "active" : event.type.replace("subscription.", ""));

  const { error } = await admin().from("subscriptions").upsert({
    workspace_id: workspaceId,
    plan,
    status,
    provider: "dodo",
    subscription_id: data.subscription_id,
    customer_id: data.customer?.customer_id ?? null,
    product_id: data.product_id ?? null,
    currency: data.currency ?? mapped?.currency ?? null,
    current_period_end: data.next_billing_date ?? null,
    cancel_at_period_end: !!data.cancel_at_next_billing_date,
  });
  if (error) throw error;

  if (status === "active") {
    await admin().from("workspaces").update({ upgrade_notified_at: null }).eq("id", workspaceId);
  }
  return json({ ok: true });
});
