"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { Platform, PostStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui";

const STATUS: Record<PostStatus, { label: string; tone: Parameters<typeof Badge>[0]["tone"]; pulse?: boolean }> = {
  generating: { label: "Generating", tone: "brand", pulse: true },
  ready: { label: "Ready to post", tone: "green" },
  superseded: { label: "Replaced", tone: "neutral" },
  failed: { label: "Failed", tone: "red" },
};

export function StatusBadge({ status, className }: { status: PostStatus; className?: string }) {
  const s = STATUS[status] ?? STATUS.failed;
  return (
    <Badge tone={s.tone} className={className}>
      <span className="relative flex size-1.5">
        {s.pulse && <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />}
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>
      {s.label}
    </Badge>
  );
}

/** Horizontally scrolling, snap-aligned slide viewer for rendered images. */
export function SlideStrip({ images, alt, className }: { images: string[]; alt?: string | null; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const go = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    const width = el.clientWidth;
    el.scrollTo({ left: Math.round(el.scrollLeft / width + dir) * width, behavior: "smooth" });
  };

  if (!images.length) return null;
  return (
    <div className={cn("group relative", className)}>
      <div
        ref={ref}
        onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-line bg-black/40"
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={i === 0 && alt ? alt : `Slide ${i + 1}`}
            className="aspect-[4/5] w-full shrink-0 snap-center object-cover"
            loading={i < 2 ? "eager" : "lazy"}
          />
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={active === 0}
            className="absolute top-1/2 left-3 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-tint/15 bg-black/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 disabled:!opacity-0"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={active === images.length - 1}
            className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-tint/15 bg-black/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 disabled:!opacity-0"
            aria-label="Next slide"
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((src, i) => (
              <span
                key={src}
                className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-white" : "w-1.5 bg-tint/25")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PlatformIcon({ provider, className }: { provider: Platform; className?: string }) {
  const cls = cn("size-4 shrink-0", className);
  switch (provider) {
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <rect width="24" height="24" rx="5" fill="#0A66C2" />
          <path
            fill="#fff"
            d="M7.1 9.6h-2.2V18h2.2V9.6Zm.2-2.6a1.3 1.3 0 1 0-2.6 0 1.3 1.3 0 0 0 2.6 0ZM19 13.2c0-2.5-1.3-3.8-3.2-3.8-1.4 0-2.1.8-2.4 1.4V9.6h-2.2V18h2.2v-4.3c0-1.1.4-1.9 1.5-1.9 1 0 1.4.8 1.4 1.9V18H19v-4.8Z"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <rect width="24" height="24" rx="6" fill="#1877F2" />
          <path fill="#fff" d="M13.3 19v-5.6h1.9l.3-2.2h-2.2V9.8c0-.6.2-1.1 1.1-1.1h1.2V6.8c-.2 0-.9-.1-1.7-.1-1.7 0-2.9 1-2.9 3v1.6H9v2.2h1.9V19h2.4Z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <rect width="24" height="24" rx="6" fill="#111111" />
          <path fill="#fff" d="M13.2 11.1 17.6 6h-1.1l-3.8 4.4L9.7 6H6.2l4.6 6.7L6.2 18h1l4-4.7 3.2 4.7h3.5l-4.7-6.9Zm-1.4 1.7-.5-.7-3.7-5.3h1.6l3 4.3.5.7 3.9 5.6H15l-3.2-4.6Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <rect width="24" height="24" rx="6" fill="#111111" />
          <path fill="#25F4EE" d="M10.3 10.7v-.6c-2.4-.3-4.4 1.6-4.4 4 0 1.8 1.3 3.4 3.1 3.9-1.6-1.4-1.8-3.8-.4-5.4.4-.9 1.2-1.6 2.2-1.9h-.5Z" />
          <path fill="#FE2C55" d="M13.4 5.4h1.7c.2 1.6 1.5 2.8 3 2.9v1.7c-1.1 0-2.2-.4-3-1v4.4c0 2.4-2 4.3-4.4 4.3-.9 0-1.7-.3-2.4-.7a4.3 4.3 0 0 0 7.4-3V9.6c.9.6 1.9 1 3 1V8.9c-1.5-.1-2.8-1.3-3-2.9h-1.7v-.6Z" />
          <path fill="#fff" d="M12.8 6h1.7c.2 1.6 1.5 2.8 3 2.9v1.6c-1.1 0-2.1-.3-3-.9v4.4a4.3 4.3 0 0 1-7.4 3c-1.4-1.6-1.2-4 .4-5.4.8-.7 1.8-1 2.8-1v1.7c-1.2-.1-2.2.8-2.3 2 0 1.2.9 2.2 2.1 2.3 1.2 0 2.3-.9 2.3-2.1V6h.4Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <defs>
            <radialGradient id="ig-grad" cx="0.3" cy="1.07" r="1.2">
              <stop offset="0" stopColor="#FFD776" />
              <stop offset="0.25" stopColor="#F3A554" />
              <stop offset="0.5" stopColor="#E1306C" />
              <stop offset="0.8" stopColor="#B530C2" />
              <stop offset="1" stopColor="#6A3CDB" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
          <rect x="6" y="6" width="12" height="12" rx="3.6" fill="none" stroke="#fff" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="2.9" fill="none" stroke="#fff" strokeWidth="1.7" />
          <circle cx="15.7" cy="8.3" r="0.9" fill="#fff" />
        </svg>
      );
  }
}
