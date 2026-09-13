"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import { api, googleLoginUrl } from "@/lib/api";
import type { MeResponse } from "@/lib/types";

type AuthContextValue = {
  me: MeResponse | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(() => {
    if (typeof window === "undefined") return "";
    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth === "cancelled") return "Sign-in cancelled.";
    if (auth === "error") return "Sign-in failed. Try again.";
    return "";
  });

  useEffect(() => {
    function loadMe() {
      return api
        .me()
        .then(setMe)
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
        login: () => {
          const params = new URLSearchParams(window.location.search);
          params.delete("auth");
          const query = params.toString();
          const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
          window.location.href = googleLoginUrl(next);
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
