// Plans and payments for the signed-in user (Dodo Payments).
//   { action: "checkout", plan, currency } → { url } hosted checkout
//   { action: "change", plan }             → switch an active subscription to another plan
//   { action: "portal" }                   → { url } Dodo customer portal
import { admin, userFromRequest, type Workspace } from "../_shared/db.ts";
import { changePlan, createCheckout, portalLink, subscriptionOf } from "../_shared/billing.ts";
import { env } from "../_shared/env.ts";
import { HttpError, json, serve } from "../_shared/http.ts";
import { ENTITLED_STATUSES, type PlanId } from "../_shared/plans.ts";

serve(async (req) => {
  const user = await userFromRequest(req);
  const { data } = await admin().from("workspaces").select("*").eq("owner_id", user.id).maybeSingle();
  const w = data as Workspace | null;
  if (!w) throw new HttpError(404, "Finish onboarding first");
  const body = await req.json().catch(() => ({}));
  const plan = body.plan as PlanId;
  const currency = body.currency === "INR" ? "INR" : "USD";
  const sub = await subscriptionOf(w.id);
  const entitled = !!sub && ENTITLED_STATUSES.includes(sub.status);

  switch (body.action) {
    case "checkout": {
      if (plan !== "image" && plan !== "video") throw new HttpError(400, "Unknown plan");
      if (entitled && sub?.subscription_id) throw new HttpError(409, "You already have a plan. Switch plans instead.");
      const session = await createCheckout({
        productId: env.dodoProduct(plan, currency),
        email: user.email!,
        name: (user.user_metadata?.full_name as string | undefined) ?? w.brand_name,
        returnUrl: `${env.siteUrl}/dashboard/billing?checkout=done`,
        metadata: { workspace_id: w.id, plan },
      });
      if (!session.checkout_url) throw new Error("Dodo Payments didn't return a checkout link");
      return json({ url: session.checkout_url });
    }
    case "change": {
      if (plan !== "image" && plan !== "video") throw new HttpError(400, "Unknown plan");
      if (!entitled || !sub?.subscription_id) throw new HttpError(409, "There's no active subscription to change.");
      const subCurrency = sub.currency === "INR" ? "INR" : "USD";
      await changePlan(sub.subscription_id, env.dodoProduct(plan, subCurrency));
      return json({ ok: true });
    }
    case "portal": {
      if (!sub?.customer_id) throw new HttpError(409, "There's no billing account yet.");
      return json({ url: await portalLink(sub.customer_id, `${env.siteUrl}/dashboard/billing`) });
    }
    default:
      throw new HttpError(400, "Unknown action");
  }
});
