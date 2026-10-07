"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarEditor } from "@/components/forms/calendar-editor";
import { SaveBar } from "@/components/save-bar";
import { useWorkspace } from "@/components/workspace-provider";
import { SectionHeading } from "@/components/ui";
import type { CalendarSlot } from "@/lib/types";

export default function CalendarPage() {
  const { slots, saveSlots } = useWorkspace();
  const [draft, setDraft] = useState<CalendarSlot[]>(slots);
  const [saved, setSaved] = useState(slots);
  const [saving, setSaving] = useState(false);

  if (saved !== slots) {
    setSaved(slots);
    setDraft(slots);
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(slots);

  async function save() {
    setSaving(true);
    try {
      await saveSlots(draft);
      toast.success("Calendar saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <SectionHeading
        title="Weekly calendar"
        description="What Cadence creates each day. Changes apply from the next scheduled run."
      />
      <CalendarEditor value={draft} onChange={setDraft} />
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(slots)} />
    </div>
  );
}
