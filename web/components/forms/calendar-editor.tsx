"use client";

import { ChevronDown, Clapperboard, Film, Image as ImageIcon, Lock, Moon, Rows3, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, Input, Segmented, Textarea } from "@/components/ui";
import { businessPreset } from "@/lib/presets";
import type { BusinessType, CalendarSlot, SlotFormat } from "@/lib/types";
import { cn, WEEKDAYS } from "@/lib/utils";

export function CalendarEditor({
  value,
  onChange,
  businessType,
  videoAllowed,
}: {
  value: CalendarSlot[];
  onChange: (slots: CalendarSlot[]) => void;
  businessType?: BusinessType;
  /** Whether the current plan includes video posts. */
  videoAllowed: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const preset = businessPreset(businessType);
  const update = (weekday: number, patch: Partial<CalendarSlot>) =>
    onChange(value.map((s) => (s.weekday === weekday ? { ...s, ...patch } : s)));
  const usesVideo = value.some((s) => s.format === "video");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/20 bg-brand/[0.07] px-4 py-3">
        <p className="text-sm text-ink-soft">
          <span className="font-medium text-ink">Not sure where to start?</span> Use a week planned for{" "}
          {preset.label.toLowerCase()}.
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={() => onChange(preset.calendar)}>
          <Wand2 className="size-3.5" /> Use starter calendar
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line">
        {value.map((slot) => {
          const rest = slot.format === "none";
          const expanded = open === slot.weekday;
          return (
            <div key={slot.weekday} className="border-b border-line bg-tint/[0.015] last:border-b-0">
              <div className="grid items-center gap-3 p-3 sm:grid-cols-[100px_auto_1fr_1.2fr_auto] sm:p-3.5">
                <div className="text-sm font-semibold">{WEEKDAYS[slot.weekday - 1]}</div>
                <div className="no-scrollbar overflow-x-auto">
                  <Segmented<SlotFormat>
                    value={slot.format}
                    onChange={(format) => update(slot.weekday, { format })}
                    options={[
                      { value: "carousel", label: <><Rows3 className="size-3.5" /> Carousel</> },
                      { value: "image", label: <><ImageIcon className="size-3.5" /> Image</> },
                      {
                        value: "video",
                        label: <>{videoAllowed ? <Film className="size-3.5" /> : <Lock className="size-3" />} Video</>,
                      },
                      { value: "none", label: <><Moon className="size-3.5" /> Rest</> },
                    ]}
                  />
                </div>
                <Input
                  aria-label={`${WEEKDAYS[slot.weekday - 1]} content pillar`}
                  placeholder={rest ? "Rest day" : "Content pillar, e.g. How-to"}
                  value={slot.theme}
                  disabled={rest}
                  onChange={(e) => update(slot.weekday, { theme: e.target.value })}
                />
                <Input
                  aria-label={`${WEEKDAYS[slot.weekday - 1]} brief`}
                  placeholder={rest ? "No post generated" : "Brief, e.g. A practical guide for beginners"}
                  value={slot.brief}
                  disabled={rest}
                  onChange={(e) => update(slot.weekday, { brief: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : slot.weekday)}
                  className={cn(
                    "flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition",
                    slot.other_content ? "text-brand-soft" : "text-ink-mute hover:text-ink-soft",
                  )}
                  aria-expanded={expanded}
                >
                  <Clapperboard className="size-4" />
                  <span className="sm:hidden lg:inline">Notes</span>
                  <ChevronDown className={cn("size-3.5 transition", expanded && "rotate-180")} />
                </button>
              </div>
              {expanded && (
                <div className="px-3.5 pb-3.5 sm:pl-[116px]">
                  <Textarea
                    className="min-h-20 text-[13px]"
                    placeholder="Anything else planned for this day (a live session, a launch, stories). It appears as a reminder in that day's email."
                    value={slot.other_content}
                    onChange={(e) => update(slot.weekday, { other_content: e.target.value })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {usesVideo && !videoAllowed && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-amber-700 dark:text-amber-200">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Video days need the Image + Videos plan. Until then, those days get a carousel instead.{" "}
            <Link href="/dashboard/billing" className="font-semibold underline underline-offset-2">
              See plans
            </Link>
          </span>
        </p>
      )}
      <p className="text-xs text-ink-mute">
        Each day&apos;s post is generated at your scheduled time and emailed to you with captions for every platform you
        picked.
      </p>
    </div>
  );
}
