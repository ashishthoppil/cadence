"use client";

import { CalendarDays, CreditCard, ImageIcon, LayoutGrid, LogOut, Palette, Rows3, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, Suspense, useEffect } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLANS } from "@/lib/plans";
import { useWorkspace } from "@/components/workspace-provider";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/posts", label: "Posts", icon: Rows3 },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/brand", label: "Brand & design", icon: Palette },
  { href: "/dashboard/media", label: "Photos", icon: ImageIcon },
  { href: "/dashboard/billing", label: "Plan & billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavLinks({ pathname }: { pathname: string | null }) {
  const isActive = (href: string) =>
    pathname !== null && (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
  return (
    <nav className="no-scrollbar flex min-w-0 flex-1 justify-center gap-0.5 overflow-x-auto px-1 md:mt-8 md:flex-none md:flex-col md:justify-start md:gap-1 md:px-0">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition md:px-3",
            isActive(item.href)
              ? "bg-tint/[0.07] font-medium text-ink"
              : "text-ink-mute hover:bg-tint/[0.04] hover:text-ink-soft",
          )}
        >
          <item.icon className="size-4" />
          <span className="hidden md:inline">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

// The pathname is URL data, so it streams in behind Suspense on dynamic routes.
function ActiveNav() {
  return <NavLinks pathname={usePathname()} />;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, workspace, loading, plan, freePostsLeft } = useWorkspace();

  useEffect(() => {
    if (!loading && !workspace?.onboarded_at) router.replace("/onboarding");
  }, [loading, workspace, router]);

  async function signOut() {
    await supabase().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur-xl md:h-screen md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:bg-panel/50 md:px-3 md:py-5">
        <Logo href="/dashboard" className="md:px-2" wordClassName="hidden md:inline" />
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNav />
        </Suspense>
        <ThemeToggle className="ml-1 shrink-0 md:hidden" />
        <div className="mt-auto hidden space-y-3 md:block">
          <Link
            href="/dashboard/billing"
            className="block rounded-xl border border-line bg-tint/[0.03] px-3 py-2.5 transition hover:border-line-strong"
          >
            <p className="text-xs font-semibold text-ink">{plan === "free" ? "Free trial" : PLANS[plan].name}</p>
            <p className="mt-0.5 text-[11px] text-ink-mute">
              {plan === "free" ? `${freePostsLeft} free post${freePostsLeft === 1 ? "" : "s"} left · Upgrade` : "Manage plan"}
            </p>
          </Link>
          <ThemeToggle />
        </div>
        <div className="mt-4 hidden border-t border-line pt-4 md:block">
          <div className="flex items-center gap-2.5 px-2">
            <div
              className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
              style={{ background: workspace?.primary_color ?? "#6D28D9" }}
            >
              {(workspace?.brand_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{workspace?.brand_name ?? "…"}</p>
              <p className="truncate text-xs text-ink-mute">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg p-1.5 text-ink-mute transition hover:bg-tint/[0.06] hover:text-ink"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          {loading || !workspace?.onboarded_at ? (
            <div className="space-y-4">
              <div className="skeleton h-9 w-56 rounded-lg" />
              <div className="skeleton h-48 rounded-2xl" />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="skeleton h-28 rounded-2xl" />
                <div className="skeleton h-28 rounded-2xl" />
                <div className="skeleton h-28 rounded-2xl" />
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
