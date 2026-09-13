import type { MetadataRoute } from "next";

import { api } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ myths }, { categories }] = await Promise.all([
    api.myths("?limit=50"),
    api.categories(),
  ]);

  return [
    { url: "http://localhost:3000/" },
    { url: "http://localhost:3000/categories" },
    { url: "http://localhost:3000/about" },
    ...categories.map((category) => ({
      url: `http://localhost:3000/categories/${category.slug}`,
    })),
    ...myths.map((myth) => ({
      url: `http://localhost:3000/myths/${myth.slug}`,
    })),
  ];
}
