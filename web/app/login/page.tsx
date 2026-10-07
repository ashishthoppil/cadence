import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-x-clip px-4 py-16">
      <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-[480px] w-[720px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgb(139_92_246/0.25),transparent_65%)]" />
      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glow-ring rounded-3xl border border-white/10 bg-panel/90 p-7 backdrop-blur">
          <h1 className="text-center text-xl font-semibold tracking-tight">Welcome to Cadence</h1>
          <p className="mt-1.5 mb-6 text-center text-sm text-ink-mute">Your daily posts, written, designed and ready to go.</p>
          <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
