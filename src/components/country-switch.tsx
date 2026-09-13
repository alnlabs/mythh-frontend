"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { SWITCH_COUNTRIES, countryName, writeCountryCookie } from "@/lib/country";

export function CountrySwitch({ value }: { value: string }) {
  const router = useRouter();
  const { me, refreshMe } = useAuth();

  return (
    <label className="inline-flex min-w-0 items-center gap-1.5 text-sm text-[var(--muted)]">
      <Globe className="size-4 shrink-0 text-[var(--gold)]" />
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
        className="max-w-28 truncate rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-2 py-1 text-[var(--cream)] outline-none sm:max-w-40"
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
