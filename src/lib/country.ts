const NAMES: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  AU: "Australia",
  CA: "Canada",
  PK: "Pakistan",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  NP: "Nepal",
  AE: "United Arab Emirates",
  SG: "Singapore",
  MY: "Malaysia",
  JP: "Japan",
  CN: "China",
  KR: "South Korea",
  BR: "Brazil",
  MX: "Mexico",
  NG: "Nigeria",
  ZA: "South Africa",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
};

export function countryName(code?: string | null) {
  if (!code) return null;
  return NAMES[code.toUpperCase()] ?? code.toUpperCase();
}

export function normalizeCountry(value?: string | null) {
  const code = value?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return null;
  return code;
}

export function countryFromLocale(locale?: string | null) {
  const region = locale?.split("-")[1];
  return normalizeCountry(region ?? null);
}

export const COUNTRY_COOKIE = "mythh_country";
export const CATEGORY_COOKIE = "mythh_category";
export const COUNTRY_STORAGE = "mythh_country";
export const CATEGORY_STORAGE = "mythh_category";

export const SWITCH_COUNTRIES = [
  "IN",
  "US",
  "GB",
  "AU",
  "CA",
  "PK",
  "BD",
  "AE",
  "SG",
  "JP",
  "CN",
  "BR",
  "NG",
] as const;

export function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode can block storage.
  }
}

export function readGuestCountry() {
  return normalizeCountry(readStorage(COUNTRY_STORAGE));
}

export function readGuestCategory() {
  const slug = readStorage(CATEGORY_STORAGE)?.trim().toLowerCase();
  if (!slug) return null;
  return slug;
}

export function writeCountryCookie(code: string) {
  document.cookie = `${COUNTRY_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  writeStorage(COUNTRY_STORAGE, code);
}

export function writeCategoryCookie(slug: string) {
  document.cookie = `${CATEGORY_COOKIE}=${slug}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  writeStorage(CATEGORY_STORAGE, slug);
}
