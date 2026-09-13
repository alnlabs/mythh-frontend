import { FolderOpen } from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api";

export const metadata = {
  title: "Categories",
};

export default async function CategoriesPage() {
  const { categories } = await api.categories();

  return (
    <div className="page-shell">
      <h1 className="inline-flex items-center gap-3 font-[family-name:var(--font-display)] text-4xl">
        <FolderOpen className="size-8 text-[var(--gold)]" />
        Categories
      </h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-6 hover:border-[var(--gold)]"
          >
            <h2 className="inline-flex items-center gap-2 text-2xl text-[var(--cream)]">
              <FolderOpen className="size-5 text-[var(--gold)]" />
              {category.name}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{category.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
