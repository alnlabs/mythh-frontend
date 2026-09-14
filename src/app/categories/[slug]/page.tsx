import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { api } from "@/lib/api";
import { verdictLabel } from "@/lib/feed";
import { pageMetadata } from "@/lib/seo";
import type { Category, Myth } from "@/lib/types";

async function loadCategory(slug: string): Promise<{ category: Category; myths: Myth[] } | null> {
  try {
    return await api.category(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadCategory(slug);
  if (!data) return { title: "Category" };

  return pageMetadata({
    title: data.category.name,
    description:
      data.category.description ??
      `Popular ${data.category.name} claims on MYTHH. Choose Myth or Fact and see what people believe.`,
    path: `/categories/${data.category.slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadCategory(slug);
  if (!data) notFound();

  return (
    <div className="page-shell">
      <h1 className="inline-flex items-center gap-3 font-[family-name:var(--font-display)] text-4xl">
        <FolderOpen className="size-8 text-[var(--gold)]" />
        {data.category.name}
      </h1>
      <p className="mt-3 text-[var(--muted)]">{data.category.description}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.myths.map((myth) => (
          <li key={myth.id}>
            <Link href={`/myths/${myth.slug}`} className="block rounded-3xl bg-[var(--ink-soft)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                {verdictLabel(myth.verdict)}
              </p>
              <h2 className="mt-2 text-2xl">{myth.title}</h2>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
