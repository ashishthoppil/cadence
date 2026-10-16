// Slide templates shared by the Satori renderer (render-slide edge function) and the
// React live preview in the web app. Both renderers receive the same element tree, so
// stick to styles they agree on: flexbox, absolute positioning, inline SVG, <img>.
//
// Keep this file dependency-free. The web app keeps a copy at web/lib/slide-templates.ts,
// refreshed by `npm run sync:shared` inside web/.

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

export type SlideKind = "cover" | "content" | "cta" | "single";

export interface SlideImage {
  url: string;
  /** Shown in the app, never on the slide. */
  credit?: string | null;
}

export interface Slide {
  kind: SlideKind;
  eyebrow: string | null;
  heading: string;
  body: string | null;
  bullets: string[] | null;
  image?: SlideImage | null;
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
  template: TemplateId;
  /** Already resolved for the template (see `logoOnDark`). */
  logo: SlideLogo | null;
  cta: string | null;
}

export type H = (type: string, props: Record<string, unknown> | null, ...children: unknown[]) => unknown;

export interface TemplateOptions {
  /** Map a font family name to what the renderer understands (e.g. a CSS variable). */
  fontFamily?: (family: string) => string;
}

// ---------------------------------------------------------------------------
// Template catalogue

export const TEMPLATE_IDS = [
  "midnight",
  "paper",
  "bold",
  "mono",
  "editorial",
  "aurora",
  "notebook",
  "terminal",
  "pastel",
  "framed",
  "split",
  "blueprint",
  "pop",
  "spotlight",
  "photo-full",
  "photo-top",
  "photo-card",
  "photo-polaroid",
  "photo-tint",
  "photo-minimal",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  /** Photo templates are designed around an image on each slide. */
  kind: "text" | "photo";
}

export const TEMPLATES: Record<TemplateId, TemplateInfo> = {
  midnight: { id: "midnight", name: "Midnight", description: "Dark canvas with a glow of your brand colour", kind: "text" },
  paper: { id: "paper", name: "Paper", description: "Warm off-white, calm and clean", kind: "text" },
  bold: { id: "bold", name: "Bold", description: "Your brand colour, full bleed", kind: "text" },
  mono: { id: "mono", name: "Mono", description: "Black and white with a single accent", kind: "text" },
  editorial: { id: "editorial", name: "Editorial", description: "Magazine-style serif on cream", kind: "text" },
  aurora: { id: "aurora", name: "Aurora", description: "Soft colour gradients on a dark base", kind: "text" },
  notebook: { id: "notebook", name: "Notebook", description: "Ruled paper with a highlighter", kind: "text" },
  terminal: { id: "terminal", name: "Terminal", description: "Code-editor look for tech brands", kind: "text" },
  pastel: { id: "pastel", name: "Pastel", description: "Light brand tint with rounded cards", kind: "text" },
  framed: { id: "framed", name: "Framed", description: "Bold type inside a brand-colour frame", kind: "text" },
  split: { id: "split", name: "Split", description: "Brand-colour header over a light panel", kind: "text" },
  blueprint: { id: "blueprint", name: "Blueprint", description: "Technical grid on deep blue", kind: "text" },
  pop: { id: "pop", name: "Pop", description: "Bright, playful and outlined", kind: "text" },
  spotlight: { id: "spotlight", name: "Spotlight", description: "Centred serif, made for quotes and insights", kind: "text" },
  "photo-full": { id: "photo-full", name: "Full Bleed", description: "Edge-to-edge photo with text at the bottom", kind: "photo" },
  "photo-top": { id: "photo-top", name: "Photo Top", description: "Photo above, text below", kind: "photo" },
  "photo-card": { id: "photo-card", name: "Photo Card", description: "Photo background with a white text card", kind: "photo" },
  "photo-polaroid": { id: "photo-polaroid", name: "Polaroid", description: "Framed photo on your brand colour", kind: "photo" },
  "photo-tint": { id: "photo-tint", name: "Duotone", description: "Photo washed in your brand colour", kind: "photo" },
  "photo-minimal": { id: "photo-minimal", name: "Showcase", description: "Product-first photo with a slim caption", kind: "photo" },
};

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (TEMPLATE_IDS as readonly string[]).includes(value);
}

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

