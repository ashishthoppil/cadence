"use client";

import { ChevronDown, Film, Image as ImageIcon, Lock, Rows3, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui";
import { generateNow } from "@/lib/posts";
import type { PostFormat } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { format: PostFormat | undefined; label: string; icon: typeof Rows3 }[] = [
  { format: undefined, label: "Today's planned format", icon: Wand2 },
  { format: "carousel", label: "Carousel", icon: Rows3 },
  { format: "image", label: "Single image", icon: ImageIcon },
  { format: "video", label: "Short video", icon: Film },
];

/** "Generate a post now" with an optional format override. */
export function GenerateMenu({ label = "Generate a post now", className }: { label?: string; className?: string }) {
  const router = useRouter();
  const { plan, freePostsLeft } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function run(format?: PostFormat) {
    setOpen(false);
    if (plan === "free" && freePostsLeft === 0) {
      toast.error("You've used your free posts. Choose a plan to keep going.");
      return router.push("/dashboard/billing");
    }
    setBusy(true);
    try {
      const { post_id } = await generateNow(format);
      toast.success("Creating your post. It'll land in your inbox in about a minute.", { id: "generate" });
      router.push(`/dashboard/posts/${post_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start generation");
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <Button onClick={() => run()} loading={busy} className="rounded-r-none">
        {!busy && <Wand2 className="size-4" />} {label}
      </Button>
      <Button
        aria-label="Choose a format"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="rounded-l-none border-l border-white/20 px-2.5"
      >
        <ChevronDown className="size-4" />
      </Button>
      {open && (
        <div className="absolute top-full right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-raised p-1 shadow-2xl">
          {OPTIONS.map((o) => {
            const locked = o.format === "video" && plan !== "video";
            return (
              <button
                key={o.label}
                type="button"
                onClick={() => (locked ? router.push("/dashboard/billing") : run(o.format))}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-tint/[0.06] hover:text-ink"
              >
                {locked ? <Lock className="size-4 text-ink-mute" /> : <o.icon className="size-4 text-brand-soft" />}
                <span className="flex-1">{o.label}</span>
                {locked && <span className="text-[11px] text-ink-mute">Video plan</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
