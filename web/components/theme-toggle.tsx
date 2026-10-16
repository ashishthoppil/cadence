"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const ORDER = ["system", "light", "dark"] as const;
const ICONS = { system: Monitor, light: Sun, dark: Moon };
const LABELS = { system: "System theme", light: "Light theme", dark: "Dark theme" };

// Theme is only known in the browser; render a neutral placeholder on the server.
const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

/** Cycles system → light → dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current = (mounted && (theme as (typeof ORDER)[number])) || "system";
  const Icon = ICONS[current] ?? Monitor;
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`${LABELS[current]} (click for ${LABELS[next].toLowerCase()})`}
      aria-label={`Switch to ${LABELS[next].toLowerCase()}`}
      className={cn(
        "grid size-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-line-strong hover:bg-tint/[0.05] hover:text-ink",
        className,
      )}
    >
      {mounted ? <Icon className="size-4" /> : <span className="size-4" />}
    </button>
  );
}
