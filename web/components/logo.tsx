import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <defs>
        <linearGradient id="cadence-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C4B5FD" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#cadence-mark)" />
      <path d="M9 19.5c2.2-6 4.4-6 6.6 0s4.4 6 6.6 0" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="22.4" cy="11.5" r="2" fill="white" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[17px]">Cadence</span>
    </Link>
  );
}
