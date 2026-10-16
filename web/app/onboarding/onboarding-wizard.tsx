"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BrandForm, BusinessForm, type Draft, VoiceForm } from "@/components/forms/brand-forms";
import { CalendarEditor } from "@/components/forms/calendar-editor";
import { LookForm } from "@/components/forms/look-form";
import { ScheduleForm } from "@/components/forms/schedule-form";
import { Logo } from "@/components/logo";
import { MediaLibrary, useMediaLibrary } from "@/components/media-library";
import { PlanPicker } from "@/components/plan-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui";
import { type Currency, FREE_POSTS, type PlanId } from "@/lib/plans";
import { businessPreset } from "@/lib/presets";
import { invoke } from "@/lib/supabase/client";
import type { CalendarSlot } from "@/lib/types";
import { browserTimezone, cn } from "@/lib/utils";
import { pickEditable } from "@/lib/workspace";

type StepId = "business" | "brand" | "voice" | "calendar" | "photos" | "look" | "schedule" | "plan";

const STEP_INFO: Record<StepId, { title: string; description: string }> = {
  business: { title: "Your business", description: "So every post fits what you do and where you post." },
  brand: { title: "What you offer", description: "The AI writes everything from this, so be specific." },
  voice: { title: "Audience & voice", description: "Who you're talking to and how you sound." },
  calendar: { title: "Weekly calendar", description: "What to post each day: carousel, image or video." },
  photos: { title: "Your photos", description: "Product and brand photos to design posts around." },
  look: { title: "Look & feel", description: "Pick a template and make it yours. The preview is live." },
  schedule: { title: "Schedule & delivery", description: "When posts are made and where they're sent." },
  plan: { title: "Choose a plan", description: `Start free with ${FREE_POSTS} posts, or pick a plan now.` },
};

export function OnboardingWizard() {
  const router = useRouter();
  const { user, workspace, slots, loading, saveWorkspace, saveSlots } = useWorkspace();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [calendar, setCalendar] = useState<CalendarSlot[]>(slots);
  const [calendarTouched, setCalendarTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [buying, setBuying] = useState<PlanId | null>(null);
  const [ready, setReady] = useState(false);
  const library = useMediaLibrary(workspace?.id);

  // Seed the form once the workspace has loaded.
  if (!loading && !ready) {
    setReady(true);
    setDraft({
      language: "en-GB",
      template: "midnight",
      primary_color: "#6D28D9",
      carousel_length: 7,
      generate_at: "17:00",
      timezone: browserTimezone(),
      approval_email: user?.email ?? "",
      brand_hashtags: [],
      platforms: ["linkedin", "instagram"],
      visual_source: "none",
      ...(workspace ?? {}),
    });
    setCalendar(slots);
    setCalendarTouched(!!workspace);
  }

  const steps: StepId[] = [
    "business", "brand", "voice", "calendar",
    ...(draft.visual_source === "uploads" ? (["photos"] as StepId[]) : []),
    "look", "schedule", "plan",
  ];
  const current = steps[Math.min(step, steps.length - 1)];

  function patch(p: Draft) {
    // Picking a business type pre-fills sensible defaults the user can still change.
    if (p.business_type && p.business_type !== draft.business_type) {
      const preset = businessPreset(p.business_type);
      p = { ...p, template: preset.template, visual_source: preset.visual, platforms: preset.platforms };
      if (!calendarTouched) setCalendar(preset.calendar);
    }
    setDraft((d) => ({ ...d, ...p }));
  }

  function validate(): string | null {
    if (current === "business") {
      if (!draft.brand_name?.trim()) return "Add your business name.";
      if (!draft.business_type) return "Pick the kind of business you run.";
      if (!draft.platforms?.length) return "Pick at least one platform.";
    }
    if (current === "brand" && !draft.description?.trim()) return "Tell us what you do.";
    if (current === "voice" && !draft.audience?.trim()) return "Tell us who your audience is.";
    if (current === "calendar" && calendar.every((s) => s.format === "none")) return "Plan at least one day.";
    if (current === "schedule" && !/^\S+@\S+\.\S+$/.test(draft.approval_email ?? "")) {
      return "Enter the email your daily posts should go to.";
    }
    return null;
  }

  async function finish() {
    await saveWorkspace({ ...pickEditable(draft), onboarded_at: new Date().toISOString() });
  }

  async function next() {
    const problem = validate();
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      if (current === "calendar") await saveSlots(calendar);
      else if (current !== "photos" && current !== "plan") await saveWorkspace(pickEditable(draft));
      if (current === "plan") {
        await finish();
        router.replace("/dashboard?welcome=1");
        return;
      }
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function buy(plan: PlanId, currency: Currency) {
    setBuying(plan);
    try {
      await finish();
      const { url } = await invoke<{ url: string }>("billing", { action: "checkout", plan, currency });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout");
      setBuying(null);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  const wide = current === "look" || current === "calendar" || current === "plan" || current === "business";

  return (
    <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
      <aside className="border-b border-line bg-panel/60 px-6 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 lg:py-8">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle className="lg:hidden" />
        </div>
        <ol className="mt-10 hidden space-y-1 lg:block">
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    active ? "bg-tint/[0.06] text-ink" : done ? "text-ink-soft hover:bg-tint/[0.03]" : "text-ink-mute",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                      done ? "border-brand bg-brand text-white" : active ? "border-brand/60 text-brand-soft" : "border-line text-ink-mute",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  {STEP_INFO[s].title}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-auto hidden lg:block">
          <ThemeToggle />
        </div>
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-tint/[0.06] lg:hidden">
          <div className="h-full bg-brand transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </aside>

      <main className="px-4 py-8 sm:px-8 lg:px-14 lg:py-14">
        <div className={cn("mx-auto", wide ? "max-w-5xl" : "max-w-3xl")}>
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-wider text-brand-soft uppercase">
              Step {step + 1} of {steps.length}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{STEP_INFO[current].title}</h1>
            <p className="mt-1.5 text-ink-mute">{STEP_INFO[current].description}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              {current === "business" && <BusinessForm value={draft} onChange={patch} />}
              {current === "brand" && <BrandForm value={draft} onChange={patch} />}
              {current === "voice" && <VoiceForm value={draft} onChange={patch} />}
              {current === "calendar" && (
                <CalendarEditor
                  value={calendar}
                  onChange={(c) => {
                    setCalendar(c);
                    setCalendarTouched(true);
                  }}
                  businessType={draft.business_type}
                  videoAllowed={false}
                />
              )}
              {current === "photos" && <MediaLibrary workspaceId={workspace?.id} library={library} />}
              {current === "look" && (
                <LookForm value={draft} onChange={patch} workspaceId={workspace?.id} photos={library.assets.map((a) => a.url)} />
              )}
              {current === "schedule" && <ScheduleForm value={draft} onChange={patch} slots={calendar} />}
              {current === "plan" && <PlanPicker mode="app" current="free" busy={buying} onSelect={buy} />}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button onClick={next} loading={saving} size="lg" variant={current === "plan" ? "secondary" : "primary"}>
              {current === "plan" ? `Start with ${FREE_POSTS} free posts` : "Continue"}
              {!saving && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
