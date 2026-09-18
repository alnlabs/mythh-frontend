import { MYTH_HI } from "./myth-hi";
import { MYTH_BN } from "./myth-bn";
import { MYTH_TA } from "./myth-ta";
import { MYTH_TE } from "./myth-te";
import { MYTH_MR } from "./myth-mr";
import { MYTH_KN } from "./myth-kn";
import { MYTH_ML } from "./myth-ml";
import { MYTH_GU } from "./myth-gu";
import { MYTH_PA } from "./myth-pa";

export type ClaimLang = "en" | "hi" | "bn" | "ta" | "te" | "mr" | "kn" | "ml" | "gu" | "pa";

export type ClaimCopy = {
  title: string;
  explanation: string;
};

export const CLAIM_LANGS: { code: ClaimLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

const TABLES: Record<Exclude<ClaimLang, "en">, Record<string, ClaimCopy>> = {
  hi: MYTH_HI,
  bn: MYTH_BN,
  ta: MYTH_TA,
  te: MYTH_TE,
  mr: MYTH_MR,
  kn: MYTH_KN,
  ml: MYTH_ML,
  gu: MYTH_GU,
  pa: MYTH_PA,
};

const STORAGE_KEY = "mythh_claim_lang";

export function isClaimLang(value: string | null | undefined): value is ClaimLang {
  return CLAIM_LANGS.some((lang) => lang.code === value);
}

export function readClaimLang(): ClaimLang | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isClaimLang(stored)) return stored;
  } catch {
    // Private mode can block storage.
  }
  return null;
}

export function writeClaimLang(lang: ClaimLang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode can block storage.
  }
}

export function mythCopy(
  slug: string,
  lang: ClaimLang,
  fallback: ClaimCopy,
): ClaimCopy {
  if (lang === "en") return fallback;
  return TABLES[lang][slug] ?? fallback;
}

export function hasClaimCopy(slug: string, lang: ClaimLang) {
  if (lang === "en") return true;
  return Boolean(TABLES[lang][slug]);
}

export function availableClaimLangs(slug: string): ClaimLang[] {
  const langs: ClaimLang[] = ["en"];
  for (const lang of CLAIM_LANGS) {
    if (lang.code === "en") continue;
    if (TABLES[lang.code][slug]) langs.push(lang.code);
  }
  return langs;
}
