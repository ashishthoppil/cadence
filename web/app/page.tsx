import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileStack,
  Hash,
  MailCheck,
  Palette,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { HeroVisual, ThemeShowcase } from "@/components/landing/hero-visual";
import { Reveal } from "@/components/landing/reveal";
import { Logo } from "@/components/logo";
import { PlatformIcon } from "@/components/post-bits";
import { ButtonLink } from "@/components/ui";

const steps = [
  {
    time: "5:00 PM",
    icon: CalendarDays,
    title: "Reads today's slot",
    body: "Monday is resume advice, Tuesday a job-search hack — Cadence picks up the pillar and brief you planned.",
  },
  {
    time: "5:01 PM",
    icon: Wand2,
    title: "Writes & designs",
    body: "OpenAI drafts a fresh carousel or image post, then it's rendered on-brand at 1080×1350.",
  },
  {
    time: "5:02 PM",
    icon: MailCheck,
    title: "Lands in your inbox",
    body: "Slides attached, plus a LinkedIn caption and an Instagram caption — each with SEO keywords and hashtags.",
  },
  {
    time: "Your call",
    icon: Send,
    title: "Post in a minute",
    body: "Save the slides, copy each caption with one tap, and post. Not quite right? Regenerate it with feedback.",
  },
];

