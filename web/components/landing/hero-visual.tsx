"use client";

import { Check, Clock3, Mail, Paperclip, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { SlidePreview } from "@/components/slide-preview";
import { PlatformIcon } from "@/components/post-bits";
import { SAMPLE_SLIDES, type SlideBrand } from "@/lib/slide-templates";

const brand: SlideBrand = {
  name: "SynCV",
  handle: "syncv.app",
  primary: "#6D28D9",
  accent: null,
  theme: "midnight",
  font: "inter",
  logo: null,
  cta: "Tailor your resume to any job in one click at syncv.app",
};

function Chip({ children, className, delay }: { children: React.ReactNode; className: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
      className={`absolute z-20 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#13131b]/90 px-3.5 py-2.5 text-[13px] font-medium shadow-2xl backdrop-blur-xl lg:flex ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="pointer-events-none absolute -inset-x-20 -top-24 -bottom-10 bg-[radial-gradient(ellipse_at_center,rgb(139_92_246/0.28),transparent_60%)]" />

      <Chip className="-top-5 left-10 animate-float" delay={0.9}>
        <Clock3 className="size-4 text-brand-soft" /> 5:00 PM · Generated from your calendar
      </Chip>
      <Chip className="top-24 -right-10 animate-float [animation-delay:1.5s]" delay={1.2}>
        <Paperclip className="size-4 text-brand-soft" /> 7 slides + LinkedIn PDF attached
      </Chip>
      <Chip className="-bottom-5 left-1/3 animate-float [animation-delay:0.7s]" delay={1.4}>
        <Check className="size-4 text-emerald-400" /> Captions copied — ready to post
      </Chip>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.21, 0.6, 0.35, 1] }}
        className="glow-ring relative z-10 overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d13]/90 backdrop-blur"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-white/10" />
            <span className="size-3 rounded-full bg-white/10" />
            <span className="size-3 rounded-full bg-white/10" />
          </div>
          <div className="flex min-w-0 items-center gap-2 text-[13px] text-ink-mute">
            <Mail className="size-4 shrink-0" />
            <span className="truncate">
              <span className="text-ink-soft">Review today&apos;s post:</span> 5 resume mistakes that get you
              auto-rejected
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[1.35fr_1fr] md:p-7">
          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_SLIDES.map((slide, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-white/10 shadow-xl">
                <SlidePreview slide={slide} index={i} total={SAMPLE_SLIDES.length} brand={brand} />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand-soft">
                Resume Carousel
              </span>
              <span className="text-xs text-ink-mute">Monday · 7 slides</span>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-ink-mute uppercase">
                <PlatformIcon provider="linkedin" className="size-3.5" /> LinkedIn caption
              </div>
              <p className="line-clamp-3 text-[13px] leading-relaxed text-ink-soft">
                Recruiters skim your resume in about 7 seconds. These 5 mistakes are why so many strong candidates
                never hear back…
              </p>
              <p className="mt-2 text-[12px] text-brand-soft">#ResumeTips #JobSearch #CareerAdvice</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-ink-mute uppercase">
                <PlatformIcon provider="instagram" className="size-3.5" /> Instagram caption
              </div>
              <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
                Resume tips you&apos;ll wish you knew sooner ✨ Save this before your next application…
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

export function ThemeShowcase() {
  const slide = {
    kind: "cover" as const,
    eyebrow: "Interview tips",
    heading: "Answer ==any== behavioural question in 4 steps",
    body: "The STAR method, without sounding rehearsed.",
    bullets: null,
  };
  const themes: SlideBrand["theme"][] = ["midnight", "paper", "bold"];
  const fonts: SlideBrand["font"][] = ["inter", "editorial", "jakarta"];
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {themes.map((theme, i) => (
        <div key={theme} className="group">
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition duration-300 group-hover:-translate-y-1">
            <SlidePreview slide={slide} index={0} total={6} brand={{ ...brand, theme, font: fonts[i] }} />
          </div>
          <p className="mt-3 text-center text-sm text-ink-mute capitalize">{theme}</p>
        </div>
      ))}
    </div>
  );
}
