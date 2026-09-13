"use client";

import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";
import { readGuestCategory, readGuestCountry, writeCategoryCookie, writeCountryCookie } from "@/lib/country";

export function GuestPrefs({ country, category }: { country: string; category: string }) {
  const { me, loading } = useAuth();

  useEffect(() => {
    if (loading || me?.profile) return;

    const storedCountry = readGuestCountry();
    const storedCategory = readGuestCategory();
    const next = new URL(window.location.href);
    let changed = false;

    if (storedCountry) {
      writeCountryCookie(storedCountry);
      if (storedCountry !== country && !next.searchParams.get("country")) {
        next.searchParams.set("country", storedCountry);
        changed = true;
      }
    }

    if (storedCategory) {
      writeCategoryCookie(storedCategory);
      if (storedCategory !== category && !next.searchParams.get("category")) {
        if (storedCategory === "all") next.searchParams.delete("category");
        else next.searchParams.set("category", storedCategory);
        changed = true;
      }
    }

    if (changed) {
      window.location.replace(`${next.pathname}${next.search}`);
    }
  }, [category, country, loading, me?.profile]);

  return null;
}
