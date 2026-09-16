"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { SWITCH_COUNTRIES, countryName, writeCountryCookie } from "@/lib/country";

export function CountrySwitch({
  value,
  full = false,
  compact = false,
}: {
  value: string;
  full?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const { me, refreshMe } = useAuth();

  return (
    <label
      className={`inline-flex min-w-0 items-center gap-1 text-sm text-[var(--muted)] ${full || compact ? "w-full" : "max-w-full"}`}
    >
      <Globe className="hidden size-3.5 shrink-0 text-[var(--gold)] min-[380px]:block sm:size-4" />
      <select
        value={value}
        aria-label="Country"
        onChange={(event) => {
          const next = event.target.value;
          writeCountryCookie(next);
          if (me?.profile) {
            void api
              .updateMe({ countryCode: next })
              .then(() => refreshMe())
              .catch(() => undefined);
          }
          router.push(`/?country=${next}`);
          router.refresh();
        }}
        className={
          full || compact
            ? "min-w-0 w-full max-w-full flex-1 truncate rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-2 py-1 text-[11px] text-[var(--cream)] outline-none sm:px-2.5 sm:text-xs"
            : "min-w-0 max-w-40 truncate rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-2 py-1 text-sm text-[var(--cream)] outline-none"
        }
        style={{ minWidth: 0 }}
      >
        {SWITCH_COUNTRIES.map((code) => (
          <option key={code} value={code}>
            {countryName(code)}
          </option>
        ))}
        {!(SWITCH_COUNTRIES as readonly string[]).includes(value) && (
          <option value={value}>{countryName(value) ?? value}</option>
        )}
      </select>
    </label>
  );
}
