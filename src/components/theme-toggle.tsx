"use client";

import { Moon, Sun, SunMoon } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

function label(mode: "auto" | "light" | "dark", resolved: "light" | "dark", timeZone: string) {
  const zone = timeZone.replace(/_/g, " ");
  if (mode === "auto") {
    return resolved === "light"
      ? `Daytime in ${zone}. Using light theme. Click to pin light.`
      : `Nighttime in ${zone}. Using dark theme. Click to pin light.`;
  }
  if (mode === "light") return "Light theme pinned. Click to pin dark.";
  return "Dark theme pinned. Click to follow your timezone.";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, resolved, timeZone, cycle } = useTheme();
  const Icon = mode === "auto" ? SunMoon : resolved === "light" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label(mode, resolved, timeZone)}
      title={label(mode, resolved, timeZone)}
      className={`inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-[var(--cream)] hover:text-[var(--gold)] ${className}`}
    >
      <Icon className="size-4 sm:size-5" />
    </button>
  );
}