const faqs = [
  {
    q: "Does it post for me?",
    a: "Not yet — Cadence does the writing and designing, and you stay in control of what goes out. Every evening the finished post lands in your inbox, ready to upload to LinkedIn and Instagram.",
  },
  {
    q: "What's in the email?",
    a: "The slides as attachments, a PDF of the carousel for LinkedIn, a LinkedIn caption and an Instagram caption with hashtags, and a link to a page where you can copy each caption with one tap.",
  },
  {
    q: "How are the images made?",
    a: "Text comes from OpenAI; the slides are rendered from crisp, on-brand templates (your colours, logo, font and handle). No garbled AI text in images.",
  },
  {
    q: "How do I post a carousel on LinkedIn?",
    a: "Add the PDF from the email as a document when you create the post. LinkedIn shows it as a swipeable carousel — the format that gets the most reach for educational content.",
  },
  {
    q: "Can I change the time or skip a day?",
    a: "Yes. Pick any time in your own timezone, mark days as rest days, or pause the schedule whenever you like.",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-x-clip">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-ink-mute md:flex">
            <a href="#how" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#features" className="transition hover:text-ink">
              Features
            </a>
            <a href="#faq" className="transition hover:text-ink">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </ButtonLink>
            <ButtonLink href="/login?mode=signup" variant="white" size="sm">
              Get started
            </ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-24 text-center sm:px-6 md:pt-28">
          <div className="animate-fade-up">
            <a
              href="#how"
              className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pr-3 pl-1 text-[13px] text-ink-soft backdrop-blur transition hover:border-white/20"
            >
              <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-semibold text-brand-soft">New</span>
              Daily carousels for LinkedIn &amp; Instagram
              <ArrowRight className="size-3.5" />
            </a>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "90ms" }}>
            <h1 className="mx-auto mt-7 max-w-4xl text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl md:text-7xl">
              <span className="text-gradient">Your content calendar,</span>
              <br />
              <span className="text-gradient">posted on cadence.</span>
            </h1>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "140ms" }}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
              Every evening Cadence writes and designs a post from your weekly plan and emails it to you — slides
              attached, SEO-ready captions for LinkedIn and Instagram inside. All that&apos;s left is to hit post.
            </p>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "190ms" }}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/login?mode=signup" size="lg">
                Set up my autopilot <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="#how" size="lg" variant="secondary">
                See how it works
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-ink-mute">Takes about 5 minutes · Nothing goes out without you</p>
          </div>

          <div className="mt-16 md:mt-20">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative scroll-mt-20 border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-soft">How it works</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">From plan to ready-to-post, before dinner.</h2>
            <p className="mt-4 text-ink-soft">
              Tell Cadence about your brand and your weekly content pillars once. After that, your only job is to
              click a button.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07}>
                <div className="group relative h-full rounded-2xl border border-line bg-panel/60 p-6 transition hover:border-white/15 hover:bg-panel">
                  <div className="flex items-center justify-between">
                    <div className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                      <s.icon className="size-5 text-brand-soft" />
                    </div>
                    <span className="font-mono text-xs text-ink-mute">{s.time}</span>
                  </div>
                  <h3 className="mt-6 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mute">{s.body}</p>
                  {i < steps.length - 1 && (
                    <ArrowRight className="absolute top-1/2 -right-3.5 z-10 hidden size-5 -translate-y-1/2 text-white/20 md:block" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-soft">Features</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Everything a content team does. Daily.</h2>
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            <Reveal className="md:col-span-4">
              <div className="h-full rounded-2xl border border-line bg-panel/60 p-7">
                <CalendarDays className="size-5 text-brand-soft" />
                <h3 className="mt-4 text-lg font-semibold">Built around your weekly calendar</h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-mute">
                  Set a pillar, format and brief for each day — carousel, single image or rest day. Cadence remembers
                  what it posted recently so it never repeats itself.
                </p>
                <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-[11px]">
                  {[
                    ["Mon", "Resume", "Carousel"],
                    ["Tue", "Job hack", "Image"],
                    ["Wed", "Educate", "Carousel"],
                    ["Thu", "Interview", "Carousel"],
                    ["Fri", "Remote", "Carousel"],
                    ["Sat", "Career", "Image"],
                    ["Sun", "Rest", "—"],
                  ].map(([d, t, f]) => (
                    <div
                      key={d}
                      className={`rounded-lg border p-2 ${f === "—" ? "border-dashed border-white/10 text-ink-mute" : "border-white/10 bg-white/[0.03]"}`}
                    >
                      <div className="font-semibold text-ink-soft">{d}</div>
                      <div className="mt-1 truncate text-ink-mute">{t}</div>
                      <div className={`mt-1.5 truncate rounded px-1 py-0.5 ${f === "Carousel" ? "bg-brand/15 text-brand-soft" : f === "Image" ? "bg-sky-500/10 text-sky-300" : ""}`}>
                        {f}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={0.05}>
              <div className="h-full rounded-2xl border border-line bg-panel/60 p-7">
                <MailCheck className="size-5 text-brand-soft" />
                <h3 className="mt-4 text-lg font-semibold">Ready in your inbox</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">
                  Slides attached, captions inside. Open the post page on your phone to save the slides and copy each
                  caption in one tap.
                </p>
                <div className="mt-6 space-y-2">
                  {["Open post page", "Copy caption", "Regenerate"].map((label, i) => (
                    <div
                      key={label}
                      className={`rounded-lg px-3 py-2 text-center text-[13px] font-medium ${i === 0 ? "bg-brand text-white" : "border border-line text-ink-soft"}`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2">
              <div className="h-full rounded-2xl border border-line bg-panel/60 p-7">
                <Hash className="size-5 text-brand-soft" />
                <h3 className="mt-4 text-lg font-semibold">SEO captions, per platform</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">
                  A hook under LinkedIn&apos;s “see more” cut, keyword-rich Instagram captions, and hashtag sets sized
                  for each network.
                </p>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={0.05}>
              <div className="h-full rounded-2xl border border-line bg-panel/60 p-7">
                <FileStack className="size-5 text-brand-soft" />
                <h3 className="mt-4 text-lg font-semibold">Carousels for both</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">
                  Every carousel comes as numbered slides for Instagram and a PDF that LinkedIn shows as a swipeable
                  document — up to 10 slides.
                </p>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={0.1}>
              <div className="h-full rounded-2xl border border-line bg-panel/60 p-7">
                <RefreshCw className="size-5 text-brand-soft" />
                <h3 className="mt-4 text-lg font-semibold">Regenerate with feedback</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">
                  “Make it punchier” or “focus on graduates” — tell it what to change and a new version lands in your
                  inbox a minute later.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Themes */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Palette className="mx-auto size-5 text-brand-soft" />
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">Looks like your brand. Every single day.</h2>
            <p className="mt-4 text-ink-soft">
              Three slide systems, your colours, your logo and your handle — previewed live while you set it up.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-14">
            <ThemeShowcase />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-white/[0.06] py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <p className="text-sm font-semibold text-brand-soft">FAQ</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Questions, answered.</h2>
          </Reveal>
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium">
                  {f.q}
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/10 text-ink-mute transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-sm leading-relaxed text-ink-mute">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1430] to-panel px-6 py-16 text-center md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(139_92_246/0.35),transparent_60%)]" />
            <div className="relative">
              <Sparkles className="mx-auto size-6 text-brand-soft" />
              <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
                Tomorrow at 5 PM, your post writes itself.
              </h2>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-ink-soft">
                {["Slides + captions daily", "LinkedIn + Instagram", "Your brand, your voice"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-400" /> {t}
                  </span>
                ))}
              </div>
              <ButtonLink href="/login?mode=signup" size="lg" variant="white" className="mt-9">
                Get started <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-mute sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <PlatformIcon provider="linkedin" />
            <PlatformIcon provider="instagram" />
            <span>Built on Supabase, OpenAI &amp; Resend</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
