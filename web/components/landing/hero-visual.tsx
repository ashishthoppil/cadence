"use client";

import { Check, Clock3, Film, Mail, Paperclip, Play, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { PlatformIcon } from "@/components/post-bits";
import { SlidePreview } from "@/components/slide-preview";
import { Segmented } from "@/components/ui";
import {
  SAMPLE_SLIDES,
  samplePhoto,
  type Slide,
  type SlideBrand,
  TEMPLATE_IDS,
  TEMPLATES,
  type TemplateId,
} from "@/lib/slide-templates";

const brand: SlideBrand = {
  name: "Northwind",
  handle: "northwind.co",
  primary: "#6D28D9",
  accent: null,
  template: "midnight",
  logo: null,
  cta: "Start your free trial at northwind.co",
};

const withPhoto = (slide: Slide, i: number, primary = brand.primary): Slide => ({
  ...slide,
  image: { url: samplePhoto(primary, i) },
});

function Chip({ children, className, delay }: { children: React.ReactNode; className: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
      className={`absolute z-20 hidden items-center gap-2 rounded-xl border border-line bg-raised/90 px-3.5 py-2.5 text-[13px] font-medium shadow-2xl backdrop-blur-xl lg:flex ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="pointer-events-none absolute -inset-x-20 -top-24 -bottom-10 bg-[radial-gradient(ellipse_at_center,rgb(139_92_246/0.25),transparent_60%)]" />

      <Chip className="-top-5 left-10 animate-float" delay={0.9}>
        <Clock3 className="size-4 text-brand-soft" /> 5:00 PM · Made from your calendar
      </Chip>
      <Chip className="top-24 -right-10 animate-float [animation-delay:1.5s]" delay={1.2}>
        <Paperclip className="size-4 text-brand-soft" /> 7 slides + LinkedIn PDF attached
      </Chip>
      <Chip className="-bottom-5 left-1/3 animate-float [animation-delay:0.7s]" delay={1.4}>
        <Check className="size-4 text-emerald-500" /> Captions for every platform
      </Chip>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.21, 0.6, 0.35, 1] }}
        className="glow-ring relative z-10 overflow-hidden rounded-3xl border border-line bg-panel/90 backdrop-blur"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-tint/10" />
            <span className="size-3 rounded-full bg-tint/10" />
            <span className="size-3 rounded-full bg-tint/10" />
          </div>
          <div className="flex min-w-0 items-center gap-2 text-[13px] text-ink-mute">
            <Mail className="size-4 shrink-0" />
            <span className="truncate">
              <span className="text-ink-soft">Ready to post:</span> 3 habits of brands that grow every week
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[1.35fr_1fr] md:p-7">
          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_SLIDES.map((slide, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-tint/10 shadow-xl">
                <SlidePreview slide={slide} index={i === 2 ? 6 : i} total={7} brand={brand} />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand-soft">How-to</span>
              <span className="text-xs text-ink-mute">Monday · 7 slides</span>
            </div>
            <div className="rounded-xl border border-line bg-tint/[0.02] p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-ink-mute uppercase">
                <PlatformIcon provider="linkedin" className="size-3.5" /> LinkedIn caption
              </div>
              <p className="line-clamp-3 text-[13px] leading-relaxed text-ink-soft">
                Consistency beats intensity. The brands that grow on social media aren&apos;t posting more. They&apos;re
                posting on a rhythm their audience can rely on.
              </p>
              <p className="mt-2 text-[12px] text-brand-soft">#SocialMedia #ContentMarketing #SmallBusiness</p>
            </div>
            <div className="rounded-xl border border-line bg-tint/[0.02] p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-ink-mute uppercase">
                <PlatformIcon provider="instagram" className="size-3.5" /> Instagram caption
              </div>
              <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
                3 habits that make growth feel easy ✨ Save this for your next planning session.
              </p>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-8px_rgb(139_92_246/0.8)]">
                <Sparkles className="size-3.5" /> Open post page
              </span>
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-[13px] font-medium text-ink-soft">
                <RefreshCw className="size-3.5" /> Regenerate
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Every template, rendered live with a sample brand. */
export function TemplateShowcase() {
  const [kind, setKind] = useState<"all" | "text" | "photo">("all");
  const ids = TEMPLATE_IDS.filter((id) => kind === "all" || TEMPLATES[id].kind === kind);
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Segmented<"all" | "text" | "photo">
          value={kind}
          onChange={setKind}
          options={[
            { value: "all", label: `All ${TEMPLATE_IDS.length}` },
            { value: "text", label: "Text-first" },
            { value: "photo", label: "With photos" },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {ids.map((id: TemplateId, i) => (
          <div key={id} className="group">
            <div className="overflow-hidden rounded-xl border border-tint/10 shadow-lg transition duration-300 group-hover:-translate-y-1">
              <SlidePreview slide={withPhoto(SAMPLE_SLIDES[0], i)} index={0} total={7} brand={{ ...brand, template: id }} />
            </div>
            <p className="mt-2 text-center text-xs text-ink-mute">{TEMPLATES[id].name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Text-first brands vs product brands: the same product adapts to the business. */
export function AudienceShowcase() {
  const productBrand: SlideBrand = { ...brand, name: "Halo", handle: "halo.skin", primary: "#0F766E", template: "photo-full" };
  const productSlide: Slide = {
    kind: "cover",
    eyebrow: "New in",
    heading: "Meet the serum your ==morning routine== needed",
    body: "Lightweight, fragrance-free and made for everyday use.",
    bullets: null,
  };
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-3xl border border-line bg-panel/60 p-6">
        <p className="text-sm font-semibold">For software, services and creators</p>
        <p className="mt-1 text-sm text-ink-mute">
          Bold, readable carousels that teach. Tips, guides, frameworks and insights that people save.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="overflow-hidden rounded-xl border border-tint/10 shadow-lg">
            <SlidePreview slide={SAMPLE_SLIDES[0]} total={7} brand={{ ...brand, template: "paper" }} />
          </div>
          <div className="overflow-hidden rounded-xl border border-tint/10 shadow-lg">
            <SlidePreview slide={SAMPLE_SLIDES[1]} index={1} total={7} brand={{ ...brand, template: "paper" }} />
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-line bg-panel/60 p-6">
        <p className="text-sm font-semibold">For product brands and local businesses</p>
        <p className="mt-1 text-sm text-ink-mute">
          Upload your product photos, or let us find stock photos. Posts and short videos are built around them.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="overflow-hidden rounded-xl border border-tint/10 shadow-lg">
            <SlidePreview slide={withPhoto(productSlide, 0, productBrand.primary)} total={1} brand={productBrand} />
          </div>
          <div className="relative grid overflow-hidden rounded-xl border border-tint/10 bg-gradient-to-b from-teal-700 to-teal-950 shadow-lg">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgb(255_255_255/0.25),transparent_60%)]" />
            <div className="relative flex flex-col items-center justify-center gap-3 p-4 text-center text-white">
              <span className="grid size-12 place-items-center rounded-full bg-white/20 backdrop-blur">
                <Play className="size-5 fill-white" />
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <Film className="size-3.5" /> 8-second vertical video
              </span>
              <span className="text-[11px] text-white/75">For Reels, Shorts and TikTok</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
