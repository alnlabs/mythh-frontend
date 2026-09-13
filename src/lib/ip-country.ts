import { normalizeCountry } from "./country";

function isPublicIp(ip: string) {
  const value = ip.replace(/^::ffff:/, "");
  if (!value || value === "::1" || value === "127.0.0.1") return false;
  if (value.startsWith("10.") || value.startsWith("192.168.") || value.startsWith("127.")) {
    return false;
  }
  const parts = value.split(".");
  if (parts[0] === "172") {
    const second = Number(parts[1]);
    if (second >= 16 && second <= 31) return false;
  }
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80")) {
    return false;
  }
  return true;
}

export function ipFromHeaders(list: Headers) {
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidates = [
    forwarded,
    list.get("cf-connecting-ip"),
    list.get("x-real-ip"),
    list.get("true-client-ip"),
  ];
  return candidates.find((ip): ip is string => Boolean(ip && isPublicIp(ip))) ?? null;
}

export async function lookupIpCountry(ip?: string | null) {
  const path = ip && isPublicIp(ip) ? `https://api.country.is/${ip}` : "https://api.country.is/";
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { country?: string };
    return normalizeCountry(payload.country);
  } catch {
    return null;
  }
}
