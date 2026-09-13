import type { Advertisement, FeedItem, Myth } from "./types";

const AD_EVERY = 3;

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    const other = next[swap];
    if (current === undefined || other === undefined) continue;
    next[index] = other;
    next[swap] = current;
  }

  return next;
}

function assembleFeed(myths: Myth[], ads: Advertisement[]): FeedItem[] {
  const items: FeedItem[] = [];
  const queue = shuffle(ads);
  let adIndex = 0;

  myths.forEach((myth, index) => {
    items.push({ kind: "myth", myth });

    if ((index + 1) % AD_EVERY === 0 && queue.length > 0) {
      const ad = queue[adIndex % queue.length];
      if (ad) {
        items.push({ kind: "ad", ad });
        adIndex += 1;
      }
    }
  });

  return items;
}

export function buildFeed(myths: Myth[], ads: Advertisement[]): FeedItem[] {
  return assembleFeed(shuffle(myths), ads);
}

export function buildMythFeed(start: Myth, myths: Myth[], ads: Advertisement[]) {
  const rest = shuffle(myths.filter((myth) => myth.id !== start.id));
  return assembleFeed([start, ...rest], ads);
}

const SEEN_KEY = "mythh_seen_myths";
const SEEN_CAP = 120;
const RECENT_BLOCK = 16;

export function readSeenMyths() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SEEN_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberSeenMyth(id: string) {
  const next = [...readSeenMyths().filter((item) => item !== id), id].slice(-SEEN_CAP);
  try {
    window.sessionStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    // Private mode can block storage.
  }
  return next;
}

function pickRandom<T>(items: T[]) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

export function pickNextMyth(myths: Myth[], current: Myth | null, seenIds: string[]) {
  const currentId = current?.id;
  const recent = new Set(seenIds.slice(-RECENT_BLOCK));
  if (currentId) recent.add(currentId);

  const unseen = myths.filter((myth) => myth.id !== currentId && !seenIds.includes(myth.id));
  const fresh = myths.filter((myth) => !recent.has(myth.id));
  let candidates = unseen.length ? unseen : fresh.length ? fresh : myths.filter((myth) => myth.id !== currentId);

  if (!candidates.length) return current ?? pickRandom(myths);

  const lastCategory = current?.category?.id;
  const otherCategory = candidates.filter((myth) => myth.category?.id !== lastCategory);
  if (lastCategory && otherCategory.length >= 2 && Math.random() < 0.82) {
    candidates = otherCategory;
  }

  return pickRandom(candidates);
}

export function shouldShowAd(lastWasAd: boolean, hasAds: boolean) {
  return hasAds && !lastWasAd && Math.random() < 0.16;
}

export function pickRandomAd(ads: Advertisement[], lastAdId?: string | null) {
  const pool = ads.length > 1 ? ads.filter((ad) => ad.id !== lastAdId) : ads;
  return pickRandom(pool);
}

export function voteLabel(value: "TRUE" | "FALSE") {
  return value === "TRUE" ? "Fact" : "Myth";
}

export function verdictLabel(verdict: string) {
  switch (verdict) {
    case "TRUE":
      return "Fact";
    case "FALSE":
      return "Myth";
    case "PARTIALLY_TRUE":
      return "Partly true";
    default:
      return "Uncertain";
  }
}

export function guessHeadline(guess: "TRUE" | "FALSE", verdict: string) {
  if (verdict === "UNCERTAIN") return "Still unsettled";
  if (verdict === "PARTIALLY_TRUE") return "Close — it is complicated";
  if (guess === verdict) return "You called it";
  return "Not quite";
}
