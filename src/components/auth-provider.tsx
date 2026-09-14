"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { api, googleLoginUrl } from "@/lib/api";
import { readGuestCategory, readGuestCountry, writeCategoryCookie, writeCountryCookie } from "@/lib/country";
import type { MeResponse, Profile } from "@/lib/types";

type AuthContextValue = {
  me: MeResponse | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  applyProfile: (profile: Profile) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const syncedPrefs = useRef(false);
  const [notice, setNotice] = useState(() => {
    if (typeof window === "undefined") return "";
    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth === "cancelled") return "Sign-in cancelled.";
    if (auth === "error") return "Sign-in failed. Try again.";
    return "";
  });

  function applyProfile(profile: Profile) {
    setMe((current) => (current ? { ...current, profile } : { authMode: "user", user: null, profile }));
    if (profile.country_code) writeCountryCookie(profile.country_code);
    writeCategoryCookie(profile.default_category?.slug ?? "all");
  }

  async function refreshMe() {
    try {
      const next = await api.me();
      setMe(next);
      if (next.profile) applyProfile(next.profile);
    } catch {
      setMe(null);
    }
  }

  useEffect(() => {
    function loadMe() {
      return api
        .me()
        .then((next) => {
          setMe(next);
          if (next.profile) applyProfile(next.profile);
        })
        .catch(() => setMe(null));
    }

    loadMe().finally(() => setLoading(false));

    function onVisible() {
      if (document.visibilityState === "visible") {
        void loadMe();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    if (auth !== "cancelled" && auth !== "error") return;

    params.delete("auth");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router]);

  useEffect(() => {
    if (loading || !me?.profile || syncedPrefs.current) return;
    syncedPrefs.current = true;
    if (!me.profile.country_code) {
      const saved = readGuestCountry();
      if (saved) {
        void api
          .updateMe({ countryCode: saved })
          .then(() => refreshMe())
          .catch(() => undefined);
      }
    }
    if (!me.profile.default_category_id) {
      const savedCategory = readGuestCategory();
      if (savedCategory && savedCategory !== "all") {
        void api
          .categories()
          .then((result) => {
            const categoryId = result.categories.find((category) => category.slug === savedCategory)?.id;
            if (!categoryId) return;
            return api.updateMe({ defaultCategoryId: categoryId }).then(() => refreshMe());
          })
          .catch(() => undefined);
      }
    }
    router.refresh();
  }, [loading, me?.profile, refreshMe, router]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function logout() {
    await api.logout().catch(() => undefined);
    setMe(null);
  }

  return (
    <AuthContext.Provider
      value={{
        me,
        loading,
        refreshMe,
        applyProfile,
        login: () => {
          const params = new URLSearchParams(window.location.search);
          params.delete("auth");
          const query = params.toString();
          const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
          window.location.href = googleLoginUrl(next, window.location.origin);
        },
        logout,
      }}
    >
      {notice && (
        <button
          type="button"
          onClick={() => setNotice("")}
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-4 py-2 text-sm text-[var(--cream)]"
        >
          {notice}
        </button>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