/** Rotate a colour's hue (degrees). Used to derive a second gradient colour. */
function hueShift(hex: string, degrees: number): string {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let hue = 0;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
  }
  hue = (hue * 60 + degrees + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] = hue < 60
    ? [c, x, 0]
    : hue < 120
    ? [x, c, 0]
    : hue < 180
    ? [0, c, x]
    : hue < 240
    ? [0, x, c]
    : hue < 300
    ? [x, 0, c]
    : [c, 0, x];
  return `#${[r1, g1, b1].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** A readable version of `color` on `bg` (darkened or lightened until it has contrast). */
function readable(color: string, bg: string): string {
  const dark = luminance(bg) < 0.4;
  let c = color;
  for (let i = 0; i < 6; i++) {
    const ratio = (Math.max(luminance(c), luminance(bg)) + 0.05) / (Math.min(luminance(c), luminance(bg)) + 0.05);
    if (ratio >= 4.2) return c;
    c = mix(c, dark ? "#FFFFFF" : "#000000", 0.18);
  }
  return c;
}

// ---------------------------------------------------------------------------
// Text helpers

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu;

// Characters the slide fonts can draw: Latin, Latin-1, Latin Extended-A, common punctuation and
// currency. Anything else (odd hyphens, symbols, CJK…) would render as a "missing glyph" box.
const UNSUPPORTED = /[^ -~¡-ſ‘’“”•…€₹™°\n]/gu;

/** Normalise text so every character exists in the slide fonts and dashes follow house style. */
export function cleanText(text: string | null | undefined): string {
  return (text ?? "")
    .normalize("NFKC")
    .replace(EMOJI, "")
    .replace(/[‐‑‒−⁃﹣－]/g, "-") // hyphen look-alikes
    .replace(/\s*[–—―]\s*(?=\d)/g, "-") // ranges like 5–7
    .replace(/\s*[–—―]\s*/g, ", ") // em/en dashes used as punctuation
    .replace(/[  -   　]/g, " ") // exotic spaces
    .replace(/[­​‌⁠﻿]/g, "") // invisible characters
    .replace(/[′‵]/g, "'")
    .replace(/[″‶]/g, '"')
    .replace(/[‹›]/g, (c) => (c === "‹" ? "<" : ">"))
    .replace(UNSUPPORTED, "")
    .replace(/ ,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Remove the ==highlight== markers the model uses to emphasise words. */
export function stripMarkers(text: string): string {
  return text.replace(/==/g, "");
}

interface Word {
  text: string;
  hl: boolean;
}

/**
 * Split a heading into wrap-able groups. Text that touches the previous word without a space
 * (e.g. the comma in "==sender==, not") joins that word's group so no gap appears before it.
 * With `keepPhrases`, each ==highlight== stays one unit (one marker box).
 */
function words(text: string, keepPhrases = false): Word[][] {
  const groups: Word[][] = [];
  let spaced = true;
  cleanText(text)
    .split("==")
    .forEach((segment, i) => {
      const hl = i % 2 === 1;
      const tokens = hl && keepPhrases && segment.trim() ? [segment] : segment.split(/(\s+)/);
      for (const token of tokens) {
        if (!token) continue;
        if (/^\s+$/.test(token)) {
          spaced = true;
          continue;
        }
        const leading = /^\s/.test(token);
        const word = { text: token.trim(), hl };
        if (spaced || leading || !groups.length) groups.push([word]);
        else groups[groups.length - 1].push(word);
        spaced = /\s$/.test(token);
      }
    });
  return groups;
}

function sizeFor(length: number, steps: [number, number][], min: number): number {
  for (const [max, size] of steps) if (length <= max) return size;
  return min;
}

// ---------------------------------------------------------------------------
// Template styles

type Highlight = "color" | "marker" | "underline";
type BulletStyle = "check" | "dot" | "number" | "arrow" | "square";
type Counter = "pill" | "text" | "bar" | "none";
type PhotoLayout = "full" | "top" | "card" | "polaroid" | "tint" | "minimal";

interface Palette {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  highlightText: string;
  highlightBg: string;
  surface: string;
  border: string;
  ctaBg: string;
  ctaText: string;
}

interface Style {
  p: Palette;
  /** Is the area behind the logo dark? Picks the light or dark logo variant. */
  logoOnDark: boolean;
  headingFont: string;
  headingWeight: number;
  headingTracking: number;
  headingLine: number;
  headingCase: "none" | "upper";
  headingScale: number;
  bodyFont: string;
  bodyWeight: number;
  labelFont: string;
  align: "left" | "center";
  highlight: Highlight;
  bullets: BulletStyle;
  counter: Counter;
  footerRule: boolean;
  /** Content sits on a card (surface colour, rounded, optional outline/shadow). */
  card: null | { bg: string; border: string; radius: number; shadow: string | null; text: string; muted: string };
  background: (h: H, kind: SlideKind) => unknown;
  photo?: PhotoLayout;
}

const PAD_X = 92;
const PAD_Y = 84;

function svgCanvas(h: H, ...children: unknown[]) {
  return h(
    "svg",
    {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      viewBox: `0 0 ${SLIDE_WIDTH} ${SLIDE_HEIGHT}`,
      style: { position: "absolute", top: 0, left: 0 },
    },
    ...children,
  );
}

// Inline SVG instead of CSS gradients: Satori turns CSS gradients into masked <pattern>s that
// take resvg ~1s per slide, while plain SVG gradients rasterise in a few milliseconds.
function radial(h: H, id: string, color: string, opacity: number, cx: number, cy: number, r: number) {
  return h(
    "radialGradient",
    { id, cx, cy, r, gradientUnits: "userSpaceOnUse" },
    h("stop", { offset: "0", stopColor: color, stopOpacity: opacity }),
    h("stop", { offset: "0.55", stopColor: color, stopOpacity: opacity * 0.25 }),
    h("stop", { offset: "1", stopColor: color, stopOpacity: 0 }),
  );
}

function gridPath(cell: number) {
  let d = "";
  for (let x = cell; x < SLIDE_WIDTH; x += cell) d += `M${x} 0V${SLIDE_HEIGHT}`;
  for (let y = cell; y < SLIDE_HEIGHT; y += cell) d += `M0 ${y}H${SLIDE_WIDTH}`;
  return d;
}

function uid(...parts: string[]) {
  return `g${parts.join("").replace(/[^a-zA-Z0-9]/g, "")}`;
}

function glowBackground(h: H, bg: string, glows: [string, number, number, number, number][], grid?: [string, number, number]) {
  return (_h: H, kind: SlideKind) => {
    const id = uid(bg, kind, ...glows.map((g) => g[0]));
    const shift = kind === "content" ? 90 : kind === "cta" ? -60 : 0;
    return svgCanvas(
      h,
      h("defs", null, ...glows.map(([c, o, x, y, r], i) => radial(h, `${id}${i}`, c, o, x, y + shift, r))),
      h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: bg }),
      grid ? h("path", { d: gridPath(grid[2]), stroke: grid[0], strokeOpacity: grid[1], strokeWidth: 2 }) : null,
      ...glows.map((_, i) => h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: `url(#${id}${i})` })),
    );
  };
}

function plainBackground(h: H, bg: string) {
  return () => svgCanvas(h, h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: bg }));
}

