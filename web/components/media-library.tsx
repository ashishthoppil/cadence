"use client";

import { ImagePlus, Loader2, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BRAND_BUCKET, invoke, supabase } from "@/lib/supabase/client";
import type { MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_EDGE = 1600;

/** Downscale and re-encode as JPEG in the browser so uploads stay small and render fast. */
async function toJpeg(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`${file.name} isn't an image we can read`));
      el.src = url;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process the image"))), "image/jpeg", 0.86)
    );
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function useMediaLibrary(workspaceId: string | undefined) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    supabase()
      .from("media_assets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setAssets((data ?? []) as MediaAsset[]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const upload = useCallback(
    async (files: File[]) => {
      if (!workspaceId) return;
      for (const file of files) {
        try {
          const { blob, width, height } = await toJpeg(file);
          const path = `${workspaceId}/library/${crypto.randomUUID()}.jpg`;
          const { error } = await supabase().storage.from(BRAND_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
          if (error) throw error;
          const url = supabase().storage.from(BRAND_BUCKET).getPublicUrl(path).data.publicUrl;
          const { data, error: insertError } = await supabase()
            .from("media_assets")
            .insert({ workspace_id: workspaceId, path, url, width, height })
            .select("*")
            .single();
          if (insertError) throw insertError;
          setAssets((list) => [data as MediaAsset, ...list]);
          // Describe it in the background so posts can match photos to topics.
          invoke<{ description: string }>("media", { asset_id: data.id })
            .then(({ description }) =>
              setAssets((list) => list.map((a) => (a.id === data.id ? { ...a, description } : a)))
            )
            .catch(() => {});
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Couldn't upload ${file.name}`);
        }
      }
    },
    [workspaceId],
  );

  const remove = useCallback(async (asset: MediaAsset) => {
    await supabase().storage.from(BRAND_BUCKET).remove([asset.path]);
    const { error } = await supabase().from("media_assets").delete().eq("id", asset.id);
    if (error) return toast.error(error.message);
    setAssets((list) => list.filter((a) => a.id !== asset.id));
  }, []);

  const describe = useCallback(async (asset: MediaAsset, description: string) => {
    setAssets((list) => list.map((a) => (a.id === asset.id ? { ...a, description } : a)));
    const { error } = await supabase().from("media_assets").update({ description }).eq("id", asset.id);
    if (error) toast.error(error.message);
  }, []);

  return { assets, loading, upload, remove, describe };
}

type Library = ReturnType<typeof useMediaLibrary>;

/** Pass `library` to share one photo list with the parent (e.g. so a live preview sees new uploads). */
export function MediaLibrary({ workspaceId, compact, library }: { workspaceId?: string; compact?: boolean; library?: Library }) {
  const own = useMediaLibrary(library ? undefined : workspaceId);
  const { assets, loading, upload, remove, describe } = library ?? own;
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handle(files: FileList | null) {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setBusy(true);
    await upload(list);
    setBusy(false);
    toast.success(list.length === 1 ? "Photo added" : `${list.length} photos added`);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 text-center transition",
          compact ? "py-8" : "py-12",
          dragging ? "border-brand bg-brand/10" : "border-line-strong hover:border-brand/50 hover:bg-tint/[0.02]",
        )}
      >
        {busy ? <Loader2 className="size-6 animate-spin text-brand-soft" /> : <UploadCloud className="size-6 text-brand-soft" />}
        <span className="text-sm font-medium">{busy ? "Uploading…" : "Drop photos here or click to upload"}</span>
        <span className="text-xs text-ink-mute">
          Product shots, your space, your team. JPEG or PNG. Clear, well-lit photos without text work best.
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton aspect-square rounded-xl" />)}
        </div>
      ) : assets.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="group overflow-hidden rounded-xl border border-line bg-panel">
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.description ?? ""} className="size-full object-cover" loading="lazy" />
                <button
                  type="button"
                  onClick={() => remove(a)}
                  className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg bg-black/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 focus:opacity-100"
                  aria-label="Delete photo"
                >
                  <Trash2 className="size-3.5" />
                </button>
                {a.use_count > 0 && (
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    Used {a.use_count}×
                  </span>
                )}
              </div>
              <textarea
                key={a.description ?? ""}
                defaultValue={a.description ?? ""}
                placeholder="Describing…"
                onBlur={(e) => e.target.value !== (a.description ?? "") && describe(a, e.target.value)}
                rows={2}
                className="w-full resize-none bg-transparent px-2.5 py-2 text-xs leading-snug text-ink-soft outline-none placeholder:text-ink-mute"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-ink-mute">
          <ImagePlus className="size-4" /> No photos yet. Add at least 3 so posts can vary.
        </p>
      )}
      {!!assets.length && (
        <p className="flex items-center gap-1.5 text-xs text-ink-mute">
          <Sparkles className="size-3.5" /> Each photo gets a short description so the right one is picked for each post. Edit it if it&apos;s off.
        </p>
      )}
    </div>
  );
}
