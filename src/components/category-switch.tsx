"use client";

import { FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { writeCategoryCookie } from "@/lib/country";
import type { Category } from "@/lib/types";

export function CategorySwitch({ value }: { value: string }) {
  const router = useRouter();
  const { me, refreshMe } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api
      .categories()
      .then((result) => setCategories(result.categories))
      .catch(() => setCategories([]));
  }, []);

  return (
    <label className="inline-flex min-w-0 items-center gap-1.5 text-sm text-[var(--muted)]">
      <FolderOpen className="size-4 shrink-0 text-[var(--gold)]" />
      <select
        value={value}
        aria-label="Default category"
        onChange={(event) => {
          const next = event.target.value;
          writeCategoryCookie(next);
          if (me?.profile) {
            const categoryId = categories.find((category) => category.slug === next)?.id ?? null;
            void api
              .updateMe({ defaultCategoryId: categoryId })
              .then(() => refreshMe())
              .catch(() => undefined);
          }
          router.push(next === "all" ? "/" : `/?category=${next}`);
          router.refresh();
        }}
        className="max-w-28 truncate rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-2 py-1 text-[var(--cream)] outline-none sm:max-w-36"
      >
        <option value="all">All topics</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  );
}