function styleFor(brand: SlideBrand, h: H = () => null): Style {
  const primary = normalizeHex(brand.primary, "#6D28D9");
  const accentRaw = normalizeHex(brand.accent, "");
  const accent = accentRaw || hueShift(primary, 40);
  const primaryDark = luminance(primary) < 0.4;
  const onPrimary = primaryDark ? "#FFFFFF" : "#111111";
  const base = {
    headingFont: "Inter",
    headingWeight: 800,
    headingTracking: -0.035,
    headingLine: 1.06,
    headingCase: "none" as const,
    headingScale: 1,
    bodyFont: "Inter",
    bodyWeight: 500,
    labelFont: "Inter",
    align: "left" as const,
    highlight: "color" as Highlight,
    bullets: "check" as BulletStyle,
    counter: "pill" as Counter,
    footerRule: true,
    card: null,
  };

  switch (brand.template) {
    case "paper": {
      const ink = readable(primary, "#F6F4EF");
      return {
        ...base,
        p: {
          bg: "#F6F4EF", text: "#16141C", muted: "#5E5A68", accent: ink, highlightText: ink, highlightBg: ink,
          surface: "#FFFFFF", border: "rgba(22, 20, 28, 0.10)", ctaBg: ink, ctaText: "#FFFFFF",
        },
        logoOnDark: false,
        headingFont: "Plus Jakarta Sans",
        headingTracking: -0.03,
        bodyFont: "Plus Jakarta Sans",
        bullets: "dot",
        background: glowBackground(h, "#F6F4EF", [[primary, 0.14, 1000, 80, 760], [accent, 0.1, 0, 1350, 640]], ["#16141C", 0.04, 90]),
      };
    }
    case "bold": {
      const marker = accentRaw && accentRaw !== primary ? accentRaw : primaryDark ? "#FDE68A" : "#111111";
      return {
        ...base,
        p: {
          bg: primary, text: onPrimary, muted: primaryDark ? "rgba(255, 255, 255, 0.8)" : "rgba(17, 17, 17, 0.72)",
          accent: marker, highlightText: luminance(marker) > 0.45 ? "#111111" : "#FFFFFF", highlightBg: marker,
          surface: primaryDark ? "rgba(255, 255, 255, 0.13)" : "rgba(0, 0, 0, 0.06)",
          border: primaryDark ? "rgba(255, 255, 255, 0.24)" : "rgba(0, 0, 0, 0.14)",
          ctaBg: primaryDark ? "#FFFFFF" : "#111111", ctaText: primaryDark ? primary : "#FFFFFF",
        },
        logoOnDark: primaryDark,
        highlight: "marker",
        background: glowBackground(h, primary, [[primaryDark ? "#FFFFFF" : "#000000", 0.16, 1000, 60, 820], [primaryDark ? "#000000" : "#FFFFFF", 0.2, 0, 1350, 680]], [primaryDark ? "#FFFFFF" : "#000000", 0.06, 90]),
      };
    }
    case "mono": {
      const ink = readable(primary, "#0B0B0B");
      return {
        ...base,
        p: {
          bg: "#0B0B0B", text: "#FAFAFA", muted: "#9A9A9A", accent: ink, highlightText: "#FAFAFA", highlightBg: ink,
          surface: "#161616", border: "rgba(255, 255, 255, 0.14)", ctaBg: "#FAFAFA", ctaText: "#0B0B0B",
        },
        logoOnDark: true,
        headingFont: "Space Grotesk",
        headingWeight: 700,
        headingTracking: -0.03,
        bodyFont: "Space Grotesk",
        labelFont: "Space Grotesk",
        highlight: "underline",
        bullets: "square",
        counter: "text",
        background: plainBackground(h, "#0B0B0B"),
      };
    }
    case "editorial": {
      const ink = readable(primary, "#F3EEE6");
      return {
        ...base,
        p: {
          bg: "#F3EEE6", text: "#1B1712", muted: "#5F574C", accent: ink, highlightText: ink, highlightBg: ink,
          surface: "#FBF8F3", border: "rgba(27, 23, 18, 0.16)", ctaBg: "#1B1712", ctaText: "#F3EEE6",
        },
        logoOnDark: false,
        headingFont: "Playfair Display",
        headingWeight: 800,
        headingTracking: -0.02,
        headingLine: 1.08,
        bodyFont: "Inter",
        bullets: "number",
        counter: "text",
        background: () =>
          svgCanvas(
            h,
            h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: "#F3EEE6" }),
            h("rect", { x: PAD_X, y: 176, width: SLIDE_WIDTH - PAD_X * 2, height: 3, fill: "#1B1712" }),
            h("rect", { x: PAD_X, y: 186, width: SLIDE_WIDTH - PAD_X * 2, height: 1, fill: "#1B1712" }),
          ),
      };
    }
    case "aurora": {
      const second = accentRaw || hueShift(primary, 60);
      const third = hueShift(primary, -50);
      return {
        ...base,
        p: {
          bg: "#08070F", text: "#FFFFFF", muted: "rgba(255, 255, 255, 0.72)", accent: mix(second, "#FFFFFF", 0.35),
          highlightText: mix(second, "#FFFFFF", 0.35), highlightBg: second,
          surface: "rgba(255, 255, 255, 0.08)", border: "rgba(255, 255, 255, 0.18)", ctaBg: "#FFFFFF", ctaText: "#08070F",
        },
        logoOnDark: true,
        headingFont: "Sora",
        headingWeight: 800,
        headingTracking: -0.04,
        bodyFont: "Sora",
        bullets: "dot",
        card: {
          bg: "rgba(255, 255, 255, 0.07)", border: "rgba(255, 255, 255, 0.16)", radius: 36, shadow: null,
          text: "#FFFFFF", muted: "rgba(255, 255, 255, 0.72)",
        },
        background: glowBackground(h, "#08070F", [[primary, 0.85, 980, 120, 760], [second, 0.7, 60, 1250, 720], [third, 0.45, 160, 220, 520]]),
      };
    }
    case "notebook": {
      const ink = readable(primary, "#FDFBF6");
      return {
        ...base,
        p: {
          bg: "#FDFBF6", text: "#1D2433", muted: "#4E566A", accent: ink, highlightText: "#1D2433", highlightBg: "#FDE68A",
          surface: "#FFFFFF", border: "rgba(29, 36, 51, 0.12)", ctaBg: ink, ctaText: "#FFFFFF",
        },
        logoOnDark: false,
        headingFont: "Fraunces",
        headingWeight: 800,
        headingTracking: -0.02,
        headingLine: 1.1,
        bodyFont: "Inter",
        highlight: "marker",
        bullets: "arrow",
        footerRule: false,
        background: () => {
          let lines = "";
          for (let y = 150; y < SLIDE_HEIGHT; y += 60) lines += `M0 ${y}H${SLIDE_WIDTH}`;
          return svgCanvas(
            h,
            h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: "#FDFBF6" }),
            h("path", { d: lines, stroke: "#8EA6D8", strokeOpacity: 0.32, strokeWidth: 2 }),
            h("rect", { x: 64, y: 0, width: 3, height: SLIDE_HEIGHT, fill: "#E57373", fillOpacity: 0.55 }),
          );
        },
      };
    }
    case "terminal": {
      const green = accentRaw ? readable(accentRaw, "#0D1117") : "#3FB950";
      return {
        ...base,
        p: {
          bg: "#0D1117", text: "#E6EDF3", muted: "#8B949E", accent: green, highlightText: green, highlightBg: green,
          surface: "#161B22", border: "#30363D", ctaBg: green, ctaText: "#0D1117",
        },
        logoOnDark: true,
        headingFont: "Space Grotesk",
        headingWeight: 700,
        headingTracking: -0.03,
        bodyFont: "Space Mono",
        bodyWeight: 400,
        labelFont: "Space Mono",
        bullets: "arrow",
        counter: "text",
        background: () =>
          svgCanvas(
            h,
            h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: "#0D1117" }),
            h("rect", { x: 0, y: 0, width: SLIDE_WIDTH, height: 46, fill: "#161B22" }),
            h("circle", { cx: 34, cy: 23, r: 8, fill: "#FF5F56" }),
            h("circle", { cx: 62, cy: 23, r: 8, fill: "#FFBD2E" }),
            h("circle", { cx: 90, cy: 23, r: 8, fill: "#27C93F" }),
            h("path", { d: gridPath(54), stroke: "#FFFFFF", strokeOpacity: 0.025, strokeWidth: 2 }),
          ),
      };
    }
    case "pastel": {
      const tint = mix(primary, "#FFFFFF", 0.86);
      const ink = readable(primary, tint);
      return {
        ...base,
        p: {
          bg: tint, text: "#1B1A22", muted: "#55525F", accent: ink, highlightText: ink, highlightBg: ink,
          surface: "#FFFFFF", border: rgba(primary, 0.18), ctaBg: ink, ctaText: "#FFFFFF",
        },
        logoOnDark: false,
        headingFont: "Outfit",
        headingWeight: 800,
        headingTracking: -0.03,
        bodyFont: "Outfit",
        bullets: "dot",
        footerRule: false,
        card: { bg: "#FFFFFF", border: rgba(primary, 0.12), radius: 48, shadow: `0 24px 60px ${rgba(primary, 0.18)}`, text: "#1B1A22", muted: "#55525F" },
        background: () => {
          const id = uid("pastel", tint);
          return svgCanvas(
            h,
            h("defs", null, radial(h, `${id}a`, "#FFFFFF", 0.7, 180, 160, 520), radial(h, `${id}b`, primary, 0.18, 1000, 1300, 640)),
            h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: tint }),
            h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: `url(#${id}a)` }),
            h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: `url(#${id}b)` }),
          );
        },
      };
    }
    case "framed": {
      const ink = readable(primary, "#FFFFFF");
      return {
        ...base,
        p: {
          bg: "#FFFFFF", text: "#111111", muted: "#555555", accent: ink, highlightText: ink, highlightBg: ink,
          surface: "#F4F4F4", border: "rgba(0, 0, 0, 0.12)", ctaBg: "#111111", ctaText: "#FFFFFF",
        },
        logoOnDark: false,
        headingFont: "Archivo Black",
        headingWeight: 400,
        headingTracking: -0.02,
        headingLine: 1.02,
        headingCase: "upper",
        headingScale: 0.9,
        align: "center",
        bullets: "square",
        counter: "text",
        footerRule: false,
        background: () =>
          svgCanvas(
            h,
            h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: primary }),
            h("rect", { x: 36, y: 36, width: SLIDE_WIDTH - 72, height: SLIDE_HEIGHT - 72, rx: 28, fill: "#FFFFFF" }),
          ),
      };
    }
    case "split": {
      const ink = readable(primary, "#FFFFFF");
      return {
        ...base,
        p: {
          bg: "#FFFFFF", text: "#141414", muted: "#5B5B66", accent: ink, highlightText: primaryDark ? "#FDE68A" : "#111111",
          highlightBg: ink, surface: "#F5F5F7", border: "rgba(0, 0, 0, 0.1)", ctaBg: ink, ctaText: "#FFFFFF",
        },
        logoOnDark: primaryDark,
        headingFont: "Plus Jakarta Sans",
        headingTracking: -0.035,
        bodyFont: "Plus Jakarta Sans",
        bullets: "number",
        background: plainBackground(h, "#FFFFFF"),
      };
    }
    case "blueprint": {
      const navy = mix(primary, "#0B1E4A", 0.72);
      return {
        ...base,
        p: {
          bg: navy, text: "#F2F6FF", muted: "rgba(226, 236, 255, 0.72)", accent: "#7DD3FC", highlightText: "#7DD3FC",
          highlightBg: "#7DD3FC", surface: "rgba(125, 211, 252, 0.08)", border: "rgba(125, 211, 252, 0.3)",
          ctaBg: "#7DD3FC", ctaText: navy,
        },
        logoOnDark: true,
        headingFont: "Space Grotesk",
        headingWeight: 700,
        headingTracking: -0.03,
        bodyFont: "Space Grotesk",
        labelFont: "Space Mono",
        highlight: "underline",
        bullets: "square",
        counter: "bar",
        background: () =>
          svgCanvas(
            h,
            h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: navy }),
            h("path", { d: gridPath(27), stroke: "#FFFFFF", strokeOpacity: 0.035, strokeWidth: 1 }),
            h("path", { d: gridPath(135), stroke: "#FFFFFF", strokeOpacity: 0.09, strokeWidth: 2 }),
          ),
      };
    }
    case "pop": {
      const bg = accentRaw && luminance(accentRaw) > 0.45 ? accentRaw : "#FFE14D";
      return {
        ...base,
        p: {
          bg, text: "#111111", muted: "#2B2B2B", accent: "#111111", highlightText: "#FFFFFF", highlightBg: primaryDark ? primary : "#111111",
          surface: "#FFFFFF", border: "#111111", ctaBg: "#111111", ctaText: bg,
        },
        logoOnDark: false,
        headingFont: "Bricolage Grotesque",
        headingWeight: 800,
        headingTracking: -0.04,
        bodyFont: "Bricolage Grotesque",
        highlight: "marker",
        bullets: "check",
        footerRule: false,
        card: { bg: "#FFFFFF", border: "#111111", radius: 28, shadow: "14px 14px 0 #111111", text: "#111111", muted: "#3A3A3A" },
        background: () => {
          let dots = "";
          for (let y = 30; y < SLIDE_HEIGHT; y += 60) {
            for (let x = 30; x < SLIDE_WIDTH; x += 60) dots += `M${x} ${y}h.01`;
          }
          return svgCanvas(
            h,
            h("rect", { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: bg }),
            h("path", { d: dots, stroke: "#111111", strokeOpacity: 0.16, strokeWidth: 7, strokeLinecap: "round" }),
          );
        },
      };
    }
    case "spotlight": {
      const glowColor = primary;
      return {
        ...base,
        p: {
          bg: "#0E0D12", text: "#F7F5F0", muted: "#A7A3AE", accent: mix(primary, "#FFFFFF", 0.45),
          highlightText: mix(primary, "#FFFFFF", 0.45), highlightBg: primary,
          surface: "rgba(255, 255, 255, 0.05)", border: "rgba(255, 255, 255, 0.14)", ctaBg: "#F7F5F0", ctaText: "#0E0D12",
        },
        logoOnDark: true,
        headingFont: "DM Serif Display",
        headingWeight: 400,
        headingTracking: -0.01,
        headingLine: 1.1,
        align: "center",
        bullets: "dot",
        counter: "text",
        background: glowBackground(h, "#0E0D12", [[glowColor, 0.5, 540, 640, 760]]),
      };
    }
    case "photo-full":
    case "photo-tint":
    case "photo-minimal": {
      const layout = brand.template === "photo-full" ? "full" : brand.template === "photo-tint" ? "tint" : "minimal";
      return {
        ...base,
        p: {
          bg: "#111111", text: "#FFFFFF", muted: "rgba(255, 255, 255, 0.82)", accent: mix(accent, "#FFFFFF", 0.4),
          highlightText: layout === "tint" ? "#111111" : mix(accent, "#FFFFFF", 0.45),
          highlightBg: layout === "tint" ? "#FFFFFF" : accent,
          surface: "rgba(255, 255, 255, 0.14)", border: "rgba(255, 255, 255, 0.28)", ctaBg: "#FFFFFF", ctaText: "#111111",
        },
        logoOnDark: true,
        headingFont: layout === "tint" ? "Archivo Black" : layout === "minimal" ? "Outfit" : "Inter",
        headingWeight: layout === "tint" ? 400 : 800,
        headingCase: layout === "tint" ? "upper" : "none",
        headingScale: layout === "minimal" ? 0.72 : layout === "tint" ? 0.88 : 1,
        bodyFont: layout === "minimal" ? "Outfit" : "Inter",
        align: layout === "tint" ? "center" : "left",
        highlight: layout === "tint" ? "marker" : "color",
        bullets: "dot",
        counter: layout === "minimal" ? "text" : "pill",
        footerRule: false,
        photo: layout,
        background: plainBackground(h, "#111111"),
      };
    }
    case "photo-top":
    case "photo-card": {
      const ink = readable(primary, "#FFFFFF");
      const layout = brand.template === "photo-top" ? "top" : "card";
      return {
        ...base,
        p: {
          bg: "#FFFFFF", text: "#141414", muted: "#585862", accent: ink, highlightText: ink, highlightBg: ink,
          surface: "#F4F4F6", border: "rgba(0, 0, 0, 0.1)", ctaBg: ink, ctaText: "#FFFFFF",
        },
        logoOnDark: layout === "card",
        headingFont: layout === "card" ? "Manrope" : "Plus Jakarta Sans",
        headingTracking: -0.035,
        headingScale: 0.86,
        bodyFont: layout === "card" ? "Manrope" : "Plus Jakarta Sans",
        bullets: "dot",
        footerRule: false,
        photo: layout,
        background: plainBackground(h, "#FFFFFF"),
      };
    }
    case "photo-polaroid": {
      const bg = mix(primary, "#FFFFFF", 0.82);
      const ink = readable(primary, bg);
      return {
        ...base,
        p: {
          bg, text: "#1A1820", muted: "#4F4B57", accent: ink, highlightText: ink, highlightBg: ink,
          surface: "#FFFFFF", border: rgba(primary, 0.2), ctaBg: ink, ctaText: "#FFFFFF",
        },
        logoOnDark: false,
        headingFont: "Fraunces",
        headingWeight: 800,
        headingTracking: -0.02,
        headingScale: 0.78,
        bodyFont: "Inter",
        bullets: "dot",
        footerRule: false,
        photo: "polaroid",
        background: plainBackground(h, bg),
      };
    }
    default: {
      const glowAccent = mix(primary, "#FFFFFF", luminance(primary) < 0.2 ? 0.45 : 0.3);
      const hl = accentRaw ? mix(accentRaw, "#FFFFFF", 0.15) : glowAccent;
      return {
        ...base,
        p: {
          bg: "#0A0A12", text: "#F6F5FA", muted: "#A3A1B8", accent: hl, highlightText: hl, highlightBg: primary,
          surface: "rgba(255, 255, 255, 0.05)", border: "rgba(255, 255, 255, 0.12)", ctaBg: primary, ctaText: "#FFFFFF",
        },
        logoOnDark: true,
        background: glowBackground(h, "#0A0A12", [[primary, 0.6, 990, 60, 820], [accentRaw || mix(primary, "#3B82F6", 0.5), 0.3, 0, 1350, 680]], ["#FFFFFF", 0.04, 90]),
      };
    }
  }
}

