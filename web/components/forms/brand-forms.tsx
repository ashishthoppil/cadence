"use client";

import { Field, Input, Segmented, TagInput, Textarea } from "@/components/ui";
import { TONE_SUGGESTIONS } from "@/lib/presets";
import type { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Draft = Partial<Workspace>;
interface FormProps {
  value: Draft;
  onChange: (patch: Draft) => void;
}

export function BrandForm({ value, onChange }: FormProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Brand name">
        {(id) => (
          <Input
            id={id}
            required
            placeholder="SynCV"
            value={value.brand_name ?? ""}
            onChange={(e) => onChange({ brand_name: e.target.value })}
          />
        )}
      </Field>
      <Field label="Website" optional>
        {(id) => (
          <Input
            id={id}
            type="url"
            placeholder="https://syncv.app"
            value={value.website ?? ""}
            onChange={(e) => onChange({ website: e.target.value })}
          />
        )}
      </Field>
      <Field label="Social handle" hint="Printed in the corner of every slide." optional>
        {(id) => (
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-mute">@</span>
            <Input
              id={id}
              className="pl-8"
              placeholder="syncv.app"
              value={value.handle ?? ""}
              onChange={(e) => onChange({ handle: e.target.value.replace(/^@/, "") })}
            />
          </div>
        )}
      </Field>
      <Field label="Spelling">
        {() => (
          <Segmented<"en-GB" | "en-US">
            value={value.language ?? "en-GB"}
            onChange={(language) => onChange({ language })}
            options={[
              { value: "en-GB", label: "British English" },
              { value: "en-US", label: "American English" },
            ]}
          />
        )}
      </Field>
      <Field label="What do you do?" className="sm:col-span-2" hint="One or two sentences, like you'd say it to a customer.">
        {(id) => (
          <Textarea
            id={id}
            required
            placeholder="We tailor your existing resume to any job description in one click…"
            value={value.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        )}
      </Field>
      <Field
        label="Product features to showcase"
        className="sm:col-span-2"
        hint="Used on feature days. Separate with commas."
        optional
      >
        {(id) => (
          <Textarea
            id={id}
            className="min-h-20"
            placeholder="Resume scoring, one-click optimisation, cover letters"
            value={value.products ?? ""}
            onChange={(e) => onChange({ products: e.target.value })}
          />
        )}
      </Field>
    </div>
  );
}

export function VoiceForm({ value, onChange }: FormProps) {
  const tone = value.tone ?? "";
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Who are you talking to?" className="sm:col-span-2">
        {(id) => (
          <Textarea
            id={id}
            required
            className="min-h-20"
            placeholder="Job seekers and career switchers applying online, including remote roles"
            value={value.audience ?? ""}
            onChange={(e) => onChange({ audience: e.target.value })}
          />
        )}
      </Field>
      <Field label="Voice & tone" className="sm:col-span-2">
        {(id) => (
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {TONE_SUGGESTIONS.map((t) => {
                const active = tone.toLowerCase().includes(t.toLowerCase());
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      onChange({
                        tone: active
                          ? tone.replace(new RegExp(`,?\\s*${t}`, "i"), "").replace(/^,\s*/, "")
                          : tone
                          ? `${tone}, ${t}`
                          : t,
                      })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      active
                        ? "border-brand/40 bg-brand/15 text-brand-soft"
                        : "border-line text-ink-mute hover:border-line-strong hover:text-ink-soft",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <Textarea
              id={id}
              className="min-h-20"
              placeholder="Friendly expert recruiter: practical, encouraging, direct. No corporate jargon."
              value={tone}
              onChange={(e) => onChange({ tone: e.target.value })}
            />
          </div>
        )}
      </Field>
      <Field
        label="Call to action"
        className="sm:col-span-2"
        hint="Shown as a button on the last slide and woven into captions."
      >
        {(id) => (
          <Input
            id={id}
            placeholder="Tailor your resume to any job in one click at syncv.app"
            value={value.cta ?? ""}
            onChange={(e) => onChange({ cta: e.target.value })}
          />
        )}
      </Field>
      <Field label="Always add on LinkedIn" hint="Branded hashtags added to every post." optional>
        {() => (
          <TagInput
            value={value.linkedin_hashtags ?? []}
            onChange={(linkedin_hashtags) => onChange({ linkedin_hashtags })}
            placeholder="SynCV"
          />
        )}
      </Field>
      <Field label="Always add on Instagram" optional>
        {() => (
          <TagInput
            value={value.instagram_hashtags ?? []}
            onChange={(instagram_hashtags) => onChange({ instagram_hashtags })}
            placeholder="syncv"
          />
        )}
      </Field>
      <Field label="Avoid" className="sm:col-span-2" hint="Words, claims or topics the AI must never use." optional>
        {(id) => (
          <Input
            id={id}
            placeholder="Guarantees of getting hired, made-up statistics"
            value={value.avoid ?? ""}
            onChange={(e) => onChange({ avoid: e.target.value })}
          />
        )}
      </Field>
    </div>
  );
}
