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
};

let wasmReady: Promise<void> | null = null;
const fontCache = new Map<string, Promise<ArrayBuffer>>();

function ensureWasm() {
  wasmReady ??= initWasm(fetch(RESVG_WASM)).catch((err) => {
    wasmReady = null;
    throw err;
  });
  return wasmReady;
}

function loadFont(family: string, weight: number): Promise<ArrayBuffer> {
  const key = `${family}:${weight}`;
  let font = fontCache.get(key);
  if (!font) {
    const id = FONTSOURCE_IDS[family] ?? "inter";
    const url = `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/latin-${weight}-normal.ttf`;
    font = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Font ${key} failed to load (${r.status})`);
      return r.arrayBuffer();
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

/** Fetch a remote logo once and inline it, so Satori never has to reach the network itself. */
export async function inlineLogo(brand: SlideBrand): Promise<SlideBrand> {
  if (!brand.logo || brand.logo.url.startsWith("data:")) return brand;
  try {
    const res = await fetch(brand.logo.url);
    if (!res.ok) throw new Error(String(res.status));
    const type = res.headers.get("content-type") ?? "image/png";
    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { ...brand, logo: { ...brand.logo, url: `data:${type};base64,${btoa(binary)}` } };
  } catch (err) {
    console.warn("Logo could not be loaded, falling back to wordmark", err);
    return { ...brand, logo: null };
  }
}

export async function renderSlideSvg(slide: Slide, index: number, total: number, brand: SlideBrand) {
  const fonts = await Promise.all(
    fontsFor(brand.font).map(async ({ family, weight }) => ({
      name: family,
      data: await loadFont(family, weight),
      weight: weight as 400 | 500 | 600 | 700 | 800,
      style: "normal" as const,
    })),
  );
  // deno-lint-ignore no-explicit-any
  const tree = buildSlide(h, slide, index, total, brand) as any;
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
