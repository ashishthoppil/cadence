import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Film,
  Hash,
  LayoutTemplate,
  MailCheck,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { AudienceShowcase, HeroVisual, TemplateShowcase } from "@/components/landing/hero-visual";
import { Reveal } from "@/components/landing/reveal";
import { Logo } from "@/components/logo";
import { PlanPicker } from "@/components/plan-picker";
import { PlatformIcon } from "@/components/post-bits";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui";
import { FREE_POSTS } from "@/lib/plans";
import { PLATFORMS } from "@/lib/presets";

const steps = [
  {
    time: "Once",
    icon: CalendarDays,
    title: "Plan your week",
    body: "Tell Cadence about your business and pick a pillar and format for each day: carousel, image or video.",
  },
  {
    time: "5:00 PM",
    icon: Wand2,
    title: "We write and design",
    body: "A fresh post written from your brief, checked line by line by an AI editor, and designed in your template.",
  },
  {
    time: "5:02 PM",
    icon: MailCheck,
    title: "It lands in your inbox",
    body: "Slides or video attached, with a caption and hashtags written for each platform you use.",
  },
  {
    time: "Your call",
    icon: Send,
    title: "Post in a minute",
    body: "Save, copy, post. Not quite right? Regenerate it with one line of feedback.",
  },
];

const faqs = [
  {
    q: "Does Cadence post for me?",
    a: "Not yet. Cadence writes and designs the post, then emails it to you ready to publish, so nothing goes out without you. Uploading takes about a minute.",
  },
  {
    q: "Which platforms does it write for?",
    a: "LinkedIn, Instagram, Facebook, X and TikTok. Pick the ones you use and every post comes with a caption and hashtags tailored to each.",
  },
  {
    q: "I sell physical products. Will it work for me?",
    a: "Yes. Upload your product photos and Cadence designs posts and short videos around them. No photos yet? Use stock photos, or text-first designs.",
  },
  {
    q: "How good is the writing?",
    a: "Every post goes through two passes: a writer drafts it from your brief, then an editor checks each sentence for clarity, grammar and house style. No invented facts, no filler, no em dashes.",
  },
  {
    q: "How are the videos made?",
    a: "On the Image + Videos plan, Cadence writes a detailed shot-by-shot brief and Google's Gemini turns it into a short vertical video, ready for Reels, Shorts and TikTok.",
  },
  {
    q: "What does it cost?",
    a: `Your first ${FREE_POSTS} posts are free, no card needed. After that, Image Only is ₹1,499 or $45 a month and Image + Videos is ₹2,999 or $89 a month. Cancel any time.`,
  },
];

