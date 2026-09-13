import { verdictLabel, voteLabel } from "@/lib/feed";
import type { Myth } from "@/lib/types";

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let offset = 0;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      context.fillText(line, x, y + offset);
      line = word;
      offset += lineHeight;
    } else {
      line = next;
    }
  }

  context.fillText(line, x, y + offset);
  return offset + lineHeight;
}

function cssVar(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export function mythShareUrl(myth: Myth) {
  return `${window.location.origin}/myths/${myth.slug}`;
}

export function mythShareText(myth: Myth, guess: "TRUE" | "FALSE" | null) {
  const vote = guess ? ` I voted ${voteLabel(guess)}.` : "";
  return `“${myth.title}” — is this a fact or a myth?${vote}`;
}

export async function captureShareImage(myth: Myth, guess: "TRUE" | "FALSE" | null) {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not draw the share card");

  const display = cssVar("--font-fraunces", "Georgia");
  const sans = cssVar("--font-geist-sans", "system-ui");

  context.fillStyle = "#12100d";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(540, 180, 40, 540, 280, 640);
  glow.addColorStop(0, "#2a241c");
  glow.addColorStop(1, "#12100d");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#d4b36a";
  context.font = `600 28px ${sans}`;
  context.fillText("MYTHH", 80, 110);

  context.fillStyle = "#b7aa94";
  context.font = `500 22px ${sans}`;
  const category = myth.category?.name ?? "Claim";
  context.fillText(category.toUpperCase(), 80, 280);

  context.fillStyle = "#f3ead8";
  context.font = `500 56px ${display}`;
  wrapText(context, `“${myth.title}”`, 80, 380, 920, 72);

  if (guess) {
    context.fillStyle = "#d4b36a";
    context.font = `600 26px ${sans}`;
    context.fillText(`You voted ${voteLabel(guess).toUpperCase()}`, 80, 980);

    context.fillStyle = "#f3ead8";
    context.font = `500 28px ${sans}`;
    context.fillText(`Editors: ${verdictLabel(myth.verdict)}`, 80, 1030);
  }

  context.fillStyle = "#b7aa94";
  context.font = `500 22px ${sans}`;
  context.fillText("Guess the claim. Learn why.  mythh.in", 80, 1260);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Could not create the screenshot");
  return blob;
}

export function openShareLink(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}

export async function copyShareLink(url: string) {
  await navigator.clipboard.writeText(url);
}

export function downloadShareImage(blob: Blob, slug: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `mythh-${slug}.png`;
  link.click();
  URL.revokeObjectURL(href);
}

export async function openNativeShare(myth: Myth, blob: Blob, guess: "TRUE" | "FALSE" | null) {
  const file = new File([blob], `mythh-${myth.slug}.png`, { type: "image/png" });
  const url = mythShareUrl(myth);
  const text = mythShareText(myth, guess);

  if (!navigator.share) {
    throw new Error("Native share is not available");
  }

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "MYTHH", text });
      return;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
  }

  await navigator.share({ title: "MYTHH", text: `${text}\n${url}` });
}