/** Whether the logo sits on a dark background, so callers can pick the light logo variant. */
export function logoOnDark(brand: Pick<SlideBrand, "template" | "primary" | "accent">): boolean {
  return styleFor({ name: "", handle: null, logo: null, cta: null, ...brand }).logoOnDark;
}

// ---------------------------------------------------------------------------
// Building blocks

function icon(h: H, kind: "arrow" | "check", color: string, size: number) {
  return h(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24", fill: "none" },
    h("path", {
      d: kind === "arrow" ? "M5 12h14M13 6l6 6-6 6" : "M5 12.5l4.2 4.2L19 7",
      stroke: color,
      strokeWidth: kind === "arrow" ? 2.4 : 3,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
  );
}

interface Ctx {
  h: H;
  s: Style;
  brand: SlideBrand;
  f: (family: string) => string;
  index: number;
  total: number;
  /** Text colours for the current surface (card or page). */
  text: string;
  muted: string;
  /** Chrome (counter, eyebrow) sits directly on a photo and needs a dark translucent backing. */
  onPhoto?: boolean;
}

const PHOTO_CHIP = { backgroundColor: "rgba(0, 0, 0, 0.38)", border: "2px solid rgba(255, 255, 255, 0.32)", color: "#FFFFFF" };

function brandMark(c: Ctx, height: number, color: string) {
  const { h, brand, s, f } = c;
  if (brand.logo) {
    return h("img", {
      src: brand.logo.url,
      width: Math.round(height * brand.logo.aspect),
      height,
      style: { objectFit: "contain" },
    });
  }
  const initial = cleanText(brand.name).charAt(0).toUpperCase() || "B";
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 16 } },
    h(
      "div",
      {
        style: {
          width: height, height, borderRadius: height * 0.3, backgroundColor: s.p.ctaBg, color: s.p.ctaText,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: f(s.labelFont), fontWeight: 700, fontSize: height * 0.55,
        },
      },
      initial,
    ),
    h(
      "div",
      { style: { display: "flex", fontFamily: f(s.labelFont), fontWeight: 700, fontSize: height * 0.58, color, letterSpacing: -0.5 } },
      cleanText(brand.name),
    ),
  );
}

