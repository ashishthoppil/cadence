"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "white";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_8px_30px_-8px_rgb(139_92_246/0.7),inset_0_1px_0_rgb(255_255_255/0.2)] hover:bg-[#7c4dff]",
  secondary: "bg-white/[0.06] text-ink border border-line hover:bg-white/[0.1] hover:border-line-strong",
  ghost: "text-ink-soft hover:text-ink hover:bg-white/[0.06]",
  danger: "bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20",
  white: "bg-white text-black hover:bg-white/90 shadow-[0_8px_30px_-10px_rgb(255_255_255/0.5)]",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  loading,
  className,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

const field =
  "w-full rounded-xl border border-line bg-white/[0.03] px-3.5 text-sm text-ink placeholder:text-ink-mute/70 transition focus:border-brand/60 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-brand/15";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-24 resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(field, "h-10 appearance-none pr-9 [&>option]:bg-raised", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-mute" />
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
  optional,
}: {
  label: string;
  hint?: ReactNode;
  children: (id: string) => ReactNode;
  className?: string;
  optional?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-medium text-ink-soft">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-ink-mute">Optional</span>}
      </label>
      {children(id)}
      {hint && <p className="text-xs leading-relaxed text-ink-mute">{hint}</p>}
    </div>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-panel/80 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]", className)}
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: "neutral" | "brand" | "green" | "amber" | "red" | "blue" }) {
  const tones = {
    neutral: "bg-white/[0.06] text-ink-soft border-line",
    brand: "bg-brand/15 text-brand-soft border-brand/25",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    red: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    blue: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition",
        checked ? "border-brand/50 bg-brand" : "border-line bg-white/[0.08]",
      )}
    >
      <span
        className={cn(
          "inline-block size-[18px] rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-xl border border-line bg-white/[0.03] p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
            value === o.value ? "bg-white/[0.1] text-ink shadow-sm" : "text-ink-mute hover:text-ink-soft",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TagInput({
  value,
  onChange,
  placeholder,
  prefix = "#",
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  prefix?: string;
}) {
  const add = (raw: string) => {
    const tags = raw
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, ""))
      .filter(Boolean);
    if (tags.length) onChange([...new Set([...value, ...tags])]);
  };
  return (
    <div className={cn(field, "flex min-h-10 flex-wrap items-center gap-1.5 py-1.5")}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-white/[0.07] px-2 py-0.5 text-[13px]">
          <span className="text-ink-mute">{prefix}</span>
          {tag}
          <button
            type="button"
            className="ml-0.5 text-ink-mute hover:text-ink"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="min-w-24 flex-1 bg-transparent py-0.5 outline-none placeholder:text-ink-mute/70"
        placeholder={value.length ? "" : placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "," || e.key === " ") {
            e.preventDefault();
            add(e.currentTarget.value);
            e.currentTarget.value = "";
          } else if (e.key === "Backspace" && !e.currentTarget.value && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={(e) => {
          add(e.currentTarget.value);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin text-ink-mute", className)} />;
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-mute">{description}</p>}
      </div>
      {action}
    </div>
  );
}
