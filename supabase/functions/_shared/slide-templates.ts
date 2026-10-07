// Slide templates shared by the Satori renderer (render-slide edge function) and the
// React live preview in the web app. Both renderers receive the same element tree, so
// stick to styles they agree on: flexbox, absolute positioning, gradients, inline SVG.
//
// Keep this file dependency-free. The web app keeps a copy at web/lib/slide-templates.ts,
// refreshed by `npm run sync:shared` inside web/.

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

export type SlideKind = "cover" | "content" | "cta" | "single";
export type SlideTheme = "midnight" | "paper" | "bold";
export type FontPair = "inter" | "jakarta" | "editorial";

export interface Slide {
  kind: SlideKind;
  eyebrow: string | null;
  heading: string;
  body: string | null;
  bullets: string[] | null;
}

export interface SlideLogo {
  url: string;
  /** width / height */
  aspect: number;
}

export interface SlideBrand {
  name: string;
  handle: string | null;
  primary: string;
  accent: string | null;
  theme: SlideTheme;
  font: FontPair;
  /** Already resolved for the theme (see `isDarkTheme`). */
  logo: SlideLogo | null;
  cta: string | null;
}

export type H = (type: string, props: Record<string, unknown> | null, ...children: unknown[]) => unknown;

export interface TemplateOptions {
  /** Map a font family name to what the renderer understands (e.g. a CSS variable). */
  fontFamily?: (family: string) => string;
}

export const THEMES: Record<SlideTheme, { label: string; description: string }> = {
  midnight: { label: "Midnight", description: "Deep dark canvas with a glow of your brand colour" },
  paper: { label: "Paper", description: "Warm off-white, editorial and calm" },
  bold: { label: "Bold", description: "Your brand colour, full bleed" },
};

export const FONT_PAIRS: Record<
  FontPair,
  { label: string; heading: string; body: string; headingWeight: number; headingTracking: number }
> = {
  inter: { label: "Inter", heading: "Inter", body: "Inter", headingWeight: 800, headingTracking: -0.035 },
  jakarta: {
    label: "Plus Jakarta Sans",
    heading: "Plus Jakarta Sans",
    body: "Plus Jakarta Sans",
    headingWeight: 800,
    headingTracking: -0.03,
  },
  editorial: {
    label: "Editorial serif",
    heading: "DM Serif Display",
    body: "Inter",
    headingWeight: 400,
    headingTracking: -0.01,
  },
};

// ---------------------------------------------------------------------------
// Colour helpers

function normalizeHex(input: string | null | undefined, fallback: string): string {
  if (!input) return fallback;
  let hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : fallback;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mix(hex: string, other: string, t: number): string {
  const a = rgb(hex);
  const b = rgb(other);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isDarkTheme(brand: Pick<SlideBrand, "theme" | "primary">): boolean {
  if (brand.theme === "midnight") return true;
  if (brand.theme === "paper") return false;
  return luminance(normalizeHex(brand.primary, "#6D28D9")) < 0.45;
}

interface Palette {
  bg: string;
  /** [colour, opacity] — drawn as SVG gradients, which rasterise far faster than CSS ones. */
  glow: Tint;
  glow2: Tint;
  text: string;
  muted: string;
  accent: string;
  highlightText: string;
  highlightBg: string | null;
  surface: string;
  border: string;
  ctaBg: string;
  ctaText: string;
  grid: Tint;
}

type Tint = [string, number];

function palette(brand: SlideBrand): Palette {
  const primary = normalizeHex(brand.primary, "#6D28D9");
  const accent = normalizeHex(brand.accent, "");
  if (brand.theme === "paper") {
    const ink = luminance(primary) > 0.35 ? mix(primary, "#000000", 0.45) : primary;
    return {
      bg: "#F6F4EF",
      glow: [primary, 0.2],
      glow2: [accent || primary, 0.12],
      text: "#16141C",
      muted: "#5E5A68",
      accent: ink,
      highlightText: ink,
      highlightBg: null,
      surface: "#FFFFFF",
      border: "rgba(22, 20, 28, 0.10)",
      ctaBg: ink,
      ctaText: "#FFFFFF",
      grid: ["#16141C", 0.05],
    };
  }
  if (brand.theme === "bold") {
    const dark = luminance(primary) < 0.45;
    const text = dark ? "#FFFFFF" : "#121016";
    const marker = accent && accent !== primary ? accent : dark ? "#FDE68A" : "#121016";
    return {
      bg: primary,
      glow: [dark ? "#FFFFFF" : "#000000", 0.18],
      glow2: [dark ? "#000000" : "#FFFFFF", 0.22],
      text,
      muted: dark ? "rgba(255, 255, 255, 0.78)" : "rgba(18, 16, 22, 0.72)",
      accent: marker,
      highlightText: luminance(marker) > 0.45 ? "#121016" : "#FFFFFF",
      highlightBg: marker,
      surface: dark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)",
      border: dark ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.14)",
      ctaBg: dark ? "#FFFFFF" : "#121016",
      ctaText: dark ? primary : "#FFFFFF",
      grid: dark ? ["#FFFFFF", 0.07] : ["#000000", 0.05],
    };
  }
  const glowAccent = luminance(primary) < 0.2 ? mix(primary, "#FFFFFF", 0.45) : mix(primary, "#FFFFFF", 0.3);
  return {
    bg: "#0A0A12",
    glow: [primary, 0.6],
    glow2: [accent || mix(primary, "#3B82F6", 0.5), 0.3],
    text: "#F6F5FA",
    muted: "#A3A1B8",
    accent: accent ? mix(accent, "#FFFFFF", 0.15) : glowAccent,
    highlightText: accent ? mix(accent, "#FFFFFF", 0.15) : glowAccent,
    highlightBg: null,
    surface: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.12)",
    ctaBg: primary,
    ctaText: "#FFFFFF",
    grid: ["#FFFFFF", 0.04],
  };
}

