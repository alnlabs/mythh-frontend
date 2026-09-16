export const THEME_STORAGE_KEY = "mythh-theme";
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 18;

export type ThemeMode = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const MODES: ThemeMode[] = ["auto", "light", "dark"];

export function parseThemeMode(value: string | null | undefined): ThemeMode {
  return value === "light" || value === "dark" ? value : "auto";
}

export function nextThemeMode(current: ThemeMode): ThemeMode {
  return MODES[(MODES.indexOf(current) + 1) % MODES.length];
}

export function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function zonedClock(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    hour: num("hour"),
    minute: num("minute"),
    second: num("second"),
  };
}

export function themeFromTimeZone(date = new Date(), timeZone = detectTimeZone()): ResolvedTheme {
  const { hour } = zonedClock(date, timeZone);
  return hour >= DAY_START_HOUR && hour < DAY_END_HOUR ? "light" : "dark";
}

export function resolveTheme(mode: ThemeMode, date = new Date(), timeZone = detectTimeZone()): ResolvedTheme {
  return mode === "auto" ? themeFromTimeZone(date, timeZone) : mode;
}

export function msUntilNextThemeBoundary(date = new Date(), timeZone = detectTimeZone()): number {
  const { hour, minute, second } = zonedClock(date, timeZone);
  const nowSec = hour * 3600 + minute * 60 + second;
  const start = DAY_START_HOUR * 3600;
  const end = DAY_END_HOUR * 3600;
  const target = nowSec < start ? start : nowSec < end ? end : start + 24 * 3600;
  return Math.max(1_000, (target - nowSec) * 1000 - date.getMilliseconds());
}

export function readThemeMode(): ThemeMode {
  try {
    return parseThemeMode(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "auto";
  }
}

export function writeThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* private mode */
  }
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const color = theme === "light" ? "#f6efe2" : "#12100d";
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}

export const THEME_BOOTSTRAP = `(function(){try{var mode=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var theme=mode==="light"||mode==="dark"?mode:null;if(!theme){var hour=new Date().getHours();theme=hour>=${DAY_START_HOUR}&&hour<${DAY_END_HOUR}?"light":"dark";}var root=document.documentElement;root.setAttribute("data-theme",theme);root.style.colorScheme=theme;}catch(e){document.documentElement.setAttribute("data-theme","dark");document.documentElement.style.colorScheme="dark";}})();`;