function counter(c: Ctx, color: string) {
  const { h, s, f, index, total } = c;
  if (total <= 1 || s.counter === "none" || s.counter === "bar") return null;
  const label = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  if (s.counter === "text") {
    return h("div", { style: { display: "flex", color, fontFamily: f(s.labelFont), fontWeight: 600, fontSize: 24, letterSpacing: 2 } }, label);
  }
  return h(
    "div",
    {
      style: {
        display: "flex", alignItems: "center", padding: "10px 20px", borderRadius: 999,
        border: `2px solid ${s.p.border}`, backgroundColor: s.p.surface, color,
        fontFamily: f(s.labelFont), fontWeight: 600, fontSize: 24, letterSpacing: 1,
        ...(c.onPhoto ? PHOTO_CHIP : {}),
      },
    },
    label,
  );
}

function progressBar(c: Ctx) {
  const { h, s, index, total } = c;
  if (s.counter !== "bar" || total <= 1) return null;
  return h(
    "div",
    { style: { position: "absolute", top: 0, left: 0, width: SLIDE_WIDTH, height: 10, display: "flex", backgroundColor: s.p.surface } },
    h("div", { style: { display: "flex", width: Math.round(SLIDE_WIDTH * ((index + 1) / total)), height: 10, backgroundColor: s.p.accent } }),
  );
}

function header(c: Ctx, color = c.s.p.text, mutedColor = c.s.p.muted) {
  const { h } = c;
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 } },
    brandMark(c, 52, color),
    counter(c, mutedColor),
  );
}

function footer(c: Ctx, color = c.s.p.muted, strong = c.s.p.text, rule = c.s.footerRule) {
  const { h, s, f, brand, index, total } = c;
  const last = index === total - 1;
  const handle = cleanText(brand.handle);
  const right = total > 1 && !last
    ? h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 12, color: strong, fontFamily: f(s.labelFont), fontWeight: 600, fontSize: 26 } },
      "Swipe",
      h(
        "div",
        {
          style: {
            width: 56, height: 56, borderRadius: 999, backgroundColor: s.p.ctaBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          },
        },
        icon(h, "arrow", s.p.ctaText, 30),
      ),
    )
    : h("div", { style: { display: "flex", color, fontFamily: f(s.labelFont), fontWeight: 600, fontSize: 24 } }, total > 1 ? "Save for later" : "");
  return h(
    "div",
    {
      style: {
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
        ...(rule ? { borderTop: `2px solid ${s.p.border}`, paddingTop: 28, boxSizing: "content-box" } : {}),
      },
    },
    h(
      "div",
      { style: { display: "flex", color, fontFamily: f(s.labelFont), fontWeight: 600, fontSize: 26 } },
      handle ? (handle.startsWith("@") ? handle : `@${handle}`) : cleanText(brand.name),
    ),
    right,
  );
}

function eyebrow(c: Ctx, text: string | null) {
  const { h, s, f } = c;
  const t = cleanText(text);
  if (!t) return null;
  const centered = s.align === "center";
  if (s.labelFont === "Space Mono") {
    return h(
      "div",
      { style: { display: "flex", justifyContent: centered ? "center" : "flex-start", color: s.p.accent, fontFamily: f("Space Mono"), fontWeight: 700, fontSize: 28 } },
      `> ${t.toLowerCase()}`,
    );
  }
  return h(
    "div",
    { style: { display: "flex", justifyContent: centered ? "center" : "flex-start" } },
    h(
      "div",
      {
        style: {
          display: "flex", alignItems: "center", gap: 14, padding: "12px 24px", borderRadius: 999,
          backgroundColor: s.p.surface, border: `2px solid ${s.p.border}`, color: s.p.accent,
          fontFamily: f(s.labelFont), fontWeight: 700, fontSize: 24, letterSpacing: 3, textTransform: "uppercase",
          ...(c.onPhoto ? PHOTO_CHIP : {}),
        },
      },
      h("div", { style: { width: 12, height: 12, borderRadius: 999, backgroundColor: c.onPhoto ? "#FFFFFF" : s.p.accent } }),
      t,
    ),
  );
}

function heading(c: Ctx, text: string, size: number, color = c.text) {
  const { h, s, f } = c;
  const keep = s.highlight !== "color";
  const gap = Math.round(size * 0.24);
  const groups = words(text, keep).map((g) => g.map((w) => ({ ...w, text: s.headingCase === "upper" ? w.text.toUpperCase() : w.text })));
  const part = (w: Word, key: number) =>
    h(
      "span",
      {
        key,
        style: !w.hl
          ? { display: "flex" }
          : s.highlight === "marker"
          ? {
            display: "flex", color: s.p.highlightText, backgroundColor: s.p.highlightBg,
            padding: `0 ${Math.round(size * 0.12)}px`, borderRadius: Math.round(size * 0.14),
          }
          : s.highlight === "underline"
          ? {
            display: "flex", color: s.p.highlightText,
            borderBottom: `${Math.max(6, Math.round(size * 0.08))}px solid ${s.p.highlightBg}`,
            paddingBottom: Math.round(size * 0.02),
          }
          : { display: "flex", color: s.p.highlightText },
      },
      w.text,
    );
  return h(
    "div",
    {
      style: {
        display: "flex", flexWrap: "wrap", columnGap: gap, rowGap: Math.round(size * 0.06),
        justifyContent: s.align === "center" ? "center" : "flex-start",
        fontFamily: f(s.headingFont), fontWeight: s.headingWeight, fontSize: size,
        lineHeight: s.headingLine, letterSpacing: size * s.headingTracking, color,
      },
    },
    ...groups.map((g, i) => (g.length === 1 ? part(g[0], i) : h("span", { key: i, style: { display: "flex" } }, ...g.map(part)))),
  );
}

