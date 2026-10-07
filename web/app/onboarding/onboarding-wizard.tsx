"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BrandForm, type Draft, VoiceForm } from "@/components/forms/brand-forms";
import { CalendarEditor } from "@/components/forms/calendar-editor";
import { LookForm } from "@/components/forms/look-form";
import { ScheduleForm } from "@/components/forms/schedule-form";
import { Logo } from "@/components/logo";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui";
import { SYNCV_BRAND } from "@/lib/presets";
import type { CalendarSlot } from "@/lib/types";
import { pickEditable } from "@/lib/workspace";
import { browserTimezone, cn } from "@/lib/utils";

const STEPS = [
  { id: "brand", title: "Your brand", description: "What you do — the AI writes everything from this." },
  { id: "voice", title: "Audience & voice", description: "Who you're talking to and how you sound." },
  { id: "calendar", title: "Weekly calendar", description: "The content pillar and format for each day." },
  { id: "look", title: "Look & feel", description: "How your slides look. Preview updates live." },
  { id: "schedule", title: "Schedule & delivery", description: "When posts are made and where they're sent." },
] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const { user, workspace, slots, loading, saveWorkspace, saveSlots } = useWorkspace();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [calendar, setCalendar] = useState<CalendarSlot[]>(slots);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  // Seed the form once the workspace has loaded.
  if (!loading && !ready) {
    setReady(true);
    setDraft({
      language: "en-GB",
      slide_theme: "midnight",
      slide_font: "inter",
      primary_color: "#6D28D9",
      carousel_length: 7,
      generate_at: "17:00",
      timezone: browserTimezone(),
      approval_email: user?.email ?? "",
      linkedin_hashtags: [],
      instagram_hashtags: [],
      ...(workspace ?? {}),
    });
    setCalendar(slots);
  }

  const patch = (p: Draft) => setDraft((d) => ({ ...d, ...p }));
  const current = STEPS[step];

  function validate(): string | null {
    if (current.id === "brand" && (!draft.brand_name?.trim() || !draft.description?.trim())) {
      return "Add your brand name and what you do.";
    }
    if (current.id === "voice" && !draft.audience?.trim()) return "Tell us who your audience is.";
    if (current.id === "calendar" && calendar.every((s) => s.format === "none")) {
      return "Plan at least one day with a carousel or image.";
    }
    if (current.id === "schedule" && !/^\S+@\S+\.\S+$/.test(draft.approval_email ?? "")) {
      return "Enter the email the daily posts should go to.";
    }
    return null;
  }

  async function next() {
    const problem = validate();
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      if (current.id === "calendar") await saveSlots(calendar);
      else await saveWorkspace(pickEditable(draft));
      if (step < STEPS.length - 1) {
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        await saveWorkspace({ onboarded_at: new Date().toISOString() });
        router.replace("/dashboard?welcome=1");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
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

  return (
    <div className="grid min-h-screen lg:grid-cols-[300px_1fr]">
      <aside className="border-b border-line bg-panel/60 px-6 py-6 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0 lg:py-8">
        <Logo />
        <ol className="mt-10 hidden space-y-1 lg:block">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    active ? "bg-white/[0.06] text-ink" : done ? "text-ink-soft hover:bg-white/[0.03]" : "text-ink-mute",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                      done
                        ? "border-brand bg-brand text-white"
                        : active
                        ? "border-brand/60 text-brand-soft"
                        : "border-line text-ink-mute",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/[0.06] lg:hidden">
          <div className="h-full bg-brand transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </aside>

      <main className="px-4 py-8 sm:px-8 lg:px-14 lg:py-14">
        <div className={cn("mx-auto", current.id === "look" || current.id === "calendar" ? "max-w-5xl" : "max-w-3xl")}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-brand-soft uppercase">
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{current.title}</h1>
              <p className="mt-1.5 text-ink-mute">{current.description}</p>
            </div>
            {current.id === "brand" && (
              <Button variant="secondary" size="sm" onClick={() => patch(SYNCV_BRAND)}>
                <Sparkles className="size-3.5" /> Fill in SynCV
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              {current.id === "brand" && <BrandForm value={draft} onChange={patch} />}
              {current.id === "voice" && <VoiceForm value={draft} onChange={patch} />}
              {current.id === "calendar" && <CalendarEditor value={calendar} onChange={setCalendar} />}
              {current.id === "look" && <LookForm value={draft} onChange={patch} workspaceId={workspace?.id} />}
              {current.id === "schedule" && <ScheduleForm value={draft} onChange={patch} slots={calendar} />}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button onClick={next} loading={saving} size="lg">
              {step === STEPS.length - 1 ? "Finish setup" : "Continue"}
              {!saving && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
