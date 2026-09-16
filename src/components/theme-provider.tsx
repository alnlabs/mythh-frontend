"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  applyResolvedTheme,
  detectTimeZone,
  msUntilNextThemeBoundary,
  nextThemeMode,
  readThemeMode,
  resolveTheme,
  writeThemeMode,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  timeZone: string;
  cycle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("auto");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");
  const [timeZone, setTimeZone] = useState("UTC");

  const sync = useCallback((nextMode: ThemeMode, tz: string) => {
    const theme = resolveTheme(nextMode, new Date(), tz);
    setMode(nextMode);
    setResolved(theme);
    setTimeZone(tz);
    applyResolvedTheme(theme);
  }, []);

  useEffect(() => {
    const refresh = () => sync(readThemeMode(), detectTimeZone());
    refresh();

    let timer = window.setTimeout(function schedule() {
      refresh();
      timer = window.setTimeout(schedule, msUntilNextThemeBoundary());
    }, msUntilNextThemeBoundary());

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sync]);

  const cycle = useCallback(() => {
    const next = nextThemeMode(mode);
    writeThemeMode(next);
    sync(next, detectTimeZone());
  }, [mode, sync]);

  const value = useMemo(
    () => ({ mode, resolved, timeZone, cycle }),
    [cycle, mode, resolved, timeZone],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
