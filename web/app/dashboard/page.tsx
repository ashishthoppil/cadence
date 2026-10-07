import type { Metadata } from "next";
import { Suspense } from "react";
import { Overview } from "./overview";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <Overview />
    </Suspense>
  );
}
