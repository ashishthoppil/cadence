import type { CalendarSlot, Workspace } from "./types";

export const EMPTY_CALENDAR: CalendarSlot[] = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
  weekday,
  format: weekday === 7 ? "none" : "carousel",
  theme: "",
  brief: "",
  other_content: "",
}));

/** The SynCV weekly content calendar (static/carousel column automated, videos kept as reminders). */
export const SYNCV_CALENDAR: CalendarSlot[] = [
  {
    weekday: 1,
    format: "carousel",
    theme: "Resume Carousel",
    brief: "Detailed resume advice",
    other_content: "Wife video — Resume tip: resume mistakes, recruiter insights, optimisation tips",
  },
  {
    weekday: 2,
    format: "image",
    theme: "Job Search Image",
    brief: "One actionable job-search hack",
    other_content:
      "Wife video — Job search hack: smarter ways to find/apply for jobs\nAI video — Career / job search video",
  },
  {
    weekday: 3,
    format: "carousel",
    theme: "Educational Carousel",
    brief: "Career, resume or application topic",
    other_content: "Wife video — SynCV feature: resume scoring, optimisation, cover letters, etc.",
  },
  {
    weekday: 4,
    format: "carousel",
    theme: "Interview Carousel",
    brief: "Interview framework, checklist or tip",
    other_content:
      "Wife video — Interview tip: interview questions, preparation, mistakes\nAI video — Interview video: recruiter/candidate scenario",
  },
  {
    weekday: 5,
    format: "carousel",
    theme: "Remote Jobs Carousel",
    brief: "Remote job strategies, websites and mistakes",
    other_content: "Wife video — Remote job tip: finding and evaluating remote jobs\nAI video — Remote job video",
  },
  {
    weekday: 6,
    format: "image",
    theme: "Career Image",
    brief: "Short, shareable career insight",
    other_content: "Wife video — Career advice: productivity, career growth, job-search mindset",
  },
  {
    weekday: 7,
    format: "none",
    theme: "Rest",
    brief: "",
    other_content: "Wife video — SynCV feature / workflow: demonstrate a feature or a complete job-search workflow",
  },
];

export const SYNCV_BRAND: Partial<Workspace> = {
  brand_name: "SynCV",
  website: "https://syncv.app",
  description:
    "SynCV tailors your existing resume to a specific job description in one click — highlighting the experience you already have, without inventing skills or achievements.",
  products: "Resume scoring against a job description, one-click resume optimisation/tailoring, cover letter generation",
  audience: "Job seekers and career switchers applying for jobs online, including remote roles",
  tone: "Friendly expert recruiter: practical, encouraging, direct. No fluff, no corporate jargon.",
  cta: "Tailor your resume to any job in one click at syncv.app",
  handle: "syncv.app",
  language: "en-GB",
  avoid: "Guarantees of getting hired, made-up statistics, fake recruiter quotes",
  linkedin_hashtags: ["SynCV"],
  instagram_hashtags: ["syncv"],
  primary_color: "#6D28D9",
  accent_color: null,
  slide_theme: "midnight",
  slide_font: "inter",
};

export const TONE_SUGGESTIONS = [
  "Friendly expert",
  "Bold & punchy",
  "Calm & premium",
  "Witty",
  "Data-driven",
  "Warm mentor",
];

export const MODELS = [
  { id: "", label: "Default (server setting)" },
  { id: "gpt-5", label: "GPT-5 — best writing" },
  { id: "gpt-5-mini", label: "GPT-5 mini — fast & cheap" },
  { id: "gpt-4.1", label: "GPT-4.1" },
];
