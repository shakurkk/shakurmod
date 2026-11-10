import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--brand-green)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--brand-blue)" }} />
          <stop offset="1" style={{ stopColor: "var(--brand-blue)" }} />
        </linearGradient>
      </defs>
      {/* Folder-tab tile with a bold S and an amber corner fold */}
      <path d="M4 12a6 6 0 0 1 6-6h10l4 4h14a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6Z" fill={`url(#g${id})`} />
      <path d="M44 30v8a6 6 0 0 1-6 6h-8Z" style={{ fill: "var(--brand-amber)" }} />
      <path
        d="M30.5 19.5c-1.3-1.9-3.6-3-6.4-3-3.9 0-6.6 2.1-6.6 5.1 0 6.4 12.6 3.6 12.6 9.3 0 2.7-2.6 4.6-6.4 4.6-3 0-5.5-1.3-6.8-3.4"
        fill="none"
        style={{ stroke: "var(--card)" }}
        strokeWidth="3.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-[1.2rem] font-bold leading-none tracking-tight text-foreground">
          SHAKUR<span className="ml-1 font-semibold text-primary">MOD</span>
        </span>
      )}
    </span>
  );
}