function bodyText(c: Ctx, text: string | null, size: number, color = c.muted) {
  const { h, s, f } = c;
  const t = stripMarkers(cleanText(text));
  if (!t) return null;
  return h(
    "div",
    {
      style: {
        display: "flex", fontFamily: f(s.bodyFont), fontWeight: s.bodyWeight, fontSize: size, lineHeight: 1.42,
        color, whiteSpace: "pre-wrap", textAlign: s.align === "center" ? "center" : "left",
        justifyContent: s.align === "center" ? "center" : "flex-start",
      },
    },
    t,
  );
}

function bulletMarker(c: Ctx, size: number, n: number) {
  const { h, s, f } = c;
  const box = Math.round(size * 1.25);
  switch (s.bullets) {
    case "number":
      return h(
        "div",
        {
          style: {
            display: "flex", alignItems: "center", justifyContent: "center", width: box, height: box, minWidth: box,
            borderRadius: 999, backgroundColor: s.p.accent, color: s.p.ctaText === s.p.accent ? "#FFFFFF" : s.p.ctaText,
            fontFamily: f(s.labelFont), fontWeight: 700, fontSize: Math.round(size * 0.62), marginTop: 2,
          },
        },
        String(n),
      );
    case "dot":
      return h(
        "div",
        { style: { display: "flex", width: box * 0.6, minWidth: box * 0.6, height: Math.round(size * 1.36), alignItems: "center", justifyContent: "center" } },
        h("div", { style: { display: "flex", width: Math.round(size * 0.36), height: Math.round(size * 0.36), borderRadius: 999, backgroundColor: s.p.accent } }),
      );
    case "square":
      return h(
        "div",
        { style: { display: "flex", width: box * 0.6, minWidth: box * 0.6, height: Math.round(size * 1.36), alignItems: "center", justifyContent: "center" } },
        h("div", { style: { display: "flex", width: Math.round(size * 0.34), height: Math.round(size * 0.34), backgroundColor: s.p.accent } }),
      );
    case "arrow":
      return h(
        "div",
        { style: { display: "flex", width: box * 0.8, minWidth: box * 0.8, height: Math.round(size * 1.36), alignItems: "center" } },
        icon(h, "arrow", s.p.accent, Math.round(size * 0.9)),
      );
    default:
      return h(
        "div",
        {
          style: {
            display: "flex", alignItems: "center", justifyContent: "center", width: box, height: box, minWidth: box,
            borderRadius: Math.round(size * 0.36), backgroundColor: s.p.surface, border: `2px solid ${s.p.border}`, marginTop: 2,
          },
        },
        icon(h, "check", s.p.accent, Math.round(size * 0.78)),
      );
  }
}

function bulletList(c: Ctx, bullets: string[] | null, size: number, width: number, color = c.text) {
  const { h, s, f } = c;
  const items = (bullets ?? []).map((b) => stripMarkers(cleanText(b))).filter(Boolean).slice(0, 5);
  if (!items.length) return null;
  return h(
    "div",
    {
      style: {
        display: "flex", flexDirection: "column", gap: Math.round(size * 0.62),
        alignSelf: s.align === "center" ? "center" : "stretch", width: s.align === "center" ? Math.min(820, width) : width,
      },
    },
    ...items.map((item, i) =>
      h(
        "div",
        { key: i, style: { display: "flex", alignItems: "flex-start", gap: 22 } },
        bulletMarker(c, size, i + 1),
        h(
          "div",
          {
            style: {
              display: "flex", flex: 1, fontFamily: f(s.bodyFont), fontWeight: s.bodyWeight, fontSize: size,
              lineHeight: 1.36, color,
            },
          },
          item,
        ),
      )
    ),
  );
}

function ctaBox(c: Ctx, width: number) {
  const { h, s, f, brand } = c;
  const cta = cleanText(brand.cta);
  if (!cta) return null;
  return h(
    "div",
    { style: { display: "flex", marginTop: 8, justifyContent: s.align === "center" ? "center" : "flex-start" } },
    h(
      "div",
      {
        style: {
          display: "flex", alignItems: "center", gap: 22, width, padding: "30px 38px", borderRadius: 26,
          backgroundColor: s.p.ctaBg, color: s.p.ctaText, fontFamily: f(s.labelFont), fontWeight: 700, fontSize: 32,
          lineHeight: 1.3, ...(s.card?.shadow?.includes("0 #") ? { border: "3px solid #111111" } : {}),
        },
      },
      h("div", { style: { display: "flex", flex: 1 } }, cta),
      icon(h, "arrow", s.p.ctaText, 38),
    ),
  );
}

/** The eyebrow + heading + body/bullets (+ CTA) column every layout uses. */
function contentBlock(c: Ctx, slide: Slide, opts: { scale?: number; gap?: number; width?: number } = {}) {
  const { h, s } = c;
  const scale = (opts.scale ?? 1) * s.headingScale;
  const len = stripMarkers(cleanText(slide.heading)).length;
  const bulletChars = (slide.bullets ?? []).join(" ").length;
  const bodyChars = cleanText(slide.body).length;
  const kind = slide.kind;
  let size: number;
  if (kind === "cover") size = sizeFor(len, [[24, 124], [40, 110], [60, 96], [80, 84]], 72);
  else if (kind === "cta") size = sizeFor(len, [[30, 98], [55, 84], [80, 72]], 64);
  else if (kind === "single") size = sizeFor(len, [[30, 110], [55, 94], [80, 80]], 68);
  else size = sizeFor(len, [[28, 80], [50, 70], [75, 62]], 54) - (bulletChars + bodyChars > 260 ? 6 : 0);
  size = Math.round(size * scale);
  const bodySize = Math.round(sizeFor(bodyChars, [[120, 38], [200, 35]], 32) * Math.max(0.85, Math.min(1, scale + 0.1)));
  const bulletSize = Math.round(sizeFor(bulletChars, [[120, 37], [220, 34], [320, 31]], 29) * Math.max(0.85, Math.min(1, scale + 0.1)));
  const width = opts.width ?? SLIDE_WIDTH - PAD_X * 2;

  const stepLabel = kind === "content"
    ? h(
      "div",
      {
        style: {
          display: "flex", alignItems: "center", gap: 22, justifyContent: s.align === "center" ? "center" : "flex-start",
          fontFamily: c.f(s.headingFont), fontWeight: s.headingWeight, fontSize: 44, color: s.p.accent,
        },
      },
      cleanText(slide.eyebrow) || String(c.index).padStart(2, "0"),
      h("div", { style: { display: "flex", width: 110, height: 4, borderRadius: 4, backgroundColor: s.p.accent } }),
    )
    : eyebrow(c, slide.eyebrow);

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: opts.gap ?? 40, width } },
    stepLabel,
    heading(c, slide.heading, size),
    bodyText(c, slide.body, kind === "cover" || kind === "cta" ? 36 : bodySize),
    kind !== "cover" && kind !== "cta" ? bulletList(c, slide.bullets, bulletSize, width) : null,
    kind === "cta" ? ctaBox(c, width) : null,
  );
}

