// Photos for slides: stock photos (Pixabay, or Pexels with an existing key), or the brand's own uploads.
import { admin, type MediaAsset, MEDIA_BUCKET, publicUrl, type Workspace } from "./db.ts";
import { env } from "./env.ts";
import type { DraftSlide } from "./openai.ts";
import { type Slide, type SlideImage, TEMPLATES } from "./slide-templates.ts";

interface StockHit {
  /** Provider-prefixed, e.g. "pixabay-123". Also the file name in storage. */
  id: string;
  url: string;
  credit: string;
}

interface StockProvider {
  name: string;
  enabled: () => boolean;
  search: (query: string) => Promise<StockHit[] | null>;
}

const PROVIDERS: StockProvider[] = [
  {
    name: "pixabay",
    enabled: () => !!env.pixabayKey,
    async search(query) {
      const params = new URLSearchParams({
        key: env.pixabayKey,
        q: query,
        image_type: "photo",
        orientation: "vertical",
        safesearch: "true",
        min_height: "1350",
        per_page: "30",
      });
      const res = await fetch(`https://pixabay.com/api/?${params}`);
      if (!res.ok) {
        console.warn("Pixabay search failed", res.status, await res.text());
        return null;
      }
      const { hits = [] } = (await res.json()) as {
        hits?: { id: number; user: string; largeImageURL: string; fullHDURL?: string }[];
      };
      // fullHDURL (1920px) needs approved full API access; largeImageURL (1280px) is always there.
      return hits.map((h) => ({ id: `pixabay-${h.id}`, url: h.fullHDURL || h.largeImageURL, credit: `Photo by ${h.user} on Pixabay` }));
    },
  },
  {
    name: "pexels",
    enabled: () => !!env.pexelsKey,
    async search(query) {
      const params = new URLSearchParams({ query, orientation: "portrait", size: "large", per_page: "30" });
      const res = await fetch(`https://api.pexels.com/v1/search?${params}`, { headers: { Authorization: env.pexelsKey } });
      if (!res.ok) {
        console.warn("Pexels search failed", res.status, await res.text());
        return null;
      }
      const { photos = [] } = (await res.json()) as { photos?: { id: number; photographer: string; src: { original: string } }[] };
      // Pexels serves resized crops on request, so the slide gets exactly 1080x1350.
      return photos.map((p) => ({
        id: `pexels-${p.id}`,
        url: `${p.src.original}?auto=compress&cs=tinysrgb&fit=crop&w=1080&h=1350`,
        credit: `Photo by ${p.photographer} on Pexels`,
      }));
    },
  },
];

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Search results are cached for 24 hours, as Pixabay's API terms require. This also saves rate limit. */
async function searchStock(query: string, fresh = false): Promise<StockHit[]> {
  const key = query.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);
  if (!key) return [];
  for (const provider of PROVIDERS.filter((p) => p.enabled())) {
    const { data: cached } = await admin()
      .from("stock_searches")
      .select("hits, fetched_at")
      .eq("provider", provider.name)
      .eq("query", key)
      .maybeSingle();
    const cachedHits = (cached?.hits ?? []) as StockHit[];
    if (!fresh && cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
      if (cachedHits.length) return cachedHits;
      continue;
    }
    const hits = await provider.search(key);
    if (!hits) {
      // Rate-limited or down: an older result is better than nothing.
      if (cachedHits.length) return cachedHits;
      continue;
    }
    await admin().from("stock_searches").upsert({ provider: provider.name, query: key, hits, fetched_at: new Date().toISOString() });
    if (hits.length) return hits;
  }
  return [];
}

/** Copy a stock photo into our own storage. Pixabay doesn't allow hotlinking, and renders then never depend on a third party. */
async function storeStock(hit: StockHit): Promise<SlideImage | null> {
  try {
    const res = await fetch(hit.url);
    const type = (res.headers.get("content-type") ?? "").split(";")[0];
    if (!res.ok || (type !== "image/jpeg" && type !== "image/png")) return null;
    const path = `stock/${hit.id}.${type === "image/png" ? "png" : "jpg"}`;
    const { error } = await admin().storage.from(MEDIA_BUCKET).upload(path, await res.arrayBuffer(), { contentType: type, upsert: true });
    if (error) {
      console.warn("Couldn't store stock photo", hit.id, error.message);
      return null;
    }
    return { url: publicUrl(MEDIA_BUCKET, path), credit: hit.credit };
  } catch (err) {
    console.warn("Couldn't download stock photo", hit.id, err);
    return null;
  }
}

