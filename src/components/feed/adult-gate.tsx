"use client";

import { useEffect, useState } from "react";
import { LogIn, ShieldAlert } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { SlideFeed } from "@/components/feed/slide-feed";
import { api, ApiError } from "@/lib/api";
import type { Myth } from "@/lib/types";

export function AdultGate({
  slug,
  country,
  category,
}: {
  slug: string;
  country: string;
  category: string;
}) {
  const { me, loading, login } = useAuth();
  const [myth, setMyth] = useState<Myth | null>(null);
  const signedIn = Boolean(me?.profile);

  useEffect(() => {
    if (!signedIn) {
      setMyth(null);
      return;
    }

    let cancelled = false;
    void api
      .myth(slug)
      .then(({ myth: next }) => {
        if (!cancelled) setMyth(next);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === "ADULT_LOGIN_REQUIRED") {
          setMyth(null);
          return;
        }
        setMyth(null);
      });

    return () => {
      cancelled = true;
    };
  }, [signedIn, slug]);

  if (signedIn && myth) {
    return (
      <SlideFeed
        items={[{ kind: "myth", myth }]}
        filterKey={`${country}:${category}`}
        country={country}
        category={category}
      />
    );
  }

  if (signedIn && loading) {
    return <div className="flex flex-1 items-center justify-center text-[var(--muted)]">Loading…</div>;
  }

  if (signedIn && !myth) {
    return <div className="flex flex-1 items-center justify-center text-[var(--muted)]">Loading…</div>;
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <ShieldAlert className="mx-auto size-10 text-[var(--gold)]" />
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)]">
          This claim is 18+
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Sign in to read adult claims about alcohol, tobacco, and similar topics.
        </p>
        <button
          type="button"
          onClick={login}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm text-[var(--on-gold)]"
        >
          <LogIn className="size-4" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
