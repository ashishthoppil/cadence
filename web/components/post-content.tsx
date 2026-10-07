"use client";

import { Check, Copy, Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/post-bits";
import { Segmented } from "@/components/ui";
import type { Download as DownloadLink } from "@/lib/types";

export interface Captions {
  linkedin: { caption: string; hashtags: string[] };
  instagram: { caption: string; hashtags: string[] };
}

/** Captions for both platforms, each copyable (caption + hashtags) in one tap. */
export function CaptionPanel({ value }: { value: Captions }) {
  const [platform, setPlatform] = useState<"linkedin" | "instagram">("linkedin");
  const [copied, setCopied] = useState(false);
  const current = value[platform];
  const tags = current.hashtags.map((t) => `#${t}`).join(" ");
  const full = tags ? `${current.caption.trim()}\n\n${tags}` : current.caption.trim();

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      toast.success(`${platform === "linkedin" ? "LinkedIn" : "Instagram"} caption copied`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — select the text instead");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Segmented<"linkedin" | "instagram">
          value={platform}
          onChange={setPlatform}
          options={[
            { value: "linkedin", label: <><PlatformIcon provider="linkedin" className="size-3.5" /> LinkedIn</> },
            { value: "instagram", label: <><PlatformIcon provider="instagram" className="size-3.5" /> Instagram</> },
          ]}
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 whitespace-nowrap text-[13px] font-medium text-ink transition hover:bg-white/[0.1]"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : <><span className="sm:hidden">Copy</span><span className="hidden sm:inline">Copy caption</span></>}
        </button>
      </div>
      <div className="max-h-[440px] overflow-y-auto rounded-xl border border-line bg-white/[0.02] p-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft select-text">
        {current.caption}
        {tags && <p className="mt-3 text-brand-soft">{tags}</p>}
      </div>
      <p className="text-xs text-ink-mute">
        {full.length.toLocaleString()} characters · {current.hashtags.length} hashtags
      </p>
    </div>
  );
}

/** Download buttons for each slide and the LinkedIn PDF. */
export function DownloadList({ slides, pdf }: { slides: DownloadLink[]; pdf: DownloadLink | null }) {
  if (!slides.length) return null;
  const linkClass =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] text-ink-soft transition hover:border-line-strong hover:text-ink";
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold tracking-wider text-ink-mute uppercase">Downloads</p>
      <div className="flex flex-wrap gap-2">
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
          Post the slides as an Instagram carousel in order. On LinkedIn, add the PDF as a document for a swipeable
          carousel.
        </p>
      )}
    </div>
  );
}
