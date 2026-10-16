"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlanPicker } from "@/components/plan-picker";
import { useWorkspace } from "@/components/workspace-provider";
import { Badge, Button, Card, SectionHeading } from "@/components/ui";
import { type Currency, FREE_POSTS, type PlanId, PLANS } from "@/lib/plans";
import { invoke } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

export function BillingView() {
  const params = useSearchParams();
  const router = useRouter();
  const { plan, subscription, freePostsLeft, reloadSubscription } = useWorkspace();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const returned = params.get("checkout") === "done";

  // Dodo confirms payment by webhook, which can land a few seconds after the redirect back.
  useEffect(() => {
    if (!returned) return;
    toast.success("Thanks! Your plan will be active in a moment.", { id: "checkout" });
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      reloadSubscription();
      if (tries >= 8) {
        clearInterval(timer);
        router.replace("/dashboard/billing");
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [returned, reloadSubscription, router]);

  async function choose(next: PlanId, currency: Currency) {
    setBusy(next);
    try {
      if (plan !== "free") {
        await invoke("billing", { action: "change", plan: next });
        toast.success(`Switching to ${PLANS[next].name}. It takes effect in a moment.`);
        setTimeout(reloadSubscription, 4000);
        setBusy(null);
        return;
      }
      const { url } = await invoke<{ url: string }>("billing", { action: "checkout", plan: next, currency });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  }

  async function openPortal() {
    setPortalBusy(true);
    try {
      const { url } = await invoke<{ url: string }>("billing", { action: "portal" });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open billing");
      setPortalBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading title="Plan & billing" description="Your plan, usage and payment details." />

      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">{plan === "free" ? "Free trial" : PLANS[plan].name}</p>
            {plan !== "free" && (
              <Badge tone="green">
                <CheckCircle2 className="size-3" /> Active
              </Badge>
            )}
            {subscription && plan === "free" && <Badge tone="amber">{subscription.status.replace("_", " ")}</Badge>}
          </div>
          <p className="mt-1 text-sm text-ink-mute">
            {plan === "free"
              ? `${freePostsLeft} of ${FREE_POSTS} free posts left. Pick a plan to get a post every day.`
              : subscription?.cancel_at_period_end && subscription.current_period_end
              ? `Cancels on ${formatDate(subscription.current_period_end.slice(0, 10), { day: "numeric", month: "long", year: "numeric" })}.`
              : subscription?.current_period_end
              ? `Renews on ${formatDate(subscription.current_period_end.slice(0, 10), { day: "numeric", month: "long", year: "numeric" })}.`
              : "Daily posts are on."}
          </p>
        </div>
        {subscription?.customer_id && (
          <Button variant="secondary" onClick={openPortal} loading={portalBusy}>
            Manage billing <ExternalLink className="size-3.5" />
          </Button>
        )}
      </Card>

      <PlanPicker mode="app" current={plan} busy={busy} onSelect={choose} />
    </div>
  );
}
