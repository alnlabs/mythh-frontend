import { cookies } from "next/headers";

import { CATEGORY_COOKIE } from "./country";

export async function requestCategory(override?: string | null) {
  const fromQuery = override?.trim().toLowerCase();
  if (fromQuery) return fromQuery === "all" ? null : fromQuery;

  const jar = await cookies();
  const saved = jar.get(CATEGORY_COOKIE)?.value?.trim().toLowerCase();
  if (!saved || saved === "all") return null;
  return saved;
}
