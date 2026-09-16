import Link from "next/link";

import { MYTH_MARK_PATH, MYTH_MARK_VIEWBOX } from "@/lib/brand";

export function MythMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={MYTH_MARK_VIEWBOX}
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path fillRule="evenodd" d={MYTH_MARK_PATH} />
    </svg>
  );
}

export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Myth home"
      className={`flex min-w-0 items-center gap-1.5 sm:gap-2 ${className}`}
    >
      <MythMark className="size-6 shrink-0 text-[var(--gold)] sm:size-7 lg:size-8" />
      <span className="min-w-0 leading-tight">
        <span className="block font-[family-name:var(--font-display)] text-[1.15rem] leading-none tracking-tight text-[var(--cream)] sm:text-2xl">
          Myth
        </span>
        <span className="mt-0.5 hidden font-[family-name:var(--font-display)] text-[0.7rem] leading-none text-[var(--gold)] sm:block sm:text-sm">
          or truth?
        </span>
      </span>
    </Link>
  );
}
