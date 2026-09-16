"use client";

import { FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { writeCategoryCookie } from "@/lib/country";
import type { Category } from "@/lib/types";

export function CategorySwitch({
  value,
  full = false,
  compact = false,
}: {
  value: string;
  full?: boolean;
  compact?: boolean;
}) {
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
    <label
      className={`inline-flex min-w-0 items-center gap-1 text-sm text-[var(--muted)] ${full || compact ? "w-full" : "max-w-full"}`}
    >
      <FolderOpen className="hidden size-3.5 shrink-0 text-[var(--gold)] min-[380px]:block sm:size-4" />
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
        className={
          full || compact
            ? "min-w-0 w-full max-w-full flex-1 truncate rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-2 py-1 text-[11px] text-[var(--cream)] outline-none sm:px-2.5 sm:text-xs"
            : "min-w-0 max-w-36 truncate rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-2 py-1 text-sm text-[var(--cream)] outline-none"
        }
        style={{ minWidth: 0 }}
      >
        <option value="all">All topics</option>
        {value !== "all" && !categories.some((category) => category.slug === value) ? (
          <option value={value}>{value}</option>
        ) : null}
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  );
}
