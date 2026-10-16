// Copywriting: a writer pass drafts the post, an editor pass checks every sentence.
import { env } from "./env.ts";
import type { CalendarSlot, Captions, MediaAsset, Platform, PostFormat, Workspace } from "./db.ts";
import type { Slide } from "./slide-templates.ts";
import { WEEKDAY_NAMES } from "./time.ts";

export interface DraftSlide extends Omit<Slide, "image"> {
  photo_query?: string | null;
  asset_id?: string | null;
}

export interface GeneratedContent {
  title: string;
  slides: DraftSlide[];
  video: { concept: string; prompt: string; asset_id: string | null } | null;
  captions: Captions;
  alt_text: string;
  model: string;
}

// ---------------------------------------------------------------------------
// House style

const BANNED = [
  "unlock", "unleash", "elevate", "game-changer", "game changer", "level up", "supercharge", "dive into", "delve",
  "fast-paced world", "in today's world", "navigate the", "landscape", "leverage", "revolutionise", "revolutionize",
  "seamless", "cutting-edge", "harness", "empower", "journey", "secret sauce", "here's the thing", "let's dive in",
  "in conclusion", "it's important to note", "not just", "whether you're", "look no further", "take it to the next level",
];

const PLATFORM_GUIDE: Record<Platform, { name: string; guide: string; tags: [number, number] }> = {
  linkedin: {
    name: "LinkedIn",
    tags: [3, 5],
    guide:
      "First line is a specific hook under 140 characters (it shows before \"see more\"). Then short paragraphs separated by blank lines with the key takeaways, and a closing question that invites comments plus a soft call to action. 700 to 1,300 characters. Professional and human. At most 2 emoji.",
  },
  instagram: {
    name: "Instagram",
    tags: [8, 15],
    guide:
      "First line is a keyword-rich hook (Instagram search reads captions). Then a skimmable version of the value with line breaks, a \"save this\" or \"share with someone who needs it\" prompt, and the call to action. 400 to 1,100 characters. Emoji allowed sparingly.",
  },
  facebook: {
    name: "Facebook",
    tags: [1, 3],
    guide:
      "Conversational and warm. A hook, two or three short paragraphs, and a question that invites replies. 300 to 700 characters.",
  },
  x: {
    name: "X",
    tags: [1, 2],
    guide: "One punchy, self-contained post. At most 230 characters before hashtags. No thread, no emoji spam.",
  },
  tiktok: {
    name: "TikTok",
    tags: [3, 6],
    guide: "A one-line hook with searchable keywords, then one or two short lines. 120 to 300 characters.",
  },
};

const BUSINESS_HINT: Record<string, string> = {
  saas: "a software product, so posts teach, show workflows and earn trust",
  ecommerce: "physical products, so posts show the product, how it's used and why it's worth buying",
  services: "a service business, so posts show expertise, process and client outcomes",
  creator: "a personal brand, so posts sound like one person sharing what they know",
  local: "a local business, so posts feel neighbourly and give reasons to visit",
  education: "education or coaching, so posts teach one clear idea at a time",
  other: "a business that wants practical, useful posts",
};

/** Plain-words name for a brand colour ("deep red-brown"); AI models follow words better than hex codes. */
function colourName(hex: string | null | undefined): string | null {
  const m = hex?.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (sat < 0.12) return l < 0.2 ? "near-black" : l > 0.85 ? "off-white" : l < 0.5 ? "charcoal grey" : "light grey";
  let hue = 0;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue = (hue * 60 + 360) % 360;
  const names: [number, string][] = [
    [15, "red"], [35, "red-orange"], [50, "orange"], [65, "amber"], [80, "yellow"], [150, "green"], [185, "teal"],
    [200, "cyan"], [240, "blue"], [265, "indigo"], [290, "violet"], [330, "magenta"], [360, "red"],
  ];
  let name = names.find(([max]) => hue < max)?.[1] ?? "red";
  if ((name === "red" || name === "red-orange" || name === "orange") && l < 0.3) name = "red-brown";
  const tone = l < 0.25 ? "deep " : l < 0.4 ? "rich " : l > 0.75 ? "pale " : l > 0.6 ? "soft " : "";
  return `${tone}${sat < 0.35 ? "muted " : ""}${name}`;
}

