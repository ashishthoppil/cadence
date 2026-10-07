"use client";

import { createElement, useEffect, useRef, useState } from "react";
import {
  buildSlide,
  type H,
  isDarkTheme,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type Slide,
  type SlideBrand,
} from "@/lib/slide-templates";
import type { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

const FONT_VARS: Record<string, string> = {
  Inter: "var(--font-inter), Inter, sans-serif",
  "Plus Jakarta Sans": "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
  "DM Serif Display": "var(--font-dm-serif), 'DM Serif Display', serif",
};

const h: H = (type, props, ...children) => createElement(type, props, ...(children as React.ReactNode[]));

export function brandFromWorkspace(w: Partial<Workspace>): SlideBrand {
  const theme = w.slide_theme ?? "midnight";
  const primary = w.primary_color || "#6D28D9";
  const dark = isDarkTheme({ theme, primary });
  const normal = w.logo_url ? { url: w.logo_url, aspect: w.logo_aspect || 1 } : null;
  const inverse = w.logo_inverse_url ? { url: w.logo_inverse_url, aspect: w.logo_inverse_aspect || 1 } : null;
  return {
    name: w.brand_name || "Your brand",
    handle: w.handle ?? null,
    primary,
    accent: w.accent_color ?? null,
    theme,
    font: w.slide_font ?? "inter",
    logo: dark ? inverse ?? normal : normal,
    cta: w.cta ?? null,
  };
}

/** Live, scaled rendering of a slide using the exact templates the server renders. */
export function SlidePreview({
  slide,
  index = 0,
  total = 1,
  brand,
  className,
}: {
  slide: Slide;
  index?: number;
  total?: number;
  brand: SlideBrand;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SLIDE_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-hidden rounded-[inherit]", className)}
      style={{ aspectRatio: `${SLIDE_WIDTH} / ${SLIDE_HEIGHT}` }}
    >
      {scale > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 origin-top-left select-none"
          style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `scale(${scale})` }}
        >
          {buildSlide(h, slide, index, total, brand, { fontFamily: (f) => FONT_VARS[f] ?? f }) as React.ReactNode}
        </div>
      )}
    </div>
  );
}
