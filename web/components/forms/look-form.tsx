"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { brandFromWorkspace, SlidePreview } from "@/components/slide-preview";
import { Field, Input, Segmented, Spinner } from "@/components/ui";
import { FONT_PAIRS, type FontPair, SAMPLE_SLIDES, type SlideTheme, THEMES } from "@/lib/slide-templates";
import { BRAND_BUCKET, supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Draft } from "./brand-forms";

const SWATCHES = ["#6D28D9", "#2563EB", "#0EA5E9", "#059669", "#E11D48", "#EA580C", "#111827"];

function ColorField({ label, value, onChange, optional }: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  optional?: boolean;
}) {
  return (
    <Field label={label} optional={optional}>
      {(id) => (
        <div className="flex items-center gap-2">
          <label
            className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line"
            style={{ background: value || "transparent" }}
          >
            {!value && <span className="absolute inset-0 grid place-items-center text-xs text-ink-mute">—</span>}
            <input
              type="color"
              className="absolute inset-0 cursor-pointer opacity-0"
              value={value || "#8B5CF6"}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
            />
          </label>
          <Input
            id={id}
            className="font-mono uppercase"
            placeholder={optional ? "Auto" : "#6D28D9"}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value.trim() || null)}
          />
        </div>
      )}
    </Field>
  );
}

function measure(file: File): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
    img.onerror = () => resolve(1);
    img.src = URL.createObjectURL(file);
  });
}

function LogoUpload({
  label,
  hint,
  url,
  dark,
  workspaceId,
  onChange,
}: {
  label: string;
  hint: string;
  url: string | null | undefined;
  dark: boolean;
  workspaceId?: string;
  onChange: (url: string | null, aspect: number | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!workspaceId) return toast.error("Save your brand first");
    if (file.size > 5 * 1024 * 1024) return toast.error("Logos must be under 5 MB");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${workspaceId}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase().storage.from(BRAND_BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (error) throw error;
      const publicUrl = supabase().storage.from(BRAND_BUCKET).getPublicUrl(path).data.publicUrl;
      onChange(publicUrl, await measure(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[13px] font-medium text-ink-soft">{label}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn(
            "grid h-16 w-36 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong p-2 transition hover:border-brand/50",
            dark ? "bg-[#0A0A12]" : "bg-[#F6F4EF]",
          )}
        >
          {busy ? (
            <Spinner />
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImagePlus className={cn("size-5", dark ? "text-white/40" : "text-black/40")} />
          )}
        </button>
        <div className="min-w-0 text-xs leading-relaxed text-ink-mute">
          {hint}
          {url && (
            <button
              type="button"
              onClick={() => onChange(null, null)}
              className="mt-1 flex items-center gap-1 text-rose-300 hover:text-rose-200"
            >
              <Trash2 className="size-3" /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function LookForm({
  value,
  onChange,
  workspaceId,
}: {
  value: Draft;
  onChange: (patch: Draft) => void;
  workspaceId?: string;
}) {
  const brand = brandFromWorkspace(value);
  const [previewIndex, setPreviewIndex] = useState(0);
  const length = value.carousel_length ?? 7;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-7">
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-ink-soft">Slide style</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(THEMES) as SlideTheme[]).map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => onChange({ slide_theme: theme })}
                className={cn(
                  "group rounded-2xl border p-2 text-left transition",
                  (value.slide_theme ?? "midnight") === theme
                    ? "border-brand/60 bg-brand/10 ring-4 ring-brand/10"
                    : "border-line hover:border-line-strong",
                )}
              >
                <div className="overflow-hidden rounded-xl">
                  <SlidePreview slide={SAMPLE_SLIDES[0]} total={length} brand={{ ...brand, theme }} />
                </div>
                <p className="mt-2.5 px-1 text-sm font-medium">{THEMES[theme].label}</p>
                <p className="px-1 pb-1 text-xs text-ink-mute">{THEMES[theme].description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Use ${c}`}
                onClick={() => onChange({ primary_color: c })}
                className={cn(
                  "size-7 rounded-full border-2 transition",
                  value.primary_color?.toUpperCase() === c ? "border-white" : "border-transparent hover:scale-110",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              label="Brand colour"
              value={value.primary_color}
              onChange={(v) => onChange({ primary_color: v ?? "#6D28D9" })}
            />
            <ColorField
              label="Highlight colour"
              optional
              value={value.accent_color}
              onChange={(v) => onChange({ accent_color: v })}
            />
          </div>
        </div>

        <Field label="Typeface">
          {() => (
            <Segmented<FontPair>
              value={value.slide_font ?? "inter"}
              onChange={(slide_font) => onChange({ slide_font })}
              options={(Object.keys(FONT_PAIRS) as FontPair[]).map((f) => ({ value: f, label: FONT_PAIRS[f].label }))}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <LogoUpload
            label="Logo"
            hint="For light slides. PNG or SVG with a transparent background works best."
            url={value.logo_url}
            dark={false}
            workspaceId={workspaceId}
            onChange={(logo_url, logo_aspect) => onChange({ logo_url, logo_aspect })}
          />
          <LogoUpload
            label="Logo on dark"
            hint="Optional white/light version used on dark slides."
            url={value.logo_inverse_url}
            dark
            workspaceId={workspaceId}
            onChange={(logo_inverse_url, logo_inverse_aspect) => onChange({ logo_inverse_url, logo_inverse_aspect })}
          />
        </div>

        <Field label={`Carousel length · ${length} slides`} hint="Includes the cover and the closing call-to-action slide.">
          {(id) => (
            <input
              id={id}
              type="range"
              min={4}
              max={10}
              value={length}
              onChange={(e) => onChange({ carousel_length: Number(e.target.value) })}
              className="w-full accent-brand"
            />
          )}
        </Field>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-[13px] font-medium text-ink-soft">Live preview</p>
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <SlidePreview
            slide={SAMPLE_SLIDES[previewIndex]}
            index={previewIndex === 2 ? length - 1 : previewIndex}
            total={length}
            brand={brand}
          />
        </div>
        <div className="mt-3 flex justify-center">
          <Segmented<string>
            value={String(previewIndex)}
            onChange={(v) => setPreviewIndex(Number(v))}
            options={[
              { value: "0", label: "Cover" },
              { value: "1", label: "Content" },
              { value: "2", label: "Closing" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
