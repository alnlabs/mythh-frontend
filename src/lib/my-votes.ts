import type { Myth } from "./types";

const KEY = "mythh_my_votes";

export function readMyVotes(): Record<string, "TRUE" | "FALSE"> {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "{}") as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, "TRUE" | "FALSE"] => entry[1] === "TRUE" || entry[1] === "FALSE",
      ),
    );
  } catch {
    return {};
  }
}

export function rememberMyVote(mythId: string, value: "TRUE" | "FALSE") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readMyVotes(), [mythId]: value }));
  } catch {
    /* private mode */
  }
}

export function voteForMyth(myth: Pick<Myth, "id" | "myVote">) {
  return myth.myVote ?? readMyVotes()[myth.id] ?? null;
}
