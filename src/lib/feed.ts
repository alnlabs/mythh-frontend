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

export function buildMythFeed(start: Myth, myths: Myth[], ads: Advertisement[]): FeedItem[] {
  const rest = shuffle(myths.filter((myth) => myth.id !== start.id));
  return assembleFeed([start, ...rest], ads);
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
