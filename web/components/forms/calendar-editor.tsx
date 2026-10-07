"use client";

import { ChevronDown, Clapperboard, Image as ImageIcon, Moon, Rows3, Wand2 } from "lucide-react";
import { useState } from "react";
import { Button, Input, Segmented, Textarea } from "@/components/ui";
import { SYNCV_CALENDAR } from "@/lib/presets";
import type { CalendarSlot, SlotFormat } from "@/lib/types";
import { cn, WEEKDAYS } from "@/lib/utils";

export function CalendarEditor({
  value,
  onChange,
}: {
  value: CalendarSlot[];
  onChange: (slots: CalendarSlot[]) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const update = (weekday: number, patch: Partial<CalendarSlot>) =>
    onChange(value.map((s) => (s.weekday === weekday ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/20 bg-brand/[0.07] px-4 py-3">
        <p className="text-sm text-ink-soft">
          <span className="font-medium text-ink">Running SynCV?</span> Load the weekly calendar you already use.
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={() => onChange(SYNCV_CALENDAR)}>
          <Wand2 className="size-3.5" /> Load SynCV calendar
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line">
        {value.map((slot) => {
          const rest = slot.format === "none";
          const expanded = open === slot.weekday;
          return (
            <div key={slot.weekday} className="border-b border-line bg-white/[0.015] last:border-b-0">
              <div className="grid items-center gap-3 p-3 sm:grid-cols-[110px_auto_1fr_1.2fr_auto] sm:p-3.5">
                <div className="text-sm font-semibold">{WEEKDAYS[slot.weekday - 1]}</div>
                <Segmented<SlotFormat>
                  value={slot.format}
                  onChange={(format) => update(slot.weekday, { format })}
                  options={[
                    { value: "carousel", label: <><Rows3 className="size-3.5" /> Carousel</> },
                    { value: "image", label: <><ImageIcon className="size-3.5" /> Image</> },
                    { value: "none", label: <><Moon className="size-3.5" /> Rest</> },
                  ]}
                />
                <Input
                  aria-label={`${WEEKDAYS[slot.weekday - 1]} content pillar`}
                  placeholder={rest ? "Rest day" : "Content pillar, e.g. Resume Carousel"}
                  value={slot.theme}
                  disabled={rest}
                  onChange={(e) => update(slot.weekday, { theme: e.target.value })}
                />
                <Input
                  aria-label={`${WEEKDAYS[slot.weekday - 1]} brief`}
                  placeholder={rest ? "No post generated" : "Brief, e.g. Detailed resume advice"}
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
                  <span className="sm:hidden lg:inline">Reminders</span>
                  <ChevronDown className={cn("size-3.5 transition", expanded && "rotate-180")} />
                </button>
              </div>
              {expanded && (
                <div className="px-3.5 pb-3.5 sm:pl-[126px]">
                  <Textarea
                    className="min-h-20 text-[13px]"
                    placeholder="Other content planned for this day (videos, stories…). Included as a reminder in that day’s email — not auto-generated."
                    value={slot.other_content}
                    onChange={(e) => update(slot.weekday, { other_content: e.target.value })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-ink-mute">
        Carousels and images are generated and emailed to you automatically. Video plans you add under “Reminders”
        show up in that day&apos;s email so nothing slips.
      </p>
    </div>
  );
}
