"use client";

import { BrandForm, VoiceForm } from "@/components/forms/brand-forms";
import { LookForm } from "@/components/forms/look-form";
import { SaveBar } from "@/components/save-bar";
import { useWorkspaceDraft } from "@/components/workspace-draft";
import { Card, SectionHeading } from "@/components/ui";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-6 md:p-8">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 mb-6 text-sm text-ink-mute">{description}</p>
      {children}
    </Card>
  );
}

export default function BrandPage() {
  const { workspace, draft, patch, dirty, saving, save, reset } = useWorkspaceDraft();

  return (
    <div className="space-y-6 pb-24">
      <SectionHeading title="Brand & design" description="Everything the AI and the slide designer know about you." />
      <Section title="Brand" description="What you do and what to showcase.">
        <BrandForm value={draft} onChange={patch} />
      </Section>
      <Section title="Audience & voice" description="Who the posts speak to, and how.">
        <VoiceForm value={draft} onChange={patch} />
      </Section>
      <Section title="Look & feel" description="Slide style, colours, typeface and logo.">
        <LookForm value={draft} onChange={patch} workspaceId={workspace?.id} />
      </Section>
      <SaveBar
        dirty={dirty}
        saving={saving}
        onReset={reset}
        onSave={() => save((d) => (!d.brand_name?.trim() ? "Brand name is required" : null))}
      />
    </div>
  );
}
