import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SlideFeed } from "@/components/feed/slide-feed";
import { api } from "@/lib/api";
import { buildMythFeed } from "@/lib/feed";
import { requestCategory } from "@/lib/request-category";
import { requestCountry } from "@/lib/request-country";
import type { Myth } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ country?: string; category?: string }>;
};

export const dynamic = "force-dynamic";
export const dynamicParams = true;

async function loadMyth(slug: string): Promise<Myth | null> {
  try {
    const { myth } = await api.myth(slug);
    return myth;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const { myths } = await api.myths("?limit=200");
    return myths.map((myth) => ({ slug: myth.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const myth = await loadMyth(slug);
  if (!myth) return { title: "Myth" };

  const description = myth.explanation.slice(0, 160);

  return {
    title: myth.title,
    description,
    alternates: {
      canonical: `/myths/${myth.slug}`,
    },
    openGraph: {
      title: myth.title,
      description,
      url: `/myths/${myth.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: myth.title,
      description,
    },
  };
}

export default async function MythPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { country: countryQuery, category: categoryQuery } = await searchParams;
  const country = await requestCountry(countryQuery);
  const category = await requestCategory(categoryQuery);
  const feedQuery = new URLSearchParams({ limit: "200", country });
  if (category) feedQuery.set("category", category);
  const [myth, mythsResult, adsResult] = await Promise.all([
    loadMyth(slug),
    api.myths(`?${feedQuery.toString()}`).catch(() => ({ myths: [] })),
    api.advertisements().catch(() => ({ advertisements: [] })),
  ]);
  if (!myth) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: myth.title,
    description: myth.explanation,
    datePublished: myth.createdAt,
    dateModified: myth.updatedAt,
    author: {
      "@type": "Person",
      name: myth.creator.displayName,
    },
    articleSection: myth.category?.name ?? "Myth",
    mainEntityOfPage: `/myths/${myth.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SlideFeed
        items={buildMythFeed(myth, mythsResult.myths, adsResult.advertisements)}
      />
    </>
  );
}
