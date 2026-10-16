// Slide rasterisation: Satori (layout → SVG) → resvg (SVG → pixels) → JPEG.
// JPEG keeps the email light and is accepted everywhere you'd post a slide.
import satori from "npm:satori@0.33.5";
import { initWasm, Resvg } from "npm:@resvg/resvg-wasm@2.6.2";
import jpeg from "npm:jpeg-js@0.4.4";
import {
  buildSlide,
  fontsFor,
  type H,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type Slide,
  type SlideBrand,
} from "./slide-templates.ts";

const RESVG_WASM = "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

const FONTSOURCE_IDS: Record<string, string> = {
  "Inter": "inter",
  "Plus Jakarta Sans": "plus-jakarta-sans",
  "DM Serif Display": "dm-serif-display",
  "Space Grotesk": "space-grotesk",
  "Space Mono": "space-mono",
  "Sora": "sora",
  "Outfit": "outfit",
  "Playfair Display": "playfair-display",
  "Fraunces": "fraunces",
  "Archivo Black": "archivo-black",
  "Bricolage Grotesque": "bricolage-grotesque",
  "Manrope": "manrope",
};

// The Latin Extended subset (accented letters, the rupee sign) is registered as "<Family> Ext" and
// listed as a fallback in every font-family. Satori only falls back across differently named fonts.
const SUBSETS = ["latin", "latin-ext"] as const;
const fallbackFamily = (family: string) => `${family}, ${family} Ext`;

let wasmReady: Promise<void> | null = null;
const fontCache = new Map<string, Promise<ArrayBuffer | null>>();

function ensureWasm() {
  wasmReady ??= initWasm(fetch(RESVG_WASM)).catch((err) => {
    wasmReady = null;
    throw err;
  });
  return wasmReady;
}

function loadFont(family: string, weight: number, subset: (typeof SUBSETS)[number]): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}:${subset}`;
  let font = fontCache.get(key);
  if (!font) {
    const id = FONTSOURCE_IDS[family] ?? "inter";
    const url = `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/${subset}-${weight}-normal.ttf`;
    font = fetch(url).then((r) => {
      if (r.ok) return r.arrayBuffer();
      if (subset === "latin") throw new Error(`Font ${key} failed to load (${r.status})`);
      return null; // an optional subset that a family doesn't ship
    });
    font.catch(() => fontCache.delete(key));
    fontCache.set(key, font);
  }
  return font;
}

// Satori accepts plain `{ type, props }` objects in place of React elements.
const h: H = (type, props, ...children) => {
  const flat = children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false && c !== "");
  const { key: _key, ...rest } = props ?? {};
  return { type, props: { ...rest, children: flat.length === 0 ? undefined : flat.length === 1 ? flat[0] : flat } };
};

async function toDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image ${url} failed to load (${res.status})`);
  const type = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0];
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${type};base64,${btoa(binary)}`;
}

/** Fetch remote images once and inline them, so Satori never has to reach the network itself. */
export async function inlineAssets(slide: Slide, brand: SlideBrand): Promise<{ slide: Slide; brand: SlideBrand }> {
  const [logo, image] = await Promise.all([
    brand.logo
      ? toDataUrl(brand.logo.url).catch((err) => {
        console.warn("Logo could not be loaded, falling back to wordmark", err);
        return null;
      })
      : null,
    slide.image?.url
      ? toDataUrl(slide.image.url).catch((err) => {
        console.warn("Slide image could not be loaded, using the template placeholder", err);
        return null;
      })
      : null,
  ]);
  return {
    brand: { ...brand, logo: brand.logo && logo ? { ...brand.logo, url: logo } : null },
    slide: { ...slide, image: slide.image && image ? { ...slide.image, url: image } : null },
  };
}

export async function renderSlideSvg(slide: Slide, index: number, total: number, brand: SlideBrand) {
  const loaded = await Promise.all(
    fontsFor(brand.template).flatMap(({ family, weight }) =>
      SUBSETS.map(async (subset) => {
        const data = await loadFont(family, weight, subset);
        const name = subset === "latin" ? family : `${family} Ext`;
        return data ? { name, data, weight: weight as 400 | 500 | 600 | 700 | 800, style: "normal" as const } : null;
      })
    ),
  );
  const fonts = loaded.filter((f): f is NonNullable<typeof f> => f !== null);
  // deno-lint-ignore no-explicit-any
  const tree = buildSlide(h, slide, index, total, brand, { fontFamily: fallbackFamily }) as any;
  return await satori(tree, { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fonts });
}

export async function renderSlideJpeg(
  slide: Slide,
  index: number,
  total: number,
  brand: SlideBrand,
  quality = 90,
): Promise<Uint8Array> {
  const [svg] = await Promise.all([renderSlideSvg(slide, index, total, brand), ensureWasm()]);
  const resvg = new Resvg(svg, { fitTo: { mode: "original" }, background: "#ffffff" });
  const image = resvg.render();
  try {
    const encoded = jpeg.encode({ data: image.pixels, width: image.width, height: image.height }, quality);
    return new Uint8Array(encoded.data);
  } finally {
    image.free();
    resvg.free();
  }
}