export default function Home() {
  return (
    <div className="relative overflow-x-clip">
      <header className="sticky top-0 z-50 border-b border-tint/[0.06] bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-ink-mute md:flex">
            <a href="#how" className="transition hover:text-ink">How it works</a>
            <a href="#templates" className="transition hover:text-ink">Templates</a>
            <a href="#pricing" className="transition hover:text-ink">Pricing</a>
            <a href="#faq" className="transition hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
              href="#pricing"
              className="mx-auto inline-flex items-center gap-2 rounded-full border border-tint/10 bg-tint/[0.04] py-1 pr-3 pl-1 text-[13px] text-ink-soft backdrop-blur transition hover:border-tint/20"
            >
              <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-semibold text-brand-soft">New</span>
              Short videos for Reels, Shorts and TikTok
              <ArrowRight className="size-3.5" />
            </a>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "90ms" }}>
            <h1 className="mx-auto mt-7 max-w-4xl text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl md:text-7xl">
              <span className="text-gradient">Your social media,</span>
              <br />
              <span className="text-gradient">written and designed daily.</span>
            </h1>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "140ms" }}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
              Cadence turns your weekly content plan into finished carousels, images and short videos, with captions
              for every platform, and emails them to you ready to post.
            </p>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "190ms" }}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/login?mode=signup" size="lg">
                Start with {FREE_POSTS} free posts <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="#pricing" size="lg" variant="secondary">
                See pricing
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-ink-mute">No card needed · Set up in about 5 minutes</p>
          </div>

          <div className="mt-16 md:mt-20">
            <HeroVisual />
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-mute">
            <span>Captions written for</span>
            {PLATFORMS.map((p) => (
              <span key={p.id} className="flex items-center gap-2 text-ink-soft">
                <PlatformIcon provider={p.id} /> {p.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative scroll-mt-20 border-t border-tint/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-soft">How it works</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">From plan to ready-to-post, every day.</h2>
            <p className="mt-4 text-ink-soft">
              Set it up once. After that, a finished post arrives in your inbox at the time you choose.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07}>
                <div className="group relative h-full rounded-2xl border border-line bg-panel/60 p-6 transition hover:border-line-strong hover:bg-panel">
                  <div className="flex items-center justify-between">
                    <div className="grid size-10 place-items-center rounded-xl border border-tint/10 bg-tint/[0.04]">
                      <s.icon className="size-5 text-brand-soft" />
                    </div>
                    <span className="font-mono text-xs text-ink-mute">{s.time}</span>
                  </div>
                  <h3 className="mt-6 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mute">{s.body}</p>
                  {i < steps.length - 1 && (
                    <ArrowRight className="absolute top-1/2 -right-3.5 z-10 hidden size-5 -translate-y-1/2 text-tint/20 md:block" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Made for your business */}
      <section className="border-t border-tint/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-soft">Made for your business</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Text-first or product-first. Your call.</h2>
            <p className="mt-4 text-ink-soft">
              Tell us what you run and Cadence adapts: educational carousels for a software brand, product-led posts and
              videos for a skincare line.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-14">
            <AudienceShowcase />
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-tint/[0.06] py-24">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-3">
          {[
            { icon: LayoutTemplate, title: "20 on-brand templates", body: "Dark, light, editorial, playful and photo-led designs, in your colours with your logo." },
            { icon: Hash, title: "Captions per platform", body: "A hook before LinkedIn's \"see more\", searchable Instagram captions, 280-character X posts, and the right hashtags for each." },
            { icon: Sparkles, title: "Writing that makes sense", body: "A writer drafts, an editor checks every sentence. Plain words, real specifics, no invented facts." },
            { icon: Film, title: "Short videos", body: "Vertical 8-second videos for Reels, Shorts and TikTok, made by Gemini from a detailed shot plan." },
            { icon: RefreshCw, title: "Regenerate with feedback", body: "“Make it punchier” or “focus on beginners”. A new version lands in your inbox a minute later." },
            { icon: MailCheck, title: "Ready to post", body: "Slides, a LinkedIn PDF carousel or a video, attached to the email with one-tap copy on your phone." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.05}>
              <div className="h-full rounded-2xl border border-line bg-panel/60 p-7">
                <f.icon className="size-5 text-brand-soft" />
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="scroll-mt-20 border-t border-tint/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-soft">Templates</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Looks like your brand. Every single day.</h2>
            <p className="mt-4 text-ink-soft">Twenty slide designs, previewed live in your colours while you set up.</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <TemplateShowcase />
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-tint/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-soft">Pricing</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Simple plans. Start free.</h2>
            <p className="mt-4 text-ink-soft">Your first {FREE_POSTS} posts are on us. Upgrade when you&apos;re happy with them.</p>
          </Reveal>
          <Reveal delay={0.05}>
            <PlanPicker mode="marketing" />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-tint/[0.06] py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <p className="text-sm font-semibold text-brand-soft">FAQ</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Questions, answered.</h2>
          </Reveal>
          <div className="divide-y divide-tint/[0.06] border-y border-tint/[0.06]">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium">
                  {f.q}
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-tint/10 text-ink-mute transition group-open:rotate-45">
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
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-tint/10 bg-gradient-to-b from-brand/15 to-panel px-6 py-16 text-center md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(139_92_246/0.3),transparent_60%)]" />
            <div className="relative">
              <Sparkles className="mx-auto size-6 text-brand-soft" />
              <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
                Tomorrow at 5 PM, your post is ready.
              </h2>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-ink-soft">
                {[`${FREE_POSTS} free posts`, "No card needed", "Cancel any time"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-500" /> {t}
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

      <footer className="border-t border-tint/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-mute sm:px-6">
          <Logo />
          <span>Cadence · Social media, on schedule.</span>
        </div>
      </footer>
    </div>
  );
}
