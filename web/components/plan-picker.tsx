"use client";

import { Check, Film, Images } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, ButtonLink, Segmented } from "@/components/ui";
import { type Currency, FREE_POSTS, formatPrice, type PlanId, PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

/** Guess the currency: INR for visitors in India, USD for everyone else. */
export function useCurrency(): [Currency, (c: Currency) => void] {
  const [currency, setCurrency] = useState<Currency>("USD");
  const chosen = useRef(false);
  useEffect(() => {
    let active = true;
    const fromTimezone = (): Currency => {
      try {
        return /^Asia\/(Kolkata|Calcutta)$/.test(Intl.DateTimeFormat().resolvedOptions().timeZone) ? "INR" : "USD";
      } catch {
        return "USD";
      }
    };
    fetch("/api/region")
      .then((r) => r.json())
      .then(({ country }): Currency => (country ? (country === "IN" ? "INR" : "USD") : fromTimezone()))
      .catch(fromTimezone)
      .then((c) => {
        if (active && !chosen.current) setCurrency(c);
      });
    return () => {
      active = false;
    };
  }, []);
  return [
    currency,
    (c) => {
      chosen.current = true;
      setCurrency(c);
    },
  ];
}

export function PlanPicker({
  mode,
  current,
  busy,
  onSelect,
}: {
  /** "marketing" links to sign-up; "app" calls onSelect. */
  mode: "marketing" | "app";
  current?: "free" | PlanId;
  busy?: PlanId | null;
  onSelect?: (plan: PlanId, currency: Currency) => void;
}) {
  const [currency, setCurrency] = useCurrency();

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Segmented<Currency>
          value={currency}
          onChange={setCurrency}
          options={[
            { value: "INR", label: "₹ INR (India)" },
            { value: "USD", label: "$ USD" },
          ]}
        />
      </div>
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const plan = PLANS[id];
          const featured = id === "video";
          const isCurrent = current === id;
          return (
            <div
              key={id}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7",
                featured ? "glow-ring border-brand/40 bg-gradient-to-b from-brand/[0.12] to-panel" : "border-line bg-panel",
              )}
            >
              {featured && <Badge tone="brand" className="absolute top-6 right-6">Most popular</Badge>}
              <div className="flex items-center gap-2.5">
                <div className="grid size-10 place-items-center rounded-xl bg-brand/15">
                  {plan.video ? <Film className="size-5 text-brand-soft" /> : <Images className="size-5 text-brand-soft" />}
                </div>
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-xs text-ink-mute">{plan.tagline}</p>
                </div>
              </div>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight">{formatPrice(plan.price[currency], currency)}</span>
                <span className="text-sm text-ink-mute">/ month</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                {mode === "marketing" ? (
                  <ButtonLink href="/login?mode=signup" className="w-full" variant={featured ? "primary" : "secondary"} size="lg">
                    Start with {FREE_POSTS} free posts
                  </ButtonLink>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    variant={featured ? "primary" : "secondary"}
                    disabled={isCurrent}
                    loading={busy === id}
                    onClick={() => onSelect?.(id, currency)}
                  >
                    {isCurrent ? "Your current plan" : current && current !== "free" ? `Switch to ${plan.name}` : `Choose ${plan.name}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-ink-mute">
        {current && current !== "free"
          ? "Plan changes are prorated. Cancel any time from Manage billing. Payments by Dodo Payments."
          : `Try it first: your first ${FREE_POSTS} posts are free, no card needed. Cancel any time. Payments by Dodo Payments.`}
      </p>
    </div>
  );
}
