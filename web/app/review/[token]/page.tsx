import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewClient, ReviewHeader } from "./review-client";

export const metadata: Metadata = {
  title: "Today's post",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ReviewPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgb(139_92_246/0.18),transparent_65%)]" />
      <header className="relative border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
          <ReviewHeader />
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
        <Suspense fallback={<div className="skeleton h-[560px] rounded-2xl" />}>
          <ReviewClient />
        </Suspense>
      </main>
    </div>
  );
}