function stage(h: H, s: Style, kind: SlideKind, ...children: unknown[]) {
  return h(
    "div",
    {
      style: {
        position: "relative", width: SLIDE_WIDTH, height: SLIDE_HEIGHT, display: "flex",
        flexDirection: "column", overflow: "hidden", backgroundColor: s.p.bg,
      },
    },
    s.background(h, kind),
    ...children,
  );
}

function layer(h: H, style: Record<string, unknown>, ...children: unknown[]) {
  return h(
    "div",
    { style: { position: "absolute", top: 0, left: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, display: "flex", flexDirection: "column", ...style } },
    ...children,
  );
}

// ---------------------------------------------------------------------------
// Photos

/** Placeholder used when a photo template has no image yet: soft brand gradient with a product silhouette. */
export function samplePhoto(primary: string, variant = 0): string {
  const p = normalizeHex(primary, "#6D28D9");
  const light = mix(p, "#FFFFFF", 0.78);
  const mid = mix(p, "#FFFFFF", 0.45);
  const deep = mix(p, "#000000", 0.35);
  const shapes = [
    `<rect x="410" y="420" width="260" height="560" rx="70" fill="${deep}"/><rect x="470" y="330" width="140" height="120" rx="26" fill="${mix(deep, "#000000", 0.3)}"/><rect x="440" y="560" width="200" height="220" rx="24" fill="${light}" fill-opacity="0.9"/>`,
    `<circle cx="540" cy="640" r="270" fill="${deep}"/><circle cx="540" cy="640" r="200" fill="${mid}"/><circle cx="540" cy="640" r="70" fill="${light}"/>`,
    `<path d="M300 900 C 340 640, 520 520, 780 560 C 800 700, 700 880, 300 900 Z" fill="${deep}"/><ellipse cx="520" cy="930" rx="300" ry="40" fill="#000" fill-opacity="0.12"/>`,
  ][variant % 3];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><radialGradient id="a" cx="540" cy="520" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/></radialGradient></defs><rect width="1080" height="1350" fill="url(#a)"/><ellipse cx="540" cy="1000" rx="330" ry="54" fill="#000" fill-opacity="0.14"/>${shapes}</svg>`;
  return `data:image/svg+xml;base64,${typeof btoa === "function" ? btoa(svg) : svg}`;
}

function photoImg(h: H, url: string, width: number, height: number, style: Record<string, unknown> = {}) {
  return h("img", { src: url, width, height, style: { objectFit: "cover", width, height, ...style } });
}

function shade(h: H, id: string, stops: [number, string, number][], x = 0, y = 0, w = SLIDE_WIDTH, hgt = SLIDE_HEIGHT) {
  return h(
    "svg",
    { width: w, height: hgt, viewBox: `0 0 ${w} ${hgt}`, style: { position: "absolute", top: y, left: x } },
    h(
      "defs",
      null,
      h(
        "linearGradient",
        { id, x1: "0", y1: "0", x2: "0", y2: "1" },
        ...stops.map(([offset, color, opacity]) => h("stop", { offset: String(offset), stopColor: color, stopOpacity: opacity })),
      ),
    ),
    h("rect", { width: w, height: hgt, fill: `url(#${id})` }),
  );
}

function photoSlide(c: Ctx, slide: Slide) {
  const { h, s, brand } = c;
  // No photo found: abstract brand art (variants 1 and 2), never the product-shaped preview placeholder.
  const url = slide.image?.url || samplePhoto(brand.primary, 1 + (c.index % 2));
  const primary = normalizeHex(brand.primary, "#6D28D9");
  const inner = SLIDE_WIDTH - PAD_X * 2;

  if (s.photo === "top") {
    const photoH = slide.kind === "content" ? 560 : 700;
    return stage(
      h, s, slide.kind,
      photoImg(h, url, SLIDE_WIDTH, photoH, { position: "absolute", top: 0, left: 0 }),
      shade(h, uid("pt", String(photoH)), [[0, "#000000", 0.45], [0.35, "#000000", 0]], 0, 0, SLIDE_WIDTH, photoH),
      layer(h, { padding: `${PAD_Y}px ${PAD_X}px` }, header({ ...c, onPhoto: true }, "#FFFFFF", "#FFFFFF")),
      layer(
        h,
        { top: photoH, height: SLIDE_HEIGHT - photoH, padding: `56px ${PAD_X}px ${PAD_Y}px` },
        h("div", { style: { display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" } }, contentBlock(c, slide, { scale: 0.92, gap: 30 })),
        footer(c),
      ),
    );
  }

  if (s.photo === "polaroid") {
    const tilt = c.index % 2 === 0 ? -2.5 : 2;
    const photoW = 700;
    const photoH = slide.kind === "content" ? 400 : slide.kind === "cta" ? 420 : 500;
    return stage(
      h, s, slide.kind,
      layer(
        h,
        { padding: `${PAD_Y}px ${PAD_X}px` },
        header(c),
        h(
          "div",
          { style: { display: "flex", justifyContent: "center", marginTop: 24 } },
          h(
            "div",
            {
              style: {
                display: "flex", padding: "22px 22px 60px", backgroundColor: "#FFFFFF", borderRadius: 10,
                transform: `rotate(${tilt}deg)`, boxShadow: `0 30px 60px ${rgba(primary, 0.28)}`,
              },
            },
            photoImg(h, url, photoW, photoH, { borderRadius: 4 }),
          ),
        ),
        h("div", { style: { display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", paddingTop: 20 } }, contentBlock(c, slide, { scale: 0.92, gap: 24 })),
        footer(c),
      ),
    );
  }

  // Full-bleed photo layouts
  const overlay = s.photo === "tint"
    ? h("div", { style: { position: "absolute", top: 0, left: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, display: "flex", backgroundColor: rgba(mix(primary, "#000000", 0.25), 0.74) } })
    : s.photo === "card"
    ? shade(h, uid("pc", String(c.index)), [[0, "#000000", 0.5], [0.3, "#000000", 0], [1, "#000000", 0.1]])
    : shade(h, uid("pf", s.photo ?? ""), [[0, "#000000", 0.55], [0.22, "#000000", 0.05], [0.5, "#000000", 0.25], [1, "#000000", 0.88]]);

  const photoLayers = [photoImg(h, url, SLIDE_WIDTH, SLIDE_HEIGHT, { position: "absolute", top: 0, left: 0 }), overlay];

  if (s.photo === "card") {
    const card = { ...c, text: "#141414", muted: "#585862" };
    return stage(
      h, s, slide.kind,
      ...photoLayers,
      layer(
        h,
        { padding: `${PAD_Y}px ${PAD_X}px`, justifyContent: "space-between" },
        header({ ...c, onPhoto: true }, "#FFFFFF", "#FFFFFF"),
        h(
          "div",
          {
            style: {
              display: "flex", flexDirection: "column", gap: 34, padding: "52px 56px 44px", backgroundColor: "#FFFFFF",
              borderRadius: 40, boxShadow: "0 30px 80px rgba(0, 0, 0, 0.35)",
            },
          },
          contentBlock(card, slide, { scale: 0.86, gap: 28, width: inner - 112 }),
          footer(card, "#6B6B75", "#141414", false),
        ),
      ),
    );
  }

  if (s.photo === "minimal") {
    const strip = { ...c, text: "#FFFFFF", muted: "rgba(255, 255, 255, 0.82)" };
    const minimalSlide: Slide = { ...slide, bullets: slide.kind === "content" ? (slide.bullets ?? []).slice(0, 3) : slide.bullets };
    return stage(
      h, s, slide.kind,
      ...photoLayers,
      layer(
        h,
        { padding: `${PAD_Y}px ${PAD_X}px`, justifyContent: "space-between" },
        header({ ...c, onPhoto: true }, "#FFFFFF", "#FFFFFF"),
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 34 } },
          contentBlock({ ...strip, onPhoto: true }, minimalSlide, { gap: 22 }),
          footer(strip, "rgba(255, 255, 255, 0.85)", "#FFFFFF", true),
        ),
      ),
    );
  }

  const overlayCtx = { ...c, text: "#FFFFFF", muted: "rgba(255, 255, 255, 0.86)", onPhoto: true };
  return stage(
    h, s, slide.kind,
    ...photoLayers,
    layer(
      h,
      { padding: `${PAD_Y}px ${PAD_X}px` },
      header(overlayCtx, "#FFFFFF", "#FFFFFF"),
      h(
        "div",
        { style: { display: "flex", flex: 1, flexDirection: "column", justifyContent: s.photo === "tint" ? "center" : "flex-end", paddingBottom: 40 } },
        contentBlock(overlayCtx, slide, { gap: 32 }),
      ),
      footer(overlayCtx, "rgba(255, 255, 255, 0.85)", "#FFFFFF", s.photo !== "tint"),
    ),
  );
}

// ---------------------------------------------------------------------------
// Text layouts

function splitSlide(c: Ctx, slide: Slide) {
  const { h, s, brand } = c;
  const primary = normalizeHex(brand.primary, "#6D28D9");
  const onBand = luminance(primary) < 0.4 ? "#FFFFFF" : "#111111";
  const bandH = slide.kind === "content" ? 600 : 760;
  const band = {
    ...c, text: onBand, muted: rgba(onBand, 0.8),
    s: { ...s, p: { ...s.p, accent: onBand, surface: rgba(onBand, 0.14), border: rgba(onBand, 0.28), ctaBg: onBand, ctaText: primary } },
  };
  const len = stripMarkers(cleanText(slide.heading)).length;
  const size = Math.round((slide.kind === "content" ? sizeFor(len, [[28, 78], [50, 68], [75, 60]], 52) : sizeFor(len, [[30, 104], [55, 88], [80, 76]], 66)));
  return stage(
    h, s, slide.kind,
    h("div", { style: { position: "absolute", top: 0, left: 0, width: SLIDE_WIDTH, height: bandH, display: "flex", backgroundColor: primary } }),
    layer(
      h,
      { padding: `${PAD_Y}px ${PAD_X}px` },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", height: bandH - PAD_Y - 56, justifyContent: "space-between" } },
        header(band, onBand, rgba(onBand, 0.8)),
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 32 } },
          slide.kind === "content"
            ? h("div", { style: { display: "flex", color: onBand, fontFamily: c.f(s.headingFont), fontWeight: 800, fontSize: 44 } }, cleanText(slide.eyebrow) || String(c.index).padStart(2, "0"))
            : eyebrow(band, slide.eyebrow),
          heading(band, slide.heading, size, onBand),
        ),
      ),
      h(
        "div",
        { style: { display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 34, paddingTop: 56 } },
        bodyText(c, slide.body, 36),
        slide.kind !== "cover" && slide.kind !== "cta" ? bulletList(c, slide.bullets, 34, SLIDE_WIDTH - PAD_X * 2) : null,
        slide.kind === "cta" ? ctaBox(c, SLIDE_WIDTH - PAD_X * 2) : null,
      ),
      footer(c),
    ),
  );
}