// ---------------------------------------------------------------------------
// Text helpers

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu;

/** Satori only has the Latin font subsets loaded, so drop emoji and normalise whitespace. */
export function cleanText(text: string | null | undefined): string {
  return (text ?? "").replace(EMOJI, "").replace(/[ \t]+/g, " ").trim();
}

/** Remove the ==highlight== markers the model uses to emphasise words. */
export function stripMarkers(text: string): string {
  return text.replace(/==/g, "");
}

interface Word {
  text: string;
  hl: boolean;
}

/** Split a heading into wrap-able words. With `keepPhrases`, each ==highlight== stays one unit (one marker box). */
function words(text: string, keepPhrases = false): Word[] {
  const out: Word[] = [];
  cleanText(text)
    .split("==")
    .forEach((segment, i) => {
      const hl = i % 2 === 1;
      if (hl && keepPhrases && segment.trim()) out.push({ text: segment.trim(), hl });
      else for (const w of segment.split(/\s+/)) if (w) out.push({ text: w, hl });
    });
  return out;
}

function sizeFor(length: number, steps: [number, number][], min: number): number {
  for (const [max, size] of steps) if (length <= max) return size;
  return min;
}

// ---------------------------------------------------------------------------
// Building blocks

const PAD_X = 92;
const PAD_Y = 84;

function arrowIcon(h: H, color: string, size: number) {
  return h(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24", fill: "none" },
    h("path", {
      d: "M5 12h14M13 6l6 6-6 6",
      stroke: color,
      strokeWidth: 2.4,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
  );
}

function checkIcon(h: H, color: string, size: number) {
  return h(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24", fill: "none" },
    h("path", {
      d: "M5 12.5l4.2 4.2L19 7",
      stroke: color,
      strokeWidth: 3,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
  );
}

function background(h: H, p: Palette, kind: SlideKind) {
  // One inline SVG instead of CSS gradients: Satori turns CSS gradients into masked
  // <pattern>s that take resvg ~1s per slide, while plain SVG gradients take ~10ms.
  const [cx, cy] = kind === "cta" ? [540, 1420] : kind === "content" ? [1080, 0] : [990, 60];
  const id = `g-${p.bg}-${p.glow[0]}-${p.glow2[0]}-${kind}`.replace(/#/g, "");
  const cell = 90;
  let grid = "";
  for (let x = cell; x < SLIDE_WIDTH; x += cell) grid += `M${x} 0V${SLIDE_HEIGHT}`;
  for (let y = cell; y < SLIDE_HEIGHT; y += cell) grid += `M0 ${y}H${SLIDE_WIDTH}`;
  const glow = (gid: string, [color, opacity]: Tint, x: number, y: number, r: number) =>
    h(
      "radialGradient",
      { id: gid, cx: x, cy: y, r, gradientUnits: "userSpaceOnUse" },
      h("stop", { offset: "0", stopColor: color, stopOpacity: opacity }),
      h("stop", { offset: "0.55", stopColor: color, stopOpacity: opacity * 0.25 }),
      h("stop", { offset: "1", stopColor: color, stopOpacity: 0 }),
    );
  return h(
    "svg",
    {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      viewBox: `0 0 ${SLIDE_WIDTH} ${SLIDE_HEIGHT}`,
      style: { position: "absolute", top: 0, left: 0 },
    },
    h(
      "defs",
      null,
      glow(`${id}-a`, p.glow, cx, cy, 820),
      glow(`${id}-b`, p.glow2, 0, SLIDE_HEIGHT, 680),
    ),
    h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: p.bg }),
    h("path", { d: grid, stroke: p.grid[0], strokeOpacity: p.grid[1], strokeWidth: 2 }),
    h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: `url(#${id}-a)` }),
    h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: `url(#${id}-b)` }),
  );
}

