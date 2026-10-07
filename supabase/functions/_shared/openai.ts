import { env } from "./env.ts";
import type { CalendarSlot, Workspace } from "./db.ts";
import type { Slide } from "./slide-templates.ts";
import { WEEKDAY_NAMES } from "./time.ts";

export interface GeneratedContent {
  title: string;
  slides: Slide[];
  linkedin: { caption: string; hashtags: string[] };
  instagram: { caption: string; hashtags: string[] };
  alt_text: string;
}

const nullableString = { type: ["string", "null"] };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "slides", "linkedin", "instagram", "alt_text"],
  properties: {
    title: { type: "string", description: "Short internal title for the post (max 70 characters)." },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "eyebrow", "heading", "body", "bullets"],
        properties: {
          kind: { type: "string", enum: ["cover", "content", "cta", "single"] },
          eyebrow: nullableString,
          heading: { type: "string" },
          body: nullableString,
          bullets: { type: ["array", "null"], items: { type: "string" } },
        },
      },
    },
    linkedin: {
      type: "object",
      additionalProperties: false,
      required: ["caption", "hashtags"],
      properties: {
        caption: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } },
      },
    },
    instagram: {
      type: "object",
      additionalProperties: false,
      required: ["caption", "hashtags"],
      properties: {
        caption: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } },
      },
    },
    alt_text: { type: "string", description: "Accessible description of the visual(s), max 400 characters." },
  },
};

function line(label: string, value: string | null | undefined) {
  return value?.trim() ? `${label}: ${value.trim()}` : null;
}

function buildPrompt(
  w: Workspace,
  slot: Pick<CalendarSlot, "format" | "theme" | "brief" | "weekday">,
  recentTitles: string[],
  feedback: string | null,
) {
  const english = w.language === "en-US" ? "American English" : "British English";
  const isCarousel = slot.format === "carousel";
  const slideCount = isCarousel ? w.carousel_length : 1;

  const system = [
    `You are the head of social content for ${w.brand_name}. You write scroll-stopping, genuinely useful`,
    `LinkedIn and Instagram posts that earn saves, shares and comments, and you optimise every caption for`,
    `search on both platforms (LinkedIn search and Instagram keyword search) without sounding robotic.`,
    `Write in ${english}. Be specific and concrete: real numbers, real examples, real phrasing.`,
    `Never invent statistics or studies; when in doubt, give practical advice instead of a figure.`,
  ].join(" ");

  const brand = [
    line("Brand", w.brand_name),
    line("Website", w.website),
    line("What it is", w.description),
    line("Product features worth showing", w.products),
    line("Audience", w.audience),
    line("Voice & tone", w.tone),
    line("Call to action", w.cta),
    line("Instagram/LinkedIn handle", w.handle),
    line("Never say / avoid", w.avoid),
  ].filter(Boolean).join("\n");

  const visual = isCarousel
    ? `FORMAT: a ${slideCount}-slide carousel (1080×1350).
- Slide 1 kind "cover": a hook that promises a specific payoff. heading ≤ 60 characters. eyebrow = 1–3 word category label (e.g. "Resume tips"). body = optional one-line subtitle ≤ 110 characters.
- Slides 2 to ${slideCount - 1} kind "content": one idea per slide, in a logical sequence. eyebrow = step number like "01", "02" (or a 1–2 word label). heading ≤ 55 characters. Then EITHER body (≤ 170 characters) OR 2–4 bullets (each ≤ 60 characters) — or a one-line body plus up to 3 bullets.
- Slide ${slideCount} kind "cta": a closing slide that tells people to save/share/follow. heading ≤ 55 characters, body ≤ 100 characters. The brand's call to action is printed automatically under it, so don't repeat it.`
    : `FORMAT: a single image post (1080×1350), exactly 1 slide with kind "single".
- eyebrow = 1–3 word category label. heading = the one actionable idea, ≤ 70 characters. body ≤ 160 characters and/or up to 3 bullets ≤ 60 characters each.`;

  const rules = `SLIDE TEXT RULES
- In every heading, wrap the 1–3 most important words in ==double equals== to highlight them, e.g. "Stop listing ==duties==".
- No emoji, hashtags or URLs on slides. Short, punchy, skimmable. Sentence case.
- Each slide must make sense on its own and push the reader to the next.

CAPTION RULES
- LinkedIn caption: first line is a hook under 140 characters (it shows before "see more"). Then short paragraphs with line breaks, the key takeaways, and end with a question that invites comments plus a soft call to action. 700–1,300 characters. Professional, human, no hashtags in the caption text. Max 2 emoji.
- Instagram caption: first line is a keyword-rich hook. Then a skimmable version of the value with line breaks, a "save this / share with a friend" prompt and the call to action. 500–1,200 characters. Emoji allowed sparingly. No hashtags in the caption text.
- Weave the main search keywords naturally into both captions (e.g. "resume tips", "job search", "interview questions").
- Hashtags: return them WITHOUT the # sign. LinkedIn: 3–5 relevant hashtags mixing broad and niche. Instagram: 10–15 hashtags mixing broad, mid-size and niche. No banned or spammy tags.
- alt_text: describe what the slides show and say, for screen-reader users.`;

  const today = [
    `TODAY: ${WEEKDAY_NAMES[slot.weekday]}`,
    line("Content pillar", slot.theme),
    line("What this slot is for", slot.brief),
  ].filter(Boolean).join("\n");

  const avoid = recentTitles.length
    ? `RECENTLY POSTED — pick a clearly different angle and topic:\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
    : "";

  const revision = feedback?.trim()
    ? `THE REVIEWER REJECTED THE PREVIOUS VERSION. Their feedback: "${feedback.trim()}". Apply it.`
    : "";

  const user = [brand, today, visual, rules, avoid, revision].filter(Boolean).join("\n\n");
  return { system, user, slideCount };
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

/** Make sure the model's slides fit the layout we render. */
function normaliseSlides(slides: Slide[], count: number, carousel: boolean): Slide[] {
  if (!carousel) {
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

export async function generateContent(
  w: Workspace,
  slot: Pick<CalendarSlot, "format" | "theme" | "brief" | "weekday">,
  recentTitles: string[],
  feedback: string | null,
): Promise<GeneratedContent & { model: string }> {
  const { system, user, slideCount } = buildPrompt(w, slot, recentTitles, feedback);
  const model = w.ai_model || env.openaiModel;
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
      response_format: { type: "json_schema", json_schema: { name: "social_post", strict: true, schema: SCHEMA } },
      ...(reasoning ? { reasoning_effort: "low" } : { temperature: 0.8 }),
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  const message = data.choices?.[0]?.message;
  if (message?.refusal) throw new Error(`OpenAI refused: ${message.refusal}`);
  const parsed = JSON.parse(message?.content ?? "{}") as GeneratedContent;

  const slides = normaliseSlides(parsed.slides ?? [], slideCount, slot.format === "carousel");
  if (!slides.length || !slides[0].heading) throw new Error("OpenAI returned no slides");

  return {
    model,
    title: (parsed.title || slides[0].heading).replace(/==/g, "").slice(0, 120),
    slides,
    linkedin: {
      caption: parsed.linkedin.caption.trim(),
      hashtags: cleanTags(parsed.linkedin.hashtags, w.linkedin_hashtags, 6),
    },
    instagram: {
      caption: parsed.instagram.caption.trim(),
      hashtags: cleanTags(parsed.instagram.hashtags, w.instagram_hashtags, 25),
    },
    alt_text: (parsed.alt_text || "").slice(0, 1000),
  };
}
