import { voteLabel } from "@/lib/feed";
import type { Myth } from "@/lib/types";

export function mythShareUrl(myth: Myth) {
  return `${window.location.origin}/myths/${myth.slug}`;
}

export function mythShareText(myth: Myth, guess: "TRUE" | "FALSE" | null) {
  const vote = guess ? ` I voted ${voteLabel(guess)}.` : "";
  return `“${myth.title}” — is this a fact or a myth?${vote}`;
}

export function openShareLink(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}

export async function copyShareLink(url: string) {
  await navigator.clipboard.writeText(url);
}

export async function openNativeShare(myth: Myth, guess: "TRUE" | "FALSE" | null) {
  if (typeof navigator.share !== "function") {
    throw new Error("Native share is not available");
  }

  const url = mythShareUrl(myth);
  const text = mythShareText(myth, guess);
  await navigator.share({ title: "MYTHH", text, url });
}
