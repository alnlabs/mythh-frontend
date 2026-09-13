import { cookies, headers } from "next/headers";

import { COUNTRY_COOKIE, countryFromLocale, normalizeCountry } from "./country";
import { ipFromHeaders, lookupIpCountry } from "./ip-country";

export async function requestCountry(override?: string | null) {
  const fromQuery = normalizeCountry(override);
  if (fromQuery) return fromQuery;

  const jar = await cookies();
  const fromCookie = normalizeCountry(jar.get(COUNTRY_COOKIE)?.value);
  if (fromCookie) return fromCookie;

  const list = await headers();
  const fromEdge =
    normalizeCountry(list.get("x-vercel-ip-country")) ??
    normalizeCountry(list.get("cf-ipcountry")) ??
    normalizeCountry(list.get("x-country-code"));
  if (fromEdge) return fromEdge;

  const fromIp = await lookupIpCountry(ipFromHeaders(list));
  if (fromIp) return fromIp;

  if (process.env.NODE_ENV === "development") {
    const fromPublicIp = await lookupIpCountry();
    if (fromPublicIp) return fromPublicIp;
  }

  return countryFromLocale(list.get("accept-language")?.split(",")[0]) ?? "IN";
}
