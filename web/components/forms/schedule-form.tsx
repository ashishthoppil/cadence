"use client";

import { CalendarClock } from "lucide-react";
import { useMemo } from "react";
import { Field, Input, Select, Switch } from "@/components/ui";
import type { CalendarSlot } from "@/lib/types";
import { browserTimezone, formatClock, minutesOf, WEEKDAYS, zonedNow } from "@/lib/utils";
import type { Draft } from "./brand-forms";

const TIMES = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, "0");
  const m = String((i % 4) * 15).padStart(2, "0");
  return `${h}:${m}`;
});

function timezones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC"];
  }
}

/** Describe when the next post will be generated, mirroring the scheduler. */
export function nextRun(timezone: string, generateAt: string, slots: CalendarSlot[]) {
  const now = zonedNow(timezone);
  const due = minutesOf(generateAt);
  for (let offset = 0; offset < 8; offset++) {
    const weekday = ((now.weekday - 1 + offset) % 7) + 1;
    if (offset === 0 && now.minutes >= due) continue;
    const slot = slots.find((s) => s.weekday === weekday);
    if (!slot || slot.format === "none") continue;
    const day = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : WEEKDAYS[weekday - 1];
    return { label: `${day} at ${formatClock(generateAt)}`, slot, offset, minutesUntil: offset * 1440 + due - now.minutes };
  }
  return null;
}

export function ScheduleForm({
  value,
  onChange,
  slots,
  showPause,
}: {
  value: Draft;
  onChange: (patch: Draft) => void;
  slots: CalendarSlot[];
  showPause?: boolean;
}) {
  const zones = useMemo(() => timezones(), []);
  const timezone = value.timezone || browserTimezone();
  const at = (value.generate_at ?? "17:00").slice(0, 5);
  const next = nextRun(timezone, at, slots);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Send each day's post to"
          className="sm:col-span-2"
          hint="The slides arrive attached, with ready-to-paste captions for LinkedIn and Instagram."
        >
          {(id) => (
            <Input
              id={id}
              type="email"
              required
              placeholder="you@company.com"
              value={value.approval_email ?? ""}
              onChange={(e) => onChange({ approval_email: e.target.value })}
            />
          )}
        </Field>
        <Field label="Generate every day at">
          {(id) => (
            <Select id={id} value={at} onChange={(e) => onChange({ generate_at: e.target.value })}>
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {formatClock(t)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Timezone">
          {(id) => (
            <Select id={id} value={timezone} onChange={(e) => onChange({ timezone: e.target.value })}>
              {(zones.includes(timezone) ? zones : [timezone, ...zones]).map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-line bg-white/[0.02] p-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15">
          <CalendarClock className="size-4 text-brand-soft" />
        </div>
        <div className="text-sm">
          {value.paused ? (
            <p className="text-ink-soft">The schedule is paused. No posts will be generated until you resume it.</p>
          ) : next ? (
            <>
              <p className="font-medium">Next post: {next.label}</p>
              <p className="mt-0.5 text-ink-mute">
                {next.slot.theme || "Untitled pillar"} · {next.slot.format === "image" ? "single image" : "carousel"}
              </p>
            </>
          ) : (
            <p className="text-ink-soft">Every day is a rest day — add a carousel or image to your calendar.</p>
          )}
        </div>
      </div>

      {showPause && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4">
          <div>
            <p className="text-sm font-medium">Pause the schedule</p>
            <p className="text-xs text-ink-mute">Stop daily generation without losing your settings.</p>
          </div>
          <Switch checked={!!value.paused} onChange={(paused) => onChange({ paused })} label="Pause schedule" />
        </div>
      )}
    </div>
  );
}
