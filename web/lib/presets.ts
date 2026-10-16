import type { TemplateId } from "./slide-templates";
import type { BusinessType, CalendarSlot, Platform, VisualSource } from "./types";

export const EMPTY_CALENDAR: CalendarSlot[] = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
  weekday,
  format: weekday === 7 ? "none" : "carousel",
  theme: "",
  brief: "",
  other_content: "",
}));

type Day = [CalendarSlot["format"], string, string];

function calendar(days: Day[]): CalendarSlot[] {
  return days.map(([format, theme, brief], i) => ({ weekday: i + 1, format, theme, brief, other_content: "" }));
}

export interface BusinessPreset {
  id: BusinessType;
  label: string;
  description: string;
  examples: string;
  /** Example answers shown as placeholders in the brand and voice forms. */
  hints: Record<"description" | "products" | "audience" | "tone" | "cta" | "avoid", string>;
  visual: VisualSource;
  template: TemplateId;
  platforms: Platform[];
  calendar: CalendarSlot[];
}

export const BUSINESS_TYPES: BusinessPreset[] = [
  {
    id: "saas",
    label: "Software or app",
    description: "Teach, show workflows, build trust",
    examples: "SaaS, AI tools, mobile apps",
    hints: {
      description: "We help freelancers send invoices and get paid on time, without the admin.",
      products: "Automatic payment reminders, recurring invoices, expense receipts by photo",
      audience: "Freelancers and small agency owners who'd rather do the work than the admin",
      tone: "Calm, practical and direct. Like a helpful accountant friend. No jargon.",
      cta: "Start your free trial at northwind.co",
      avoid: "Tax advice, guarantees, competitor names",
    },
    visual: "none",
    template: "midnight",
    platforms: ["linkedin", "instagram"],
    calendar: calendar([
      ["carousel", "How-to", "A practical guide your customers can use today"],
      ["image", "Quick tip", "One useful tip in a single image"],
      ["carousel", "Product feature", "Show one feature and the problem it solves"],
      ["carousel", "Mistakes to avoid", "Common mistakes in your field and how to fix them"],
      ["video", "Behind the scenes", "A short clip about how the product helps"],
      ["image", "Insight", "A short, shareable insight"],
      ["none", "", ""],
    ]),
  },
  {
    id: "ecommerce",
    label: "Products & e-commerce",
    description: "Show the product, how it's used, why it's worth it",
    examples: "Skincare, apparel, food, gadgets",
    hints: {
      description: "We make gentle, fragrance-free skincare for sensitive skin.",
      products: "Daily moisturiser, vitamin C serum, mineral sunscreen SPF 50",
      audience: "Busy people with sensitive skin who want a short routine that works",
      tone: "Warm, reassuring and honest. Simple words, no hype.",
      cta: "Shop the routine at halo.skin",
      avoid: "Medical claims, before-and-after promises, competitor names",
    },
    visual: "uploads",
    template: "photo-full",
    platforms: ["instagram", "facebook", "tiktok"],
    calendar: calendar([
      ["carousel", "Product spotlight", "One product, its benefits and who it's for"],
      ["video", "Product in action", "A short clip of the product being used"],
      ["image", "Tip", "A tip related to the product category"],
      ["carousel", "How to use", "Step-by-step guide to getting the most from the product"],
      ["image", "Social proof", "Why customers love it, without invented quotes"],
      ["video", "Lifestyle moment", "The product in an everyday moment"],
      ["none", "", ""],
    ]),
  },
  {
    id: "services",
    label: "Services & agency",
    description: "Show expertise, process and outcomes",
    examples: "Agencies, consultants, freelancers",
    hints: {
      description: "We design and build websites for small businesses that want more enquiries.",
      products: "Website design, SEO audits, monthly care plans",
      audience: "Owners of small service businesses who need a website that brings in work",
      tone: "Confident and practical. Show the process, skip the buzzwords.",
      cta: "Book a free 20-minute call at northwind.studio",
      avoid: "Guaranteed rankings, client names without permission",
    },
    visual: "none",
    template: "paper",
    platforms: ["linkedin", "instagram"],
    calendar: calendar([
      ["carousel", "Expert guide", "A practical framework from your field"],
      ["image", "Quick win", "One action a client can take this week"],
      ["carousel", "Process", "How you approach a common client problem"],
      ["carousel", "Myths", "A common myth in your industry and the truth"],
      ["image", "Insight", "A short, shareable insight"],
      ["none", "", ""],
      ["none", "", ""],
    ]),
  },
  {
    id: "creator",
    label: "Creator or personal brand",
    description: "Share what you know in your own voice",
    examples: "Coaches, writers, founders",
    hints: {
      description: "I help first-time managers lead with confidence through short, practical lessons.",
      products: "Weekly newsletter, 1:1 coaching, leadership workshop",
      audience: "New managers in tech who were promoted for their skills, not their leadership",
      tone: "Honest, warm and direct. First person, like talking to a friend.",
      cta: "Join 5,000 readers of my weekly newsletter",
      avoid: "Politics, naming former employers",
    },
    visual: "none",
    template: "editorial",
    platforms: ["linkedin", "instagram", "x"],
    calendar: calendar([
      ["carousel", "Lesson", "A lesson learned, told as practical steps"],
      ["image", "Thought", "One opinion or observation in a single image"],
      ["carousel", "Framework", "A simple framework people can save"],
      ["video", "Story", "A short visual story about the topic"],
      ["image", "Quote-style insight", "A memorable one-line insight"],
      ["carousel", "Weekly roundup", "Three useful ideas from the week"],
      ["none", "", ""],
    ]),
  },
  {
    id: "local",
    label: "Local business",
    description: "Feel neighbourly, give reasons to visit",
    examples: "Cafés, salons, gyms, clinics",
    hints: {
      description: "A neighbourhood coffee shop roasting our own beans since 2015.",
      products: "Single-origin pour-overs, fresh pastries, weekend brunch",
      audience: "Locals within a few miles who want a friendly place to work or catch up",
      tone: "Friendly, cosy and a little playful. Feels like a regular's welcome.",
      cta: "Visit us on Market Street, open 7am to 6pm",
      avoid: "Discounts we aren't running, health claims",
    },
    visual: "uploads",
    template: "photo-card",
    platforms: ["instagram", "facebook"],
    calendar: calendar([
      ["image", "This week", "What's on or new this week"],
      ["carousel", "Tips", "Helpful tips related to what you offer"],
      ["video", "Behind the counter", "A short clip from the place itself"],
      ["image", "Offer or highlight", "A product or service worth trying"],
      ["carousel", "Guide", "A simple guide your customers will save"],
      ["image", "Weekend", "A warm weekend post"],
      ["none", "", ""],
    ]),
  },
  {
    id: "education",
    label: "Education & coaching",
    description: "Teach one clear idea at a time",
    examples: "Courses, tutors, coaches",
    hints: {
      description: "Online IELTS coaching that helps students reach band 7 and above.",
      products: "Speaking mock tests, writing feedback, 6-week crash course",
      audience: "Students and professionals preparing for IELTS to study or work abroad",
      tone: "Encouraging and clear. One idea at a time, with examples.",
      cta: "Book a free level test at northwind.academy",
      avoid: "Guaranteed scores, visa advice",
    },
    visual: "none",
    template: "notebook",
    platforms: ["instagram", "linkedin"],
    calendar: calendar([
      ["carousel", "Lesson", "One concept explained step by step"],
      ["image", "Quick tip", "A tip learners can use today"],
      ["carousel", "Common mistakes", "Mistakes learners make and how to fix them"],
      ["video", "Explainer", "A short visual explainer"],
      ["carousel", "Checklist", "A checklist people will save"],
      ["image", "Motivation", "A practical, grounded encouragement"],
      ["none", "", ""],
    ]),
  },
  {
    id: "other",
    label: "Something else",
    description: "Practical, useful posts for any business",
    examples: "Non-profits, communities, anything else",
    hints: {
      description: "We connect volunteers with local food banks across the city.",
      products: "Volunteer sign-ups, donation drives, community events",
      audience: "People who want to give back locally but don't know where to start",
      tone: "Warm, hopeful and clear. Real stories over statistics.",
      cta: "Sign up to volunteer at northwind.org",
      avoid: "Political topics, naming people we help",
    },
    visual: "none",
    template: "midnight",
    platforms: ["linkedin", "instagram"],
    calendar: calendar([
      ["carousel", "Guide", "A practical guide for your audience"],
      ["image", "Tip", "One useful tip"],
      ["carousel", "Explainer", "Explain something your audience asks about"],
      ["carousel", "Mistakes to avoid", "Common mistakes and how to fix them"],
      ["image", "Insight", "A short, shareable insight"],
      ["none", "", ""],
      ["none", "", ""],
    ]),
  },
];

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
  { id: "tiktok", label: "TikTok" },
];

export const VISUAL_SOURCES: { id: VisualSource; label: string; description: string }[] = [
  { id: "none", label: "Text-first designs", description: "Bold typographic slides. Great for tips, guides and education." },
  { id: "uploads", label: "My own photos", description: "Upload product or brand photos and we design posts around them." },
  { id: "stock", label: "Stock photos", description: "We find a matching professional photo for each post." },
];

export const TONE_SUGGESTIONS = ["Friendly expert", "Bold & punchy", "Calm & premium", "Witty", "Data-driven", "Warm mentor"];

export const MODELS = [
  { id: "", label: "Default (server setting)" },
  { id: "gpt-5", label: "GPT-5: best writing" },
  { id: "gpt-5-mini", label: "GPT-5 mini: fast and cheap" },
];

export function businessPreset(id: BusinessType | undefined) {
  return BUSINESS_TYPES.find((b) => b.id === id) ?? BUSINESS_TYPES[BUSINESS_TYPES.length - 1];
}
