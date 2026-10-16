"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { brandFromWorkspace, SlidePreview } from "@/components/slide-preview";
import { Field, Input, Segmented, Spinner } from "@/components/ui";
import { SAMPLE_SLIDES, samplePhoto, type Slide, TEMPLATE_IDS, TEMPLATES } from "@/lib/slide-templates";
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
            <ImagePlus className={cn("size-5", dark ? "text-tint/40" : "text-black/40")} />
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

type Filter = "recommended" | "text" | "photo";

export function LookForm({
  value,
  onChange,
  workspaceId,
  photos = [],
}: {
  value: Draft;
  onChange: (patch: Draft) => void;
  workspaceId?: string;
  /** The brand's own photos, used in previews of photo templates. */
  photos?: string[];
}) {
  const brand = brandFromWorkspace(value);
  const [previewIndex, setPreviewIndex] = useState(0);
  const usesPhotos = (value.visual_source ?? "none") !== "none";
  const [filter, setFilter] = useState<Filter>("recommended");
  const length = value.carousel_length ?? 7;
  const current = value.template ?? "midnight";

  const photoFor = (i: number) => photos[i % Math.max(photos.length, 1)] ?? samplePhoto(brand.primary, i);
  const withPhoto = (slide: Slide, i: number): Slide => ({ ...slide, image: { url: photoFor(i) } });
  const ids = TEMPLATE_IDS.filter((id) =>
    filter === "text" ? TEMPLATES[id].kind === "text" : filter === "photo" ? TEMPLATES[id].kind === "photo" : true
  ).sort((a, b) =>
    filter === "recommended" ? Number(TEMPLATES[b].kind === (usesPhotos ? "photo" : "text")) - Number(TEMPLATES[a].kind === (usesPhotos ? "photo" : "text")) : 0
  );
  const isPhotoTemplate = TEMPLATES[current]?.kind === "photo";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-7">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-ink-soft">Template</p>
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "recommended", label: "Recommended" },
                { value: "text", label: "Text-first" },
                { value: "photo", label: "With photos" },
              ]}
            />
          </div>
          {isPhotoTemplate && !usesPhotos && (
            <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-200">
              Photo templates need photos. Choose &ldquo;My own photos&rdquo; or &ldquo;Stock photos&rdquo; in your business settings, or posts will use placeholder art.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {ids.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ template: id })}
                className={cn(
                  "group rounded-2xl border p-1.5 text-left transition",
                  current === id ? "border-brand/60 bg-brand/10 ring-4 ring-brand/10" : "border-line hover:border-line-strong",
                )}
              >
                <div className="overflow-hidden rounded-xl">
                  <SlidePreview slide={withPhoto(SAMPLE_SLIDES[0], 0)} total={length} brand={{ ...brand, template: id }} />
                </div>
                <p className="mt-2 px-1 text-[13px] font-medium">{TEMPLATES[id].name}</p>
                <p className="px-1 pb-1 text-[11px] leading-snug text-ink-mute">{TEMPLATES[id].description}</p>
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
                  value.primary_color?.toUpperCase() === c ? "border-ink" : "border-transparent hover:scale-110",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField label="Brand colour" value={value.primary_color} onChange={(v) => onChange({ primary_color: v ?? "#6D28D9" })} />
            <ColorField label="Highlight colour" optional value={value.accent_color} onChange={(v) => onChange({ accent_color: v })} />
          </div>
        </div>

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
            hint="Optional white or light version for dark slides and photos."
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
        <p className="mb-2 text-[13px] font-medium text-ink-soft">Live preview · {TEMPLATES[current]?.name}</p>
        <div className="overflow-hidden rounded-2xl border border-line shadow-2xl">
          <SlidePreview
            slide={withPhoto(SAMPLE_SLIDES[previewIndex], previewIndex)}
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
