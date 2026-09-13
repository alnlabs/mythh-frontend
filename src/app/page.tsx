import { redirect } from "next/navigation";

import { api } from "@/lib/api";
import { shuffle } from "@/lib/feed";
import { requestCategory } from "@/lib/request-category";
import { requestCountry } from "@/lib/request-country";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string; country?: string; category?: string }>;
}) {
  const { auth, country: countryQuery, category: categoryQuery } = await searchParams;
  const country = await requestCountry(countryQuery);
  const category = await requestCategory(categoryQuery);
  const query = new URLSearchParams({ limit: "200", country });
  if (category) query.set("category", category);
  const { myths } = await api.myths(`?${query.toString()}`).catch(() => ({ myths: [] }));
  const local = myths.filter((myth) => myth.countryCode === country);
  const pick = shuffle(local.length ? local : myths)[0];

  if (!pick) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-[var(--muted)]">
        No myths yet.
      </div>
    );
  }

  const next = new URL(`/myths/${pick.slug}`, "http://localhost");
  if (auth) next.searchParams.set("auth", auth);
  if (countryQuery) next.searchParams.set("country", country);
  if (categoryQuery && category) next.searchParams.set("category", category);
  redirect(`${next.pathname}${next.search}`);
}