function brandMark(h: H, brand: SlideBrand, p: Palette, f: (s: string) => string, height: number) {
  if (brand.logo) {
    return h("img", {
      src: brand.logo.url,
      width: Math.round(height * brand.logo.aspect),
      height,
      style: { objectFit: "contain" },
    });
  }
  const initial = cleanText(brand.name).charAt(0).toUpperCase() || "•";
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 16 } },
    h(
      "div",
      {
        style: {
          width: height,
          height,
          borderRadius: height * 0.3,
          backgroundColor: p.ctaBg,
          color: p.ctaText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: f(FONT_PAIRS.inter.heading),
          fontWeight: 800,
          fontSize: height * 0.55,
        },
      },
      initial,
    ),
    h(
      "div",
      {
        style: {
          fontFamily: f(FONT_PAIRS.inter.heading),
          fontWeight: 700,
          fontSize: height * 0.6,
          color: p.text,
          letterSpacing: -0.5,
        },
      },
      cleanText(brand.name),
    ),
  );
}

function header(h: H, brand: SlideBrand, p: Palette, f: (s: string) => string, index: number, total: number) {
  const counter = total > 1
    ? h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          padding: "10px 20px",
          borderRadius: 999,
          border: `2px solid ${p.border}`,
          backgroundColor: p.surface,
          color: p.muted,
          fontFamily: f("Inter"),
          fontWeight: 600,
          fontSize: 24,
          letterSpacing: 1,
        },
      },
      `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    )
    : null;
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 } },
    brandMark(h, brand, p, f, 52),
    counter,
  );
}

function footer(h: H, brand: SlideBrand, p: Palette, f: (s: string) => string, index: number, total: number) {
  const last = index === total - 1;
  const handle = cleanText(brand.handle);
  const right = total > 1 && !last
    ? h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: p.text,
          fontFamily: f("Inter"),
          fontWeight: 600,
          fontSize: 26,
        },
      },
      "Swipe",
      h(
        "div",
        {
          style: {
            width: 56,
            height: 56,
            borderRadius: 999,
            backgroundColor: p.ctaBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        arrowIcon(h, p.ctaText, 30),
      ),
    )
    : h(
      "div",
      { style: { display: "flex", color: p.muted, fontFamily: f("Inter"), fontWeight: 600, fontSize: 24 } },
      total > 1 ? "Save for later" : "",
    );
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        borderTop: `2px solid ${p.border}`,
        paddingTop: 28,
        boxSizing: "content-box",
      },
    },
    h(
      "div",
      { style: { display: "flex", color: p.muted, fontFamily: f("Inter"), fontWeight: 600, fontSize: 26 } },
      handle ? (handle.startsWith("@") ? handle : `@${handle}`) : cleanText(brand.name),
    ),
    right,
  );
}

function eyebrow(h: H, text: string | null, p: Palette, f: (s: string) => string) {
  const t = cleanText(text);
  if (!t) return null;
  return h(
    "div",
    { style: { display: "flex" } },
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 24px",
          borderRadius: 999,
          backgroundColor: p.surface,
          border: `2px solid ${p.border}`,
          color: p.accent,
          fontFamily: f("Inter"),
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 3,
          textTransform: "uppercase",
        },
      },
      h("div", { style: { width: 12, height: 12, borderRadius: 999, backgroundColor: p.accent } }),
      t,
    ),
  );
}

function heading(
  h: H,
  text: string,
  size: number,
  brand: SlideBrand,
  p: Palette,
  f: (s: string) => string,
) {
  const pair = FONT_PAIRS[brand.font] ?? FONT_PAIRS.inter;
  const gap = Math.round(size * 0.24);
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexWrap: "wrap",
        columnGap: gap,
        rowGap: Math.round(size * 0.04),
        fontFamily: f(pair.heading),
        fontWeight: pair.headingWeight,
        fontSize: size,
        lineHeight: 1.06,
        letterSpacing: size * pair.headingTracking,
        color: p.text,
      },
    },
    ...words(text, !!p.highlightBg).map((w, i) =>
      h(
        "span",
        {
          key: i,
          style: w.hl
            ? {
              display: "flex",
              color: p.highlightText,
              ...(p.highlightBg
                ? {
                  backgroundColor: p.highlightBg,
                  padding: `0 ${Math.round(size * 0.12)}px`,
                  borderRadius: Math.round(size * 0.14),
                }
                : {}),
            }
            : { display: "flex" },
        },
        w.text,
      )
    ),
  );
}

function bodyText(h: H, text: string | null, size: number, p: Palette, f: (s: string) => string, color?: string) {
  const t = stripMarkers(cleanText(text));
  if (!t) return null;
  return h(
    "div",
    {
      style: {
        display: "flex",
        fontFamily: f(FONT_PAIRS.inter.body),
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1.42,
        color: color ?? p.muted,
        whiteSpace: "pre-wrap",
      },
    },
    t,
  );
}

function bulletList(h: H, bullets: string[] | null, size: number, p: Palette, f: (s: string) => string) {
  const items = (bullets ?? []).map((b) => stripMarkers(cleanText(b))).filter(Boolean).slice(0, 5);
  if (!items.length) return null;
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: Math.round(size * 0.62) } },
    ...items.map((item, i) =>
      h(
        "div",
        { key: i, style: { display: "flex", alignItems: "flex-start", gap: 24 } },
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: size * 1.25,
              height: size * 1.25,
              minWidth: size * 1.25,
              borderRadius: size * 0.36,
              backgroundColor: p.surface,
              border: `2px solid ${p.border}`,
              marginTop: size * 0.04,
            },
          },
          checkIcon(h, p.accent, Math.round(size * 0.78)),
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              flex: 1,
              fontFamily: f(FONT_PAIRS.inter.body),
              fontWeight: 500,
              fontSize: size,
              lineHeight: 1.36,
              color: p.text,
            },
          },
          item,
        ),
      )
    ),
  );
}

function frame(h: H, p: Palette, kind: SlideKind, ...children: unknown[]) {
  return h(
    "div",
    {
      style: {
        position: "relative",
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: p.bg,
      },
    },
    background(h, p, kind),
    h(
      "div",
      {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          display: "flex",
          flexDirection: "column",
          padding: `${PAD_Y}px ${PAD_X}px`,
        },
      },
      ...children,
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide layouts

function coverSlide(h: H, s: Slide, i: number, n: number, brand: SlideBrand, p: Palette, f: (s: string) => string) {
  const len = stripMarkers(cleanText(s.heading)).length;
  const size = sizeFor(len, [[24, 128], [40, 112], [60, 98], [80, 86]], 74);
  return frame(
    h,
    p,
    "cover",
    header(h, brand, p, f, i, n),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, gap: 44 } },
      eyebrow(h, s.eyebrow, p, f),
      heading(h, s.heading, size, brand, p, f),
      bodyText(h, s.body, 38, p, f),
    ),
    footer(h, brand, p, f, i, n),
  );
}

function contentSlide(h: H, s: Slide, i: number, n: number, brand: SlideBrand, p: Palette, f: (s: string) => string) {
  const pair = FONT_PAIRS[brand.font] ?? FONT_PAIRS.inter;
  const len = stripMarkers(cleanText(s.heading)).length;
  const bulletChars = (s.bullets ?? []).join(" ").length;
  const bodyChars = cleanText(s.body).length;
  const dense = bulletChars + bodyChars > 260;
  const size = sizeFor(len, [[28, 80], [50, 70], [75, 62]], 54) - (dense ? 6 : 0);
  return frame(
    h,
    p,
    "content",
    header(h, brand, p, f, i, n),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, gap: 40 } },
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontFamily: f(pair.heading),
            fontWeight: pair.headingWeight,
            fontSize: 44,
            color: p.accent,
          },
        },
        cleanText(s.eyebrow) || String(i).padStart(2, "0"),
        h("div", { style: { display: "flex", width: 120, height: 4, borderRadius: 4, backgroundColor: p.accent } }),
      ),
      heading(h, s.heading, size, brand, p, f),
      bodyText(h, s.body, sizeFor(bodyChars, [[120, 38], [200, 35]], 32), p, f),
      bulletList(h, s.bullets, sizeFor(bulletChars, [[120, 38], [220, 35], [320, 32]], 30), p, f),
    ),
    footer(h, brand, p, f, i, n),
  );
}

function ctaSlide(h: H, s: Slide, i: number, n: number, brand: SlideBrand, p: Palette, f: (s: string) => string) {
  const len = stripMarkers(cleanText(s.heading)).length;
  const size = sizeFor(len, [[30, 100], [55, 86], [80, 74]], 66);
  const cta = cleanText(brand.cta);
  return frame(
    h,
    p,
    "cta",
    header(h, brand, p, f, i, n),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, gap: 44 } },
      eyebrow(h, s.eyebrow, p, f),
      heading(h, s.heading, size, brand, p, f),
      bodyText(h, s.body, 36, p, f),
      cta
        ? h(
          "div",
          { style: { display: "flex", marginTop: 12 } },
          h(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 22,
                width: SLIDE_WIDTH - PAD_X * 2,
                padding: "32px 40px",
                borderRadius: 28,
                backgroundColor: p.ctaBg,
                color: p.ctaText,
                fontFamily: f("Inter"),
                fontWeight: 700,
                fontSize: 34,
                lineHeight: 1.3,
              },
            },
            h("div", { style: { display: "flex", flex: 1 } }, cta),
            arrowIcon(h, p.ctaText, 40),
          ),
        )
        : null,
    ),
    footer(h, brand, p, f, i, n),
  );
}

function singleSlide(h: H, s: Slide, brand: SlideBrand, p: Palette, f: (s: string) => string) {
  const len = stripMarkers(cleanText(s.heading)).length;
  const size = sizeFor(len, [[30, 112], [55, 96], [80, 82]], 70);
  const bulletChars = (s.bullets ?? []).join(" ").length;
  return frame(
    h,
    p,
    "single",
    header(h, brand, p, f, 0, 1),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, gap: 44 } },
      eyebrow(h, s.eyebrow, p, f),
      heading(h, s.heading, size, brand, p, f),
      bodyText(h, s.body, 36, p, f),
      bulletList(h, s.bullets, sizeFor(bulletChars, [[140, 36], [240, 33]], 30), p, f),
    ),
    footer(h, brand, p, f, 0, 1),
  );
}

/** Build the element tree for one 1080×1350 slide. */
export function buildSlide(
  h: H,
  slide: Slide,
  index: number,
  total: number,
  brand: SlideBrand,
  options: TemplateOptions = {},
) {
  const p = palette(brand);
  const f = options.fontFamily ?? ((s: string) => s);
  if (total === 1 || slide.kind === "single") return singleSlide(h, slide, brand, p, f);
  if (slide.kind === "cover") return coverSlide(h, slide, index, total, brand, p, f);
  if (slide.kind === "cta") return ctaSlide(h, slide, index, total, brand, p, f);
  return contentSlide(h, slide, index, total, brand, p, f);
}

/** Fonts (family + weight) a brand's slides need, for renderers that load fonts explicitly. */
export function fontsFor(font: FontPair): { family: string; weight: number }[] {
  const pair = FONT_PAIRS[font] ?? FONT_PAIRS.inter;
  const list = [
    { family: "Inter", weight: 500 },
    { family: "Inter", weight: 600 },
    { family: "Inter", weight: 700 },
    { family: "Inter", weight: 800 },
    { family: pair.heading, weight: pair.headingWeight },
    { family: pair.body, weight: 500 },
  ];
  const seen = new Set<string>();
  return list.filter((x) => {
    const k = `${x.family}:${x.weight}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const SAMPLE_SLIDES: Slide[] = [
  {
    kind: "cover",
    eyebrow: "Resume tips",
    heading: "5 resume mistakes that get you ==auto-rejected==",
    body: "Recruiters spend about 7 seconds on a first pass. Make every one count.",
    bullets: null,
  },
  {
    kind: "content",
    eyebrow: "01",
    heading: "Listing duties instead of ==impact==",
    body: null,
    bullets: [
      "Swap “Responsible for” with a strong verb",
      "Add a number: %, £, time saved, users",
      "Show the result, not the task",
    ],
  },
  {
    kind: "cta",
    eyebrow: "Your move",
    heading: "Save this and fix your resume ==tonight==",
    body: "Follow for a new job-search tip every day.",
    bullets: null,
  },
];
