import type { MetadataRoute } from "next";

import { api } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ myths }, { categories }] = await Promise.all([
    api.myths("?limit=200"),
    api.categories(),
  ]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/search"), changeFrequency: "weekly", priority: 0.4 },
    { url: absoluteUrl("/submit"), changeFrequency: "monthly", priority: 0.3 },
    ...categories.map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...myths.map((myth) => ({
      url: absoluteUrl(`/myths/${myth.slug}`),
      lastModified: myth.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