function standardSlide(c: Ctx, slide: Slide) {
  const { h, s } = c;
  const inner = SLIDE_WIDTH - PAD_X * 2;
  const centered = s.align === "center";

  const quoteMark = s.headingFont === "DM Serif Display" && (slide.kind === "single" || slide.kind === "cover")
    ? h(
      "div",
      { style: { display: "flex", justifyContent: "center", fontFamily: c.f("DM Serif Display"), fontSize: 220, lineHeight: 0.6, color: s.p.accent, height: 110 } },
      "“",
    )
    : null;

  let body: unknown;
  if (s.card) {
    const cardCtx = { ...c, text: s.card.text, muted: s.card.muted };
    body = h(
      "div",
      {
        style: {
          display: "flex", flexDirection: "column", gap: 36, padding: "56px 58px",
          backgroundColor: s.card.bg, border: `${s.card.shadow?.includes("0 #") ? 4 : 2}px solid ${s.card.border}`,
          borderRadius: s.card.radius, ...(s.card.shadow ? { boxShadow: s.card.shadow } : {}),
        },
      },
      contentBlock(cardCtx, slide, { scale: 0.88, gap: 32, width: inner - 116 }),
    );
  } else {
    body = contentBlock(c, slide);
  }

  return stage(
    h, s, slide.kind,
    progressBar(c),
    layer(
      h,
      { padding: `${PAD_Y}px ${PAD_X}px` },
      header(c),
      h(
        "div",
        { style: { display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", alignItems: centered ? "center" : "stretch", gap: 30 } },
        quoteMark,
        body,
      ),
      footer(c),
    ),
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
  const s = styleFor(brand, h);
  const f = options.fontFamily ?? ((family: string) => family);
  const kind: SlideKind = total === 1 ? "single" : slide.kind;
  const c: Ctx = { h, s, brand, f, index, total, text: s.p.text, muted: s.p.muted };
  const normalized: Slide = { ...slide, kind };
  if (s.photo) return photoSlide(c, normalized);
  if (brand.template === "split") return splitSlide(c, normalized);
  return standardSlide(c, normalized);
}

const FONT_WEIGHTS: Record<string, number[]> = {
  Inter: [500, 600, 700, 800],
  "Plus Jakarta Sans": [500, 700, 800],
  "Space Grotesk": [500, 700],
  "Space Mono": [400, 700],
  Sora: [500, 700, 800],
  Outfit: [500, 700, 800],
  "DM Serif Display": [400],
  "Playfair Display": [800],
  Fraunces: [800],
  "Archivo Black": [400],
  "Bricolage Grotesque": [500, 700, 800],
  Manrope: [500, 700, 800],
};

/** Fonts (family + weight) a template needs, for renderers that load fonts explicitly. */
export function fontsFor(template: TemplateId): { family: string; weight: number }[] {
  const s = styleFor({ name: "", handle: null, primary: "#6D28D9", accent: null, template, logo: null, cta: null });
  const families = new Set([s.headingFont, s.bodyFont, s.labelFont, "Inter"]);
  if (s.headingFont === "DM Serif Display") families.add("DM Serif Display");
  return [...families].flatMap((family) => (FONT_WEIGHTS[family] ?? [500]).map((weight) => ({ family, weight })));
}

export const SAMPLE_SLIDES: Slide[] = [
  {
    kind: "cover",
    eyebrow: "Social media",
    heading: "3 habits of brands that ==grow every week==",
    body: "Small, repeatable moves that compound. Save this for your next planning session.",
    bullets: null,
  },
  {
    kind: "content",
    eyebrow: "01",
    heading: "Post at the same ==time== every day",
    body: null,
    bullets: [
      "Pick one slot and protect it",
      "Batch a week of posts on Monday",
      "Reply to comments in the first hour",
    ],
  },
  {
    kind: "cta",
    eyebrow: "Your move",
    heading: "Save this and plan your ==next 7 days==",
    body: "Follow for one practical idea a day.",
    bullets: null,
  },
];
