"use client";

import { Check, Copy, Download, FileText, Film } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/post-bits";
import { Segmented } from "@/components/ui";
import { PLATFORMS } from "@/lib/presets";
import type { Captions, Download as DownloadLink, Platform } from "@/lib/types";

const NAMES = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.label])) as Record<Platform, string>;

/** Captions for each platform, each copyable (caption + hashtags) in one tap. */
export function CaptionPanel({ captions, platforms }: { captions: Captions; platforms?: Platform[] }) {
  const available = (platforms?.length ? platforms : (Object.keys(captions) as Platform[])).filter((p) => captions[p]);
  const [platform, setPlatform] = useState<Platform | undefined>(available[0]);
  const [copied, setCopied] = useState(false);
  const active = platform && captions[platform] ? platform : available[0];
  const current = active ? captions[active] : undefined;

  if (!active || !current) return <p className="text-sm text-ink-mute">No captions yet.</p>;

  const tags = current.hashtags.map((t) => `#${t}`).join(" ");
  const full = tags ? `${current.caption.trim()}\n\n${tags}` : current.caption.trim();

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      toast.success(`${NAMES[active!]} caption copied`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Select the text instead.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="no-scrollbar min-w-0 overflow-x-auto">
          <Segmented<Platform>
            value={active}
            onChange={setPlatform}
            options={available.map((p) => ({
              value: p,
              label: (
                <>
                  <PlatformIcon provider={p} className="size-3.5" /> <span className="hidden sm:inline">{NAMES[p]}</span>
                </>
              ),
            }))}
          />
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-tint/[0.06] px-3 text-[13px] font-medium whitespace-nowrap text-ink transition hover:bg-tint/[0.1]"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : <><span className="sm:hidden">Copy</span><span className="hidden sm:inline">Copy caption</span></>}
        </button>
      </div>
      <div className="max-h-[440px] overflow-y-auto rounded-xl border border-line bg-tint/[0.02] p-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft select-text">
        {current.caption}
        {tags && <p className="mt-3 text-brand-soft">{tags}</p>}
      </div>
      <p className="text-xs text-ink-mute">
        {NAMES[active]} · {full.length.toLocaleString()} characters · {current.hashtags.length} hashtags
      </p>
    </div>
  );
}

/** Download buttons for the slides, the LinkedIn PDF and the video. */
export function DownloadList({
  slides,
  pdf,
  video,
  credits,
}: {
  slides: DownloadLink[];
  pdf: DownloadLink | null;
  video?: DownloadLink | null;
  credits?: string[];
}) {
  if (!slides.length && !video) return null;
  const linkClass =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] text-ink-soft transition hover:border-line-strong hover:text-ink";
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold tracking-wider text-ink-mute uppercase">Downloads</p>
      <div className="flex flex-wrap gap-2">
        {video && (
          <a href={video.url} className={`${linkClass} border-brand/30 bg-brand/10 text-brand-soft`} title={video.name}>
            <Film className="size-3.5" /> Download video
          </a>
        )}
        {pdf && (
          <a href={pdf.url} className={`${linkClass} border-brand/30 bg-brand/10 text-brand-soft`} title={pdf.name}>
            <FileText className="size-3.5" /> PDF for LinkedIn
          </a>
        )}
        {slides.map((s, i) => (
          <a key={s.url} href={s.url} className={linkClass} title={s.name}>
            <Download className="size-3.5" /> {slides.length > 1 ? `Slide ${i + 1}` : "Image"}
          </a>
        ))}
      </div>
      {pdf && (
        <p className="text-xs leading-relaxed text-ink-mute">
          Post the slides as a carousel, in order. On LinkedIn, add the PDF as a document for a swipeable carousel.
        </p>
      )}
      {!!credits?.length && <p className="text-xs text-ink-mute">{credits.join(" · ")}</p>}
    </div>
  );
}

export function VideoPlayer({ src, className }: { src: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-line bg-black ${className ?? ""}`}>
      <video src={src} controls playsInline preload="metadata" className="mx-auto aspect-[9/16] max-h-[640px] w-full bg-black object-contain" />
    </div>
  );
}
