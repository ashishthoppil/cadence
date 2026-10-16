import type { Metadata } from "next";
import { Suspense } from "react";
import { BillingView } from "./billing-view";

export const metadata: Metadata = { title: "Plan & billing" };

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <BillingView />
    </Suspense>
  );
}
