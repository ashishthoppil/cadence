"use client";

import { Check, ImageIcon, Images, Type } from "lucide-react";
import { PlatformIcon } from "@/components/post-bits";
import { Field, Input, Segmented, TagInput, Textarea } from "@/components/ui";
import { BUSINESS_TYPES, businessPreset, PLATFORMS, TONE_SUGGESTIONS, VISUAL_SOURCES } from "@/lib/presets";
import type { Platform, VisualSource, Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Draft = Partial<Workspace>;
interface FormProps {
  value: Draft;
  onChange: (patch: Draft) => void;
}

const VISUAL_ICONS: Record<VisualSource, typeof Type> = { none: Type, uploads: ImageIcon, stock: Images };

function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative flex h-full flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition",
        selected ? "border-brand/60 bg-brand/10 ring-4 ring-brand/10" : "border-line hover:border-line-strong hover:bg-tint/[0.02]",
      )}
    >
      {selected && (
        <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-brand text-white">
          <Check className="size-3" />
        </span>
      )}
      {icon}
      <span className="pr-6 text-sm font-semibold">{title}</span>
      <span className="text-xs leading-relaxed text-ink-mute">{description}</span>
    </button>
  );
}

/** Step 1: who the business is, where it posts and what its posts look like. */
export function BusinessForm({ value, onChange }: FormProps) {
  const platforms = value.platforms ?? [];
  const toggle = (p: Platform) =>
    onChange({ platforms: platforms.includes(p) ? platforms.filter((x) => x !== p) : [...platforms, p] });

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Business or brand name">
          {(id) => (
            <Input id={id} required placeholder="Northwind" value={value.brand_name ?? ""} onChange={(e) => onChange({ brand_name: e.target.value })} />
          )}
        </Field>
        <Field label="Website" optional>
          {(id) => (
            <Input id={id} type="url" placeholder="https://northwind.co" value={value.website ?? ""} onChange={(e) => onChange({ website: e.target.value })} />
          )}
        </Field>
      </div>

      <div className="space-y-2.5">
        <p className="text-[13px] font-medium text-ink-soft">What kind of business is it?</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_TYPES.map((b) => (
            <ChoiceCard
              key={b.id}
              selected={value.business_type === b.id}
              onClick={() => onChange({ business_type: b.id })}
              title={b.label}
              description={`${b.description}. ${b.examples}.`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-[13px] font-medium text-ink-soft">Where do you post?</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const on = platforms.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(p.id)}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition",
                  on ? "border-brand/60 bg-brand/10 text-ink" : "border-line text-ink-soft hover:border-line-strong",
                )}
              >
                <PlatformIcon provider={p.id} />
                {p.label}
                {on && <Check className="size-3.5 text-brand-soft" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-mute">Each post comes with a caption and hashtags written for every platform you pick.</p>
      </div>

      <div className="space-y-2.5">
        <p className="text-[13px] font-medium text-ink-soft">What should your posts look like?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {VISUAL_SOURCES.map((v) => {
            const Icon = VISUAL_ICONS[v.id];
            return (
              <ChoiceCard
                key={v.id}
                selected={(value.visual_source ?? "none") === v.id}
                onClick={() => onChange({ visual_source: v.id })}
                title={v.label}
                description={v.description}
                icon={<Icon className="mb-1 size-5 text-brand-soft" />}
              />
            );
          })}
        </div>
        <p className="text-xs text-ink-mute">
          Product brands usually pick their own photos. You can switch any time, and change the design per brand later.
        </p>
      </div>
    </div>
  );
}

/** Step 2: what the business does and how it appears on slides. */
export function BrandForm({ value, onChange }: FormProps) {
  const { hints } = businessPreset(value.business_type);
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="What do you do?" className="sm:col-span-2" hint="One or two sentences, the way you'd explain it to a customer.">
        {(id) => (
          <Textarea
            id={id}
            required
            placeholder={hints.description}
            value={value.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        )}
      </Field>
      <Field label="Products, services or features to feature" className="sm:col-span-2" hint="Separate with commas. Posts never claim features you don't list." optional>
        {(id) => (
          <Textarea
            id={id}
            className="min-h-20"
            placeholder={hints.products}
            value={value.products ?? ""}
            onChange={(e) => onChange({ products: e.target.value })}
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
              placeholder="northwind.co"
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
    </div>
  );
}

export function VoiceForm({ value, onChange }: FormProps) {
  const tone = value.tone ?? "";
  const { hints } = businessPreset(value.business_type);
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Who are you talking to?" className="sm:col-span-2">
        {(id) => (
          <Textarea
            id={id}
            required
            className="min-h-20"
            placeholder={hints.audience}
            value={value.audience ?? ""}
            onChange={(e) => onChange({ audience: e.target.value })}
          />
        )}
      </Field>
      <Field label="Voice and tone" className="sm:col-span-2">
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
              placeholder={hints.tone}
              value={tone}
              onChange={(e) => onChange({ tone: e.target.value })}
            />
          </div>
        )}
      </Field>
      <Field label="Call to action" className="sm:col-span-2" hint="Shown as a button on the last slide and woven into captions.">
        {(id) => (
          <Input
            id={id}
            placeholder={hints.cta}
            value={value.cta ?? ""}
            onChange={(e) => onChange({ cta: e.target.value })}
          />
        )}
      </Field>
      <Field label="Always-on hashtags" hint="Your branded hashtags, added on every platform." optional>
        {() => (
          <TagInput value={value.brand_hashtags ?? []} onChange={(brand_hashtags) => onChange({ brand_hashtags })} placeholder="Northwind" />
        )}
      </Field>
      <Field label="Avoid" hint="Words, claims or topics the AI must never use." optional>
        {(id) => (
          <Input
            id={id}
            placeholder={hints.avoid}
            value={value.avoid ?? ""}
            onChange={(e) => onChange({ avoid: e.target.value })}
          />
        )}
      </Field>
    </div>
  );
}
