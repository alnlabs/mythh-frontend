import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SlideFeed } from "@/components/feed/slide-feed";
import { api } from "@/lib/api";
import { buildMythFeed } from "@/lib/feed";
import type { Myth } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
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
    const { myths } = await api.myths("?limit=50");
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

export default async function MythPage({ params }: Props) {
  const { slug } = await params;
  const [myth, mythsResult, adsResult] = await Promise.all([
    loadMyth(slug),
    api.myths("?limit=50").catch(() => ({ myths: [] })),
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
      <SlideFeed items={buildMythFeed(myth, mythsResult.myths, adsResult.advertisements)} />
    </>
  );
}
