"use client";

import { ScheduleForm } from "@/components/forms/schedule-form";
import { SaveBar } from "@/components/save-bar";
import { useWorkspaceDraft } from "@/components/workspace-draft";
import { useWorkspace } from "@/components/workspace-provider";
import { Card, Field, SectionHeading, Select } from "@/components/ui";
import { MODELS } from "@/lib/presets";

export function SettingsView() {
  const { slots } = useWorkspace();
  const { draft, patch, dirty, saving, save, reset } = useWorkspaceDraft();

  return (
    <div className="space-y-6 pb-24">
      <SectionHeading title="Settings" description="When posts are generated, where they're sent, and how they're written." />

      <Card className="p-6 md:p-8">
        <h2 className="mb-6 font-semibold">Schedule & delivery</h2>
        <ScheduleForm value={draft} onChange={patch} slots={slots} showPause />
      </Card>

      <Card className="p-6 md:p-8">
        <h2 className="mb-6 font-semibold">Generation</h2>
        <Field label="AI model" hint="Which OpenAI model writes your posts. GPT-5 writes best; mini is faster and cheaper.">
          {(id) => (
            <Select id={id} value={draft.ai_model ?? ""} onChange={(e) => patch({ ai_model: e.target.value || null })}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </Card>

      <SaveBar
        dirty={dirty}
        saving={saving}
        onReset={reset}
        onSave={() =>
          save((d) => (/^\S+@\S+\.\S+$/.test(d.approval_email ?? "") ? null : "Enter a valid email address"))}
      />
    </div>
  );
}