function line(label: string, value: string | null | undefined) {
  return value?.trim() ? `${label}: ${value.trim()}` : null;
}

function languageName(w: Workspace) {
  return w.language === "en-US" ? "American English" : "British English";
}

const STYLE_RULES = (w: Workspace) => `WRITING RULES (apply to every word)
- Write in plain ${languageName(w)}. Short sentences, active voice, everyday words. Sound like a sharp human expert, not a marketer.
- Every sentence must be complete, grammatical and make sense on its own. Each one must follow logically from the one before. If a sentence is vague or could be cut without losing meaning, cut it.
- Be concrete: specific actions, examples, numbers written as digits. Never invent statistics, studies, quotes, prices, awards or product features that aren't in the brief.
- Never use em dashes or en dashes. Use a full stop, comma or colon instead. Use a hyphen only inside compound words like "60-second".
- Never use these words or phrases: ${BANNED.join(", ")}.
- No rhetorical clickbait ("You won't believe"), no ALL CAPS words, no exclamation marks on slides.`;

function brandBlock(w: Workspace) {
  return [
    line("Brand", w.brand_name),
    line("Website", w.website),
    `Business: ${BUSINESS_HINT[w.business_type] ?? BUSINESS_HINT.other}`,
    line("What it does", w.description),
    line("Products, services or features to feature", w.products),
    line("Audience", w.audience),
    line("Voice and tone", w.tone),
    line("Call to action", w.cta),
    line("Never say or claim", w.avoid),
  ].filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------
// JSON schema (built per workspace: chosen platforms, visuals, format)

const nullableString = { type: ["string", "null"] };

function schemaFor(platforms: Platform[], format: PostFormat, visual: Workspace["visual_source"]) {
  const captionProps = Object.fromEntries(
    platforms.map((p) => [
      p,
      {
        type: "object",
        additionalProperties: false,
        required: ["caption", "hashtags"],
        properties: { caption: { type: "string" }, hashtags: { type: "array", items: { type: "string" } } },
      },
    ]),
  );
  const slideProps: Record<string, unknown> = {
    kind: { type: "string", enum: ["cover", "content", "cta", "single"] },
    eyebrow: nullableString,
    heading: { type: "string" },
    body: nullableString,
    bullets: { type: ["array", "null"], items: { type: "string" } },
  };
  if (visual === "stock") slideProps.photo_query = nullableString;
  if (visual === "uploads") slideProps.asset_id = nullableString;

  const properties: Record<string, unknown> = {
    title: { type: "string" },
    captions: { type: "object", additionalProperties: false, required: platforms, properties: captionProps },
    alt_text: { type: "string" },
  };
  if (format === "video") {
    properties.video = {
      type: "object",
      additionalProperties: false,
      required: ["concept", "prompt", "asset_id"],
      properties: { concept: { type: "string" }, prompt: { type: "string" }, asset_id: nullableString },
    };
  } else {
    properties.slides = {
      type: "array",
      items: { type: "object", additionalProperties: false, required: Object.keys(slideProps), properties: slideProps },
    };
  }
  return { type: "object", additionalProperties: false, required: Object.keys(properties), properties };
}

// ---------------------------------------------------------------------------
// Prompts

function slidesBrief(w: Workspace, format: PostFormat) {
  if (format === "image") {
    return `FORMAT: one single-image post (1080x1350), exactly 1 slide with kind "single".
- eyebrow: a 1 to 3 word category label.
- heading: the one idea, at most 70 characters.
- body: at most 160 characters, and/or up to 3 bullets of at most 60 characters each.`;
  }
  const n = w.carousel_length;
  return `FORMAT: a ${n}-slide carousel (1080x1350 each) that reads as one clear argument from start to finish.
- Slide 1, kind "cover": a hook that promises a specific, believable payoff. heading at most 60 characters. eyebrow: a 1 to 3 word category label. body: optional subtitle, at most 110 characters.
- Slides 2 to ${n - 1}, kind "content": one idea per slide, in a logical order, each building on the last. eyebrow: the step number ("01", "02", ...). heading at most 55 characters. Then EITHER a body of at most 170 characters OR 2 to 4 bullets of at most 60 characters each, or a one-line body plus up to 3 bullets.
- Slide ${n}, kind "cta": a closing slide that asks people to save, share or follow. heading at most 55 characters, body at most 100 characters. The brand's call to action is added automatically below it, so don't repeat it.`;
}

function visualsBrief(w: Workspace, assets: MediaAsset[], format: PostFormat) {
  if (format === "video") return "";
  if (w.visual_source === "stock") {
    return `PHOTOS: each slide can have a stock photo behind or beside the text. For every slide give "photo_query": a 2 to 5 word search for a real photograph that fits that slide (concrete subjects and settings, e.g. "barista pouring latte art", "laptop on wooden desk morning light"). Never ask for text, logos, screenshots or specific brands. Use null only for slides where a photo would distract. The cover must have one.`;
  }
  if (w.visual_source === "uploads" && assets.length) {
    const list = assets.map((a) => `- ${a.id}: ${a.description || "photo (no description)"}`).join("\n");
    return `PHOTOS: the brand uploaded these photos. For every slide set "asset_id" to the best-matching photo id, or null if none fits. Prefer variety across slides. The cover must have one.\n${list}`;
  }
  if (w.visual_source === "uploads") return `PHOTOS: no photos uploaded yet. Set every "asset_id" to null.`;
  return "";
}

function videoBrief(w: Workspace, assets: MediaAsset[]) {
  const colours = [colourName(w.primary_color), colourName(w.accent_color)].filter(Boolean).join(" and ");
  const assetList = w.visual_source === "uploads" && assets.length
    ? `\nThe brand uploaded these product/brand photos. If one should appear in the video, set "asset_id" to its id and write the prompt so that exact product stays the hero (same shape, colours and label). Otherwise null.\n${assets.map((a) => `- ${a.id}: ${a.description || "photo"}`).join("\n")}`
    : `\nSet "asset_id" to null.`;
  return `FORMAT: one short vertical video (9:16, about 8 seconds) for Reels, Shorts and TikTok, plus captions.
- "concept": one sentence describing the idea of the video.
- "prompt": a production-ready prompt for an AI video model, 120 to 220 words, written as vivid present-tense direction. It must cover, in this order:
  1. Shot plan: either "a single continuous shot" or 2 to 3 shots with timecodes like [0-3s], [3-6s], [6-8s].
  2. Subject and action: exactly what we see and what happens, in concrete physical detail.
  3. Setting and props.
  4. Camera: framing (close-up, medium, wide), lens feel (e.g. 35mm, macro), movement (slow push-in, gentle handheld, orbit, top-down).
  5. Lighting and colour: e.g. soft morning window light, warm practicals; weave in the brand colours (${colours || "the brand palette"}) naturally through props, backgrounds or light.
  6. Mood and pacing.
  7. Audio: music style and tempo, ambient sound effects. No dialogue and no voiceover.
  8. Style: photorealistic, premium commercial look, natural skin and hands.
  9. End with: "No on-screen text, captions, logos or watermarks. No recognisable real people."
- The video should hook in the first second and make sense without sound.${assetList}`;
}

function buildPrompt(
  w: Workspace,
  slot: Pick<CalendarSlot, "theme" | "brief" | "weekday">,
  format: PostFormat,
  assets: MediaAsset[],
  recentTitles: string[],
  feedback: string | null,
) {
  const system = `You are the senior social media writer for ${w.brand_name}. You turn a content plan into posts people stop for, save and share. You care about clarity above everything: no sentence leaves your desk unless it is true, specific and easy to understand.`;

  const today = [
    `TODAY: ${WEEKDAY_NAMES[slot.weekday]}`,
    line("Content pillar", slot.theme) ?? "Content pillar: the brand's most useful everyday advice",
    line("Brief", slot.brief),
  ].filter(Boolean).join("\n");

  const slideRules = format === "video" ? "" : `SLIDE TEXT
- In every heading, wrap the 1 to 3 most important consecutive words in ==double equals==, e.g. "Stop listing ==duties==". Exactly one pair per heading, around a meaningful phrase, never filler words.
- No emoji, hashtags or URLs on slides. Sentence case. Each slide must make sense alone and lead naturally to the next.`;

  const captions = `CAPTIONS (one per platform; tailor each, don't copy-paste)
${w.platforms.map((p) => `- ${PLATFORM_GUIDE[p].name} ("${p}"): ${PLATFORM_GUIDE[p].guide} ${PLATFORM_GUIDE[p].tags[0]} to ${PLATFORM_GUIDE[p].tags[1]} hashtags.`).join("\n")}
- Captions never contain hashtags; put them in "hashtags", without the # sign, relevant and specific (mix broad and niche). No banned or spammy tags.
- Work the main search keywords for the topic into each caption naturally.
- "alt_text": describe what the ${format === "video" ? "video shows" : "slides show and say"} for screen-reader users, at most 400 characters.
- "title": a short internal title, at most 70 characters.`;

  const avoid = recentTitles.length
    ? `RECENTLY POSTED (choose a clearly different angle and topic):\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
    : "";
  const revision = feedback?.trim() ? `THE OWNER ASKED FOR A NEW VERSION. Their feedback: "${feedback.trim()}". Follow it.` : "";

  const user = [
    brandBlock(w),
    today,
    format === "video" ? videoBrief(w, assets) : slidesBrief(w, format),
    visualsBrief(w, assets, format),
    slideRules,
    captions,
    STYLE_RULES(w),
    avoid,
    revision,
  ].filter(Boolean).join("\n\n");
  return { system, user };
}

const EDITOR_SYSTEM = `You are an exacting editor at a top content studio. You receive a draft social post as JSON and return the corrected JSON in exactly the same shape. You fix problems; you don't change the topic.`;

function editorPrompt(w: Workspace, format: PostFormat, draft: unknown) {
  return `Edit this draft. Go through it line by line and fix every problem you find:
1. Sense: any sentence that is vague, illogical, contradicts another, or doesn't make sense. Rewrite it so it is clear and true.
2. Flow: ${format === "video" ? "the video prompt must be concrete, visual and follow the shot plan." : "slides must build one argument in order with no repetition between slides; headings must be complete phrases."}
3. Grammar, spelling (${languageName(w)}), punctuation and awkward phrasing.
4. House style: no em dashes or en dashes anywhere (use full stops, commas or colons), none of these words: ${BANNED.join(", ")}. No invented facts or numbers.
5. Limits: respect every character limit from the brief. ${format === "video" ? "Describe colours in words, never as hex codes." : "Each heading has exactly one ==highlight== around 1 to 3 meaningful consecutive words. The closing (cta) slide must not repeat the brand's call to action or website; it is printed automatically below the slide."}
6. Captions: each platform's caption fits that platform's guidance (the LinkedIn caption ends with a question that invites comments), hooks in the first line, and contains no hashtags. Hashtags have no # and no spaces.
Return the full corrected JSON.

BRIEF FOR REFERENCE:
${brandBlock(w)}

${STYLE_RULES(w)}

DRAFT:
${JSON.stringify(draft)}`;
}

// ---------------------------------------------------------------------------
// OpenAI calls

async function chatJson(model: string, system: string, user: string, schema: unknown, effort: "low" | "medium") {
  const reasoning = /^(gpt-5|o\d)/.test(model);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.openaiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_schema", json_schema: { name: "social_post", strict: true, schema } },
      ...(reasoning ? { reasoning_effort: effort } : { temperature: 0.7 }),
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  const message = data.choices?.[0]?.message;
  if (message?.refusal) throw new Error(`OpenAI refused: ${message.refusal}`);
  return JSON.parse(message?.content ?? "{}");
}

/** Caption-safe cleanup: house dash rules and odd characters, emoji allowed. */
export function cleanCaption(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[‐‑‒−]/g, "-")
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1-$2")
    .replace(/\s*[–—―]\s*/g, ", ")
    .replace(/[  -  ]/g, " ")
    .replace(/[­​⁠﻿]/g, "")
    .replace(/ ,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function cleanTags(tags: string[], extra: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...extra, ...tags]) {
    const tag = raw.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "");
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out.slice(0, max);
}

/** Make sure the slides fit the layouts we render. */
function normaliseSlides(slides: DraftSlide[], count: number, format: PostFormat): DraftSlide[] {
  if (format === "image") {
    const s = slides[0] ?? { kind: "single", eyebrow: null, heading: "", body: null, bullets: null };
    return [{ ...s, kind: "single" }];
  }
  let list = slides.filter((s) => s.heading?.trim());
  if (list.length > count) list = [...list.slice(0, count - 1), list[list.length - 1]];
  return list.map((s, i) => ({
    ...s,
    kind: i === 0 ? "cover" : i === list.length - 1 ? "cta" : "content",
    bullets: s.bullets?.length ? s.bullets.slice(0, 4) : null,
  }));
}

function finalise(w: Workspace, format: PostFormat, raw: Record<string, unknown>, model: string): GeneratedContent {
  // deno-lint-ignore no-explicit-any
  const r = raw as any;
  const captions: Captions = {};
  for (const p of w.platforms) {
    const c = r.captions?.[p];
    if (!c) continue;
    const [, maxTags] = PLATFORM_GUIDE[p].tags;
    let caption = cleanCaption(String(c.caption ?? ""));
    const hashtags = cleanTags(c.hashtags ?? [], w.brand_hashtags, Math.max(maxTags, w.brand_hashtags.length));
    if (p === "x") {
      const tagText = hashtags.map((t) => `#${t}`).join(" ");
      const room = 280 - (tagText ? tagText.length + 1 : 0);
      if (caption.length > room) caption = `${caption.slice(0, room - 1).replace(/\s+\S*$/, "")}…`;
    }
    captions[p] = { caption, hashtags };
  }

  const clean = (t: string | null | undefined) => (t == null ? t ?? null : cleanCaption(t));
  const slides = format === "video"
    ? []
    : normaliseSlides(
      (r.slides ?? []).map((s: DraftSlide) => ({
        ...s,
        eyebrow: clean(s.eyebrow),
        heading: cleanCaption(s.heading ?? ""),
        body: clean(s.body),
        bullets: s.bullets?.map((b) => cleanCaption(b)) ?? null,
      })),
      w.carousel_length,
      format,
    );
  if (format !== "video" && (!slides.length || !slides[0].heading)) throw new Error("OpenAI returned no slides");
  if (format === "video" && !r.video?.prompt) throw new Error("OpenAI returned no video prompt");

  return {
    model,
    title: cleanCaption(String(r.title || slides[0]?.heading || r.video?.concept || "Today's post")).replace(/==/g, "").slice(0, 120),
    slides,
    video: format === "video"
      ? { concept: cleanCaption(r.video.concept ?? ""), prompt: cleanCaption(r.video.prompt), asset_id: r.video.asset_id ?? null }
      : null,
    captions,
    alt_text: cleanCaption(String(r.alt_text || "")).slice(0, 1000),
  };
}

export async function generateContent(
  w: Workspace,
  slot: Pick<CalendarSlot, "theme" | "brief" | "weekday">,
  format: PostFormat,
  assets: MediaAsset[],
  recentTitles: string[],
  feedback: string | null,
): Promise<GeneratedContent> {
  const model = w.ai_model || env.openaiModel;
  const schema = schemaFor(w.platforms, format, format === "video" ? "none" : w.visual_source);
  const { system, user } = buildPrompt(w, slot, format, assets, recentTitles, feedback);

  const draft = await chatJson(model, system, user, schema, "medium");
  let edited = draft;
  try {
    edited = await chatJson(model, EDITOR_SYSTEM, editorPrompt(w, format, draft), schema, "low");
  } catch (err) {
    console.warn("Editor pass failed, using the draft", err);
  }
  return finalise(w, format, edited, model);
}

/** One-line description of an uploaded photo, used to match photos to slides. */
export async function describeImage(url: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.openaiKey}` },
    body: JSON.stringify({
      model: env.openaiModel,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this brand photo in one factual sentence under 25 words for a content library: the main subject, setting and mood. No opinions.",
            },
            { type: "image_url", image_url: { url } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return cleanCaption(String(data.choices?.[0]?.message?.content ?? "")).slice(0, 300);
}
