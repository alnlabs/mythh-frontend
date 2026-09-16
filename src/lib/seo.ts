import type { Metadata } from "next";

export const SITE_NAME = "Myth";
export const SITE_TITLE = "Myth — or truth?";
export const SITE_HOST = "mythh.in";
export const SITE_DESCRIPTION =
  "Swipe through popular claims, choose Fact or Myth, and read a short AI write-up. For curiosity, not professional advice.";

export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(configured);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`);
  return new URL("http://localhost:3000");
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl()).toString();
}

export function clipDescription(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  index = true,
  publishedTime,
  modifiedTime,
  section,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  index?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
}): Metadata {
  const shareTitle = title === SITE_TITLE ? title : `${title} · ${SITE_NAME}`;
  const summary = clipDescription(description);

  return {
    title,
    description: summary,
    alternates: { canonical: path },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type,
      locale: "en_IN",
      url: path,
      siteName: SITE_NAME,
      title: shareTitle,
      description: summary,
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            section,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: summary,
    },
  };
}
