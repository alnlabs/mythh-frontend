import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SlideFeed } from "@/components/feed/slide-feed";
import { api } from "@/lib/api";
import { requestCategory } from "@/lib/request-category";
import { requestCountry } from "@/lib/request-country";
import { clipDescription, pageMetadata } from "@/lib/seo";
import type { Myth } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ country?: string; category?: string }>;
};

export const dynamic = "force-dynamic";
export const dynamicParams = true;

const loadMyth = cache(async (slug: string): Promise<Myth | null> => {
  try {
    const { myth } = await api.myth(slug);
    return myth;
  } catch {
    return null;
  }
});

export async function generateStaticParams() {
  try {
    const { myths } = await api.myths("?limit=40");
    return myths.map((myth) => ({ slug: myth.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const myth = await loadMyth(slug);
  if (!myth) return { title: "Myth" };

  const category = myth.category?.name;
  const description = clipDescription(
    category ? `${category}. ${myth.explanation}` : myth.explanation,
  );

  return pageMetadata({
    title: myth.title,
    description,
    path: `/myths/${myth.slug}`,
    type: "article",
    publishedTime: myth.createdAt,
    modifiedTime: myth.updatedAt,
    section: category,
  });
}

export default async function MythPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { country: countryQuery, category: categoryQuery } = await searchParams;
  const [myth, country, category] = await Promise.all([
    loadMyth(slug),
    requestCountry(countryQuery),
    requestCategory(categoryQuery),
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
        items={[{ kind: "myth", myth }]}
        filterKey={`${country}:${category ?? "all"}`}
        country={country}
        category={category ?? "all"}
      />
    </>
  );
}
