import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { api } from "@/lib/api";
import { shuffle } from "@/lib/feed";
import { requestCategory } from "@/lib/request-category";
import { requestCountry } from "@/lib/request-country";
import { SITE_DESCRIPTION, SITE_TITLE, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
  });
}

function isShareCrawler(userAgent: string) {
  return /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot|Pinterest|iMessage|Googlebot|bingbot|Applebot/i.test(
    userAgent,
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string; country?: string; category?: string }>;
}) {
  const userAgent = (await headers()).get("user-agent") ?? "";
  if (isShareCrawler(userAgent)) {
    return (
      <div className="page-shell">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--cream)]">
          Myth — or truth?
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Swipe through popular claims, choose Fact or Myth, and read a short AI write-up. For
          curiosity, not professional advice.
        </p>
      </div>
    );
  }

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
