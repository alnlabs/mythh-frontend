"use client";

import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { COUNTRY_COOKIE, readGuestCountry, normalizeCountry, writeCountryCookie } from "@/lib/country";

export function PublicIpCountry({ current }: { current: string }) {
  const { me, refreshMe } = useAuth();

  useEffect(() => {
    if (me?.profile?.country_code) return;
    if (readGuestCountry()) return;
    const hasCookie = document.cookie.split("; ").some((part) => part.startsWith(`${COUNTRY_COOKIE}=`));
    if (hasCookie) return;

    let active = true;
    fetch("https://api.country.is/")
      .then((response) => response.json())
      .then((payload: { country?: string }) => {
        if (!active) return;
        const next = normalizeCountry(payload.country);
        if (!next || next === current) {
          if (next) writeCountryCookie(next);
          return;
        }
        writeCountryCookie(next);
        if (me?.profile) {
          void api
            .updateMe({ countryCode: next })
            .then(() => refreshMe())
            .catch(() => undefined);
        }
        window.location.assign(`/?country=${next}`);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [current, me?.profile, refreshMe]);

  return null;
}
