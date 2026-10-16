"use client";

import { BrandForm, BusinessForm, VoiceForm } from "@/components/forms/brand-forms";
import { LookForm } from "@/components/forms/look-form";
import { useMediaLibrary } from "@/components/media-library";
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
  const { assets } = useMediaLibrary(workspace?.id);

  return (
    <div className="space-y-6 pb-24">
      <SectionHeading title="Brand & design" description="Everything the writer and the designer know about you." />
      <Section title="Business" description="What you run, where you post and what your posts look like.">
        <BusinessForm value={draft} onChange={patch} />
      </Section>
      <Section title="What you offer" description="What you do and what to feature.">
        <BrandForm value={draft} onChange={patch} />
      </Section>
      <Section title="Audience & voice" description="Who the posts speak to, and how.">
        <VoiceForm value={draft} onChange={patch} />
      </Section>
      <Section title="Look & feel" description="Template, colours and logo.">
        <LookForm value={draft} onChange={patch} workspaceId={workspace?.id} photos={assets.map((a) => a.url)} />
      </Section>
      <SaveBar
        dirty={dirty}
        saving={saving}
        onReset={reset}
        onSave={() =>
          save((d) =>
            !d.brand_name?.trim() ? "Business name is required" : !d.platforms?.length ? "Pick at least one platform" : null
          )}
      />
    </div>
  );
}