/** Stock photo ids this brand used recently, so similar topics don't keep getting the same photo. */
async function recentStockIds(w: Workspace): Promise<Set<string>> {
  const { data } = await admin()
    .from("posts")
    .select("slides")
    .eq("workspace_id", w.id)
    .order("created_at", { ascending: false })
    .limit(14);
  const ids = new Set<string>();
  for (const post of (data ?? []) as { slides: Slide[] | null }[]) {
    for (const slide of post.slides ?? []) {
      const id = slide.image?.url.match(/\/stock\/([\w-]+)\.\w+$/)?.[1];
      if (id) ids.add(id);
    }
  }
  return ids;
}

/** Find, pick and store one stock photo per slide that asked for one. */
async function stockImages(w: Workspace, queries: (string | null)[]): Promise<(SlideImage | null)[]> {
  if (!PROVIDERS.some((p) => p.enabled())) {
    console.warn("Stock photos are on, but neither PIXABAY_API_KEY nor PEXELS_API_KEY is set");
    return queries.map(() => null);
  }
  const unique = [...new Set(queries.filter((q): q is string => !!q))];
  const [recent, results] = await Promise.all([recentStockIds(w), Promise.all(unique.map((q) => searchStock(q)))]);
  const hitsFor = new Map(unique.map((q, i) => [q, results[i]]));
  const usedHere = new Set<string>();

  async function pick(query: string, hits: StockHit[], retried = false): Promise<SlideImage | null> {
    // Prefer top results this brand hasn't used recently, chosen at random among the best few for variety.
    const preferred = hits.slice(0, 12).filter((h) => !recent.has(h.id));
    const rest = hits.filter((h) => !preferred.includes(h));
    const next = () => {
      const open = preferred.filter((h) => !usedHere.has(h.id));
      const pool = open.length ? open : rest.filter((h) => !usedHere.has(h.id));
      return pool[Math.floor(Math.random() * Math.min(pool.length, 6))];
    };
    let tried = 0;
    for (let hit = next(); hit && tried < 3; hit = next()) {
      tried++;
      usedHere.add(hit.id);
      const image = await storeStock(hit);
      if (image) return image;
    }
    // Cached links can expire before the cache does: search again once.
    if (tried && !retried) {
      const again = await searchStock(query, true);
      if (again.length) return pick(query, again, true);
    }
    return null;
  }

  // Each call picks its first photo before awaiting, so slides claim photos in order; downloads run in parallel.
  return await Promise.all(queries.map((q) => (q ? pick(q, hitsFor.get(q) ?? []) : Promise.resolve(null))));
}

/** Uploaded photos, least-used first, for the model to choose from. */
export async function libraryFor(w: Workspace): Promise<MediaAsset[]> {
  if (w.visual_source !== "uploads") return [];
  const { data } = await admin()
    .from("media_assets")
    .select("*")
    .eq("workspace_id", w.id)
    .order("use_count", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(40);
  return (data ?? []) as MediaAsset[];
}

/** Attach a photo to each slide the template shows photos on. */
export async function assignVisuals(w: Workspace, drafts: DraftSlide[], assets: MediaAsset[], title: string): Promise<Slide[]> {
  const usesPhotos = TEMPLATES[w.template]?.kind === "photo" && w.visual_source !== "none";
  const strip = ({ photo_query: _q, asset_id: _a, ...slide }: DraftSlide): Slide => slide;
  if (!usesPhotos) return drafts.map(strip);

  let images: (SlideImage | null)[] = [];
  const usedAssets: MediaAsset[] = [];

  if (w.visual_source === "stock") {
    images = await stockImages(w, drafts.map((d, i) => d.photo_query?.trim() || (i === 0 ? title : null)));
  } else {
    const byId = new Map(assets.map((a) => [a.id, a]));
    let cursor = 0;
    images = drafts.map((d) => {
      let asset = d.asset_id ? byId.get(d.asset_id) : undefined;
      if (!asset && assets.length) asset = assets[cursor++ % assets.length];
      if (!asset) return null;
      usedAssets.push(asset);
      return { url: asset.url, credit: null };
    });
  }

  // Photo templates look best with a photo on every slide: reuse earlier ones for any gaps.
  const found = images.filter((x): x is SlideImage => !!x);
  images = images.map((img, i) => img ?? (found.length ? found[i % found.length] : null));

  if (usedAssets.length) {
    const now = new Date().toISOString();
    await Promise.all(
      [...new Set(usedAssets)].map((a) =>
        admin().from("media_assets").update({ use_count: a.use_count + 1, last_used_at: now }).eq("id", a.id)
      ),
    );
  }
  return drafts.map((d, i) => ({ ...strip(d), image: images[i] }));
}

/** Base64 of an uploaded photo, for image-to-video. */
export async function assetImage(assets: MediaAsset[], id: string | null): Promise<{ data: string; mimeType: string } | null> {
  const asset = assets.find((a) => a.id === id);
  if (!asset) return null;
  const res = await fetch(asset.url);
  if (!res.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { data: btoa(binary), mimeType: (res.headers.get("content-type") ?? "image/jpeg").split(";")[0] };
}
