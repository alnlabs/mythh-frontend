"use client";

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Megaphone,
  MessageCircle,
  Share2,
  ShieldQuestion,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { CommentsPanel } from "@/components/comments-panel";
import { ShareSheet } from "@/components/feed/share-sheet";
import { api } from "@/lib/api";
import {
  pickNextMyth,
  pickRandomAd,
  rememberSeenMyth,
  shouldShowAd,
} from "@/lib/feed";
import { voteForMyth, rememberMyVote, forgetMyVote, readMyVotes } from "@/lib/my-votes";
import { openNativeShare } from "@/lib/share-card";
import { countryName } from "@/lib/country";
import {
  CLAIM_LANGS,
  availableClaimLangs,
  mythCopy,
  readClaimLang,
  writeClaimLang,
  type ClaimLang,
} from "@/lib/myth-i18n";
import type { Advertisement, FeedItem, Myth } from "@/lib/types";

const WINDOW = 5;
const STATS_POLL_MS = 4000;
const FEED_PAGE_SIZE = 1000;

function uniqueMyths(items: Myth[]) {
  const seen = new Set<string>();
  return items.filter((myth) => {
    if (seen.has(myth.id)) return false;
    seen.add(myth.id);
    return true;
  });
}

function uniqueAds(items: Advertisement[]) {
  const seen = new Set<string>();
  return items.filter((ad) => {
    if (seen.has(ad.id)) return false;
    seen.add(ad.id);
    return true;
  });
}

function startItem(items: FeedItem[]) {
  return items.find((item) => item.kind === "myth") ?? items[0] ?? null;
}

function startMyth(items: FeedItem[]) {
  const first = startItem(items);
  return first?.kind === "myth" ? first.myth : null;
}

function itemKey(item: FeedItem | null) {
  if (!item) return "";
  return item.kind === "myth" ? item.myth.id : `ad:${item.ad.id}`;
}

function lastMythIn(deck: FeedItem[]) {
  for (let index = deck.length - 1; index >= 0; index -= 1) {
    const item = deck[index];
    if (item?.kind === "myth") return item.myth;
  }
  return null;
}

function withSavedVote(myth: Myth): Myth {
  const saved = voteForMyth(myth);
  return saved && myth.myVote !== saved ? { ...myth, myVote: saved } : myth;
}

function withSavedVotes(items: FeedItem[]): FeedItem[] {
  const saved = readMyVotes();
  return items.map((item) => {
    if (item.kind !== "myth" || item.myth.myVote) return item;
    const value = saved[item.myth.id];
    return value ? { kind: "myth", myth: { ...item.myth, myVote: value } } : item;
  });
}

function mergeMyth(deck: FeedItem[], myth: Myth): FeedItem[] {
  const next = withSavedVote(myth);
  return deck.map((item) =>
    item.kind === "myth" && item.myth.id === next.id ? { kind: "myth", myth: next } : item,
  );
}

function applyVoteToMyth(myth: Myth, value: "TRUE" | "FALSE", signedIn: boolean): Myth {
  const previous = myth.myVote;
  if (previous === value) return { ...myth, myVote: value };

  let trueCount = myth.stats.trueCount;
  let falseCount = myth.stats.falseCount;
  let authenticatedCount = myth.stats.authenticatedCount;
  let anonymousCount = myth.stats.anonymousCount;

  if (previous === "TRUE") trueCount = Math.max(0, trueCount - 1);
  else if (previous === "FALSE") falseCount = Math.max(0, falseCount - 1);
  else if (signedIn) authenticatedCount += 1;
  else anonymousCount += 1;

  if (value === "TRUE") trueCount += 1;
  else falseCount += 1;

  const responseCount = trueCount + falseCount;
  return {
    ...myth,
    myVote: value,
    stats: {
      ...myth.stats,
      trueCount,
      falseCount,
      authenticatedCount,
      anonymousCount,
      responseCount,
      truePercent: responseCount === 0 ? 0 : Math.round((trueCount / responseCount) * 100),
      falsePercent: responseCount === 0 ? 0 : Math.round((falseCount / responseCount) * 100),
    },
  };
}

function pickAhead(
  deck: FeedItem[],
  myths: Myth[],
  ads: Advertisement[],
): FeedItem | null {
  const now = deck[deck.length - 1];
  if (!now) return null;

  const used = new Set(deck.map(itemKey));
  const seen = deck.flatMap((item) => (item.kind === "myth" ? [item.myth.id] : []));
  let last = lastMythIn(deck);

  for (let attempt = 0; attempt < 16; attempt += 1) {
    let candidate: FeedItem | null = null;
    if (now.kind === "myth" && shouldShowAd(false, ads.length > 0)) {
      const ad = pickRandomAd(ads, null);
      if (ad) candidate = { kind: "ad", ad };
    }
    if (!candidate) {
      const nextMyth = pickNextMyth(myths, now.kind === "myth" ? now.myth : last, seen);
      if (nextMyth) candidate = { kind: "myth", myth: withSavedVote(nextMyth) };
    }
    if (!candidate) return null;
    if (!used.has(itemKey(candidate))) return candidate;
    if (candidate.kind === "myth") seen.push(candidate.myth.id);
  }

  const unused = myths.find((myth) => !used.has(myth.id));
  return unused ? { kind: "myth", myth: withSavedVote(unused) } : null;
}

function fillWindow(
  deck: FeedItem[],
  index: number,
  myths: Myth[],
  ads: Advertisement[],
) {
  const next = [...deck];
  while (next.length - 1 - index < WINDOW) {
    const item = pickAhead(next, myths, ads);
    if (!item) break;
    next.push(item);
  }
  return next;
}

function initialDeck(items: FeedItem[]) {
  const start = startItem(items);
  if (!start) return [];
  const rest = items.filter((item) => itemKey(item) !== itemKey(start));
  return [start, ...rest].slice(0, 1 + WINDOW);
}

export function SlideFeed({
  items,
  filterKey = "all",
  country,
  category = "all",
}: {
  items: FeedItem[];
  filterKey?: string;
  country?: string;
  category?: string;
}) {
  const { me } = useAuth();
  const seedMyths = useMemo(
    () => items.filter((item): item is Extract<FeedItem, { kind: "myth" }> => item.kind === "myth").map((item) => item.myth),
    [items],
  );
  const seedAds = useMemo(
    () => items.filter((item): item is Extract<FeedItem, { kind: "ad" }> => item.kind === "ad").map((item) => item.ad),
    [items],
  );
  const [moreMyths, setMoreMyths] = useState<Myth[]>([]);
  const [moreAds, setMoreAds] = useState<Advertisement[]>([]);
  const myths = useMemo(() => uniqueMyths([...seedMyths, ...moreMyths]), [seedMyths, moreMyths]);
  const ads = useMemo(() => uniqueAds([...seedAds, ...moreAds]), [seedAds, moreAds]);
  const [deck, setDeck] = useState<FeedItem[]>(() => initialDeck(items));
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState<"TRUE" | "FALSE" | null>(
    () => startMyth(items)?.myVote ?? null,
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [lastWheel, setLastWheel] = useState(0);
  const feedRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    tracking: false,
    startY: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
  });
  const swipeLock = useRef(false);
  const pendingTarget = useRef(-1);
  const pendingDeck = useRef<FeedItem[] | null>(null);
  const indexRef = useRef(0);
  const offsetRef = useRef(0);
  const heightRef = useRef(0);
  const deckRef = useRef(deck);
  const pendingVotesRef = useRef(new Map<string, { generation: number; previous: Myth }>());
  const startId = startMyth(items)?.id ?? "";
  const sessionKey = `${filterKey}::${startId}`;
  const current = deck[index] ?? null;
  const myth = current?.kind === "myth" ? current.myth : null;

  indexRef.current = index;
  deckRef.current = deck;

  const stateRef = useRef({ commentsOpen, shareOpen });
  stateRef.current = { commentsOpen, shareOpen };

  function paint(offset: number, animated: boolean) {
    offsetRef.current = offset;
    const node = trackRef.current;
    if (!node) return;
    const y = -indexRef.current * heightRef.current + offset;
    node.style.transition = animated ? "transform 300ms ease-out" : "none";
    node.style.transform = `translate3d(0, ${y}px, 0)`;
  }

  useLayoutEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    function measure() {
      heightRef.current = feed?.clientHeight ?? 0;
      paint(0, false);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(feed);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const nextDeck = withSavedVotes(initialDeck(items));
    const first = nextDeck[0];
    setMoreMyths([]);
    setMoreAds([]);
    setDeck(nextDeck);
    setIndex(0);
    setGuess(first?.kind === "myth" ? voteForMyth(first.myth) : null);
    setCommentsOpen(false);
    setShareOpen(false);
    indexRef.current = 0;
    if (first?.kind === "myth") rememberSeenMyth(first.myth.id);
    requestAnimationFrame(() => paint(0, false));
    // Rebuild when the opened claim or country/category filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sessionKey is the filter/start contract
  }, [sessionKey]);

  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams({ limit: String(FEED_PAGE_SIZE) });
    if (country) query.set("country", country);
    if (category && category !== "all") query.set("category", category);
    void Promise.all([
      api.myths(`?${query.toString()}`).catch(() => ({ myths: [] as Myth[] })),
      api.advertisements().catch(() => ({ advertisements: [] as Advertisement[] })),
    ]).then(([{ myths: nextMyths }, { advertisements }]) => {
      if (cancelled) return;
      const pool = uniqueMyths([...seedMyths, ...nextMyths]);
      const adPool = uniqueAds([...seedAds, ...advertisements]);
      setMoreMyths(nextMyths);
      setMoreAds(advertisements);
      setDeck((now) => fillWindow(now, indexRef.current, pool, adPool));
    });
    return () => {
      cancelled = true;
    };
    // seed lists belong to this opened claim; sessionKey already reties them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey, country, category]);

  useEffect(() => {
    if (!myth) return;
    const next = `/myths/${myth.slug}`;
    if (window.location.pathname === next) return;
    window.history.replaceState(window.history.state, "", next);
    document.title = `${myth.title} · Myth`;
  }, [myth]);

  useEffect(() => {
    if (!myth) return;
    const slug = myth.slug;
    const mythId = myth.id;
    let cancelled = false;
    let inFlight = false;

    function applyRemote(next: Myth) {
      if (cancelled || pendingVotesRef.current.has(next.id)) return;
      if (next.myVote) rememberMyVote(next.id, next.myVote);
      setDeck((now) => mergeMyth(now, next));
      const shown = deckRef.current[indexRef.current];
      if (shown?.kind === "myth" && shown.myth.id === next.id) {
        setGuess(voteForMyth(next));
      }
    }

    function refresh() {
      if (cancelled || inFlight) return;
      if (document.visibilityState !== "visible") return;
      if (pendingVotesRef.current.has(mythId)) return;
      inFlight = true;
      void api
        .myth(slug)
        .then(({ myth: next }) => applyRemote(next))
        .catch(() => undefined)
        .finally(() => {
          inFlight = false;
        });
    }

    refresh();
    const interval = window.setInterval(refresh, STATS_POLL_MS);
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [myth?.id, myth?.slug]);

  const settlePending = useCallback(() => {
    if (pendingTarget.current < 0) return;
    const target = pendingTarget.current;
    const filled = pendingDeck.current ?? deckRef.current;
    pendingTarget.current = -1;
    pendingDeck.current = null;
    indexRef.current = target;
    setDeck(filled);
    setIndex(target);
    const landed = filled[target];
    setGuess(landed?.kind === "myth" ? voteForMyth(landed.myth) : null);
    setCommentsOpen(false);
    setShareOpen(false);
    const item = filled[target];
    if (item?.kind === "myth") rememberSeenMyth(item.myth.id);
    requestAnimationFrame(() => {
      paint(0, false);
      swipeLock.current = false;
    });
  }, []);

  const goTo = useCallback(
    (nextIndex: number, animated: boolean) => {
      if (nextIndex < 0 || swipeLock.current) return;
      const { commentsOpen: comments, shareOpen: sharing } = stateRef.current;
      if (comments || sharing) return;

      const filled = fillWindow(deckRef.current, nextIndex, myths, ads);
      const target = Math.min(nextIndex, filled.length - 1);
      if (target === indexRef.current) {
        paint(0, true);
        return;
      }

      if (animated && heightRef.current) {
        deckRef.current = filled;
        setDeck(filled);
        swipeLock.current = true;
        pendingTarget.current = target;
        pendingDeck.current = filled;
        paint((indexRef.current - target) * heightRef.current, true);
        window.setTimeout(settlePending, 340);
        return;
      }

      indexRef.current = target;
      setDeck(filled);
      setIndex(target);
      const landed = filled[target];
      setGuess(landed?.kind === "myth" ? voteForMyth(landed.myth) : null);
      setCommentsOpen(false);
      setShareOpen(false);
      const item = filled[target];
      if (item?.kind === "myth") rememberSeenMyth(item.myth.id);
      paint(0, false);
    },
    [ads, myths, settlePending],
  );

  const go = useCallback(
    (delta: number) => {
      goTo(indexRef.current + delta, false);
    },
    [goTo],
  );

  const vote = useCallback(
    (value: "TRUE" | "FALSE") => {
      const currentItem = deckRef.current[indexRef.current];
      const live = currentItem?.kind === "myth" ? currentItem.myth : null;
      if (!live) return;
      if (live.myVote === value) return;
      if (live.myVote && !me?.profile) return;

      const signedIn = Boolean(me?.profile);
      const previous = live;
      const generation = (pendingVotesRef.current.get(live.id)?.generation ?? 0) + 1;
      const optimistic = applyVoteToMyth(live, value, signedIn);
      pendingVotesRef.current.set(live.id, { generation, previous });
      rememberMyVote(live.id, value);
      setGuess(value);
      setDeck((now) => mergeMyth(now, optimistic));

      void api
        .vote(live.slug, value)
        .then((result) => {
          const pending = pendingVotesRef.current.get(live.id);
          if (pending?.generation !== generation) return;
          pendingVotesRef.current.delete(live.id);
          rememberMyVote(result.myth.id, result.vote.value);
          setDeck((now) => mergeMyth(now, result.myth));
          const shown = deckRef.current[indexRef.current];
          if (shown?.kind === "myth" && shown.myth.id === result.myth.id) {
            setGuess(result.vote.value);
          }
        })
        .catch(() => {
          const pending = pendingVotesRef.current.get(live.id);
          if (pending?.generation !== generation) return;
          pendingVotesRef.current.delete(live.id);
          if (previous.myVote) rememberMyVote(previous.id, previous.myVote);
          else forgetMyVote(previous.id);
          setDeck((now) => mergeMyth(now, previous));
          const shown = deckRef.current[indexRef.current];
          if (shown?.kind === "myth" && shown.myth.id === previous.id) {
            setGuess(previous.myVote);
          }
        });
    },
    [me?.profile],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") go(1);
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") go(-1);
      if (event.key === "f" || event.key === "F" || event.key === "1") void vote("FALSE");
      if (event.key === "t" || event.key === "T" || event.key === "2") void vote("TRUE");
    }

    function onSelectStart(event: Event) {
      if ((event.target as HTMLElement | null)?.closest("input, textarea, [data-selectable]")) {
        return;
      }
      event.preventDefault();
    }

    const feed = feedRef.current;
    window.addEventListener("keydown", onKey);
    feed?.addEventListener("selectstart", onSelectStart);
    return () => {
      window.removeEventListener("keydown", onKey);
      feed?.removeEventListener("selectstart", onSelectStart);
    };
  }, [go, vote]);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    function onEnd(event: TransitionEvent) {
      if (event.target !== node || event.propertyName !== "transform") return;
      settlePending();
    }

    node.addEventListener("transitionend", onEnd);
    return () => node.removeEventListener("transitionend", onEnd);
  }, [settlePending]);

  function startDrag(event: React.PointerEvent<HTMLElement>) {
    if (commentsOpen || shareOpen || swipeLock.current) return;
    if ((event.target as HTMLElement | null)?.closest("button, a, input, textarea, [data-share-sheet]")) {
      return;
    }
    window.getSelection()?.removeAllRanges();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      tracking: false,
      startY: event.clientY,
      lastY: event.clientY,
      lastT: Date.now(),
      velocity: 0,
    };
  }

  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current.active) return;
    const raw = event.clientY - dragRef.current.startY;
    if (!dragRef.current.tracking) {
      if (Math.abs(raw) < 10) return;
      dragRef.current.tracking = true;
    }
    event.preventDefault();
    window.getSelection()?.removeAllRanges();
    const now = Date.now();
    const dt = Math.max(1, now - dragRef.current.lastT);
    dragRef.current.velocity = (event.clientY - dragRef.current.lastY) / dt;
    dragRef.current.lastY = event.clientY;
    dragRef.current.lastT = now;

    const height = heightRef.current || feedRef.current?.clientHeight || 720;
    let offset = raw;
    if (offset > 0 && indexRef.current === 0) offset *= 0.18;
    if (offset < 0 && indexRef.current >= deckRef.current.length - 1) offset *= 0.18;
    offset = Math.max(-height, Math.min(height, offset));
    paint(offset, false);
  }

  function finishDrag(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current.active) return;
    const wasTracking = dragRef.current.tracking;
    dragRef.current.active = false;
    dragRef.current.tracking = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!wasTracking) return;

    const offset = event.clientY - dragRef.current.startY;
    const velocity = dragRef.current.velocity;
    const height = heightRef.current || 720;
    const threshold = Math.max(72, height * 0.18);
    const goNextSlide = (offset < -threshold || velocity < -0.5) && indexRef.current < deckRef.current.length - 1;
    const goPrevSlide = (offset > threshold || velocity > 0.5) && indexRef.current > 0;

    if (goNextSlide || goPrevSlide) {
      goTo(indexRef.current + (goNextSlide ? 1 : -1), true);
      return;
    }

    paint(0, true);
  }

  async function openShareOptions() {
    if (myth && typeof navigator.share === "function") {
      try {
        await openNativeShare(myth, guess);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    setShareOpen(true);
  }

  if (!current) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
        No myths yet.
      </div>
    );
  }

  const from = Math.max(0, index - WINDOW);
  const to = Math.min(deck.length - 1, index + WINDOW);

  return (
    <section
      ref={feedRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden select-none [-webkit-user-drag:none] [-webkit-touch-callout:none]"
      style={{
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        overscrollBehavior: "none",
      }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={(event) => {
        if (!dragRef.current.active) return;
        dragRef.current.active = false;
        paint(0, true);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onDragStart={(event) => event.preventDefault()}
      onWheel={(event) => {
        const now = Date.now();
        if (Math.abs(event.deltaY) < 40 || now - lastWheel < 650) return;
        setLastWheel(now);
        go(event.deltaY > 0 ? 1 : -1);
      }}
    >
      <DesktopNav
        canPrev={index > 0}
        canNext={index < deck.length - 1 || myths.length > 1}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
      />

      <div ref={trackRef} className="relative z-10 min-h-0 w-full flex-1">
        {deck.slice(from, to + 1).map((item, sliceIndex) => {
          const slot = from + sliceIndex;
          return (
            <FeedPage
              key={`${itemKey(item)}-${slot}`}
              item={item}
              slot={slot}
              number={slot + 1}
              active={slot === index}
              guess={slot === index ? guess : null}
              showStats={
                slot === index &&
                item.kind === "myth" &&
                (Boolean(guess) || item.myth.stats.responseCount > 0)
              }
              onVote={vote}
              onComments={() => setCommentsOpen(true)}
              onShare={() => {
                setCommentsOpen(false);
                void openShareOptions();
              }}
            />
          );
        })}
      </div>

      {current.kind === "myth" && myth && (
        <CommentsPanel
          slug={myth.slug}
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
        />
      )}

      {current.kind === "myth" && myth && shareOpen && (
        <ShareSheet
          myth={myth}
          guess={guess}
          onClose={() => setShareOpen(false)}
        />
      )}
    </section>
  );
}

function FeedPage({
  item,
  slot,
  number,
  active,
  guess,
  showStats,
  onVote,
  onComments,
  onShare,
}: {
  item: FeedItem;
  slot: number;
  number: number;
  active: boolean;
  guess: "TRUE" | "FALSE" | null;
  showStats: boolean;
  onVote: (value: "TRUE" | "FALSE") => void;
  onComments: () => void;
  onShare: () => void;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col bg-[var(--ink)] ${active ? "" : "pointer-events-none"}`}
      style={{
        transform: `translate3d(0, ${slot * 100}%, 0)`,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {item.kind === "ad" ? (
        <AdSlide title={item.ad.title} body={item.ad.body} href={active ? item.ad.linkUrl : null} />
      ) : (
        <MythSlide
          myth={item.myth}
          number={number}
          guess={guess}
          showStats={showStats}
          onVote={onVote}
          onComments={onComments}
          onShare={onShare}
        />
      )}
    </div>
  );
}

function MythSlide({
  myth,
  number,
  guess,
  showStats,
  onVote,
  onComments,
  onShare,
}: {
  myth: Myth;
  number: number;
  guess: "TRUE" | "FALSE" | null;
  showStats: boolean;
  onVote: (value: "TRUE" | "FALSE") => void;
  onComments: () => void;
  onShare: () => void;
}) {
  const langs = availableClaimLangs(myth.slug);
  const [lang, setLang] = useState<ClaimLang>(langs.includes("hi") ? "hi" : "en");
  const copy = mythCopy(myth.slug, lang, { title: myth.title, explanation: myth.explanation });
  const showLangPicker = langs.length > 1;

  useEffect(() => {
    const nextLangs = availableClaimLangs(myth.slug);
    const stored = readClaimLang();
    if (stored && nextLangs.includes(stored)) {
      setLang(stored);
      return;
    }
    setLang(nextLangs.includes("hi") ? "hi" : "en");
  }, [myth.slug]);

  function chooseLang(next: ClaimLang) {
    setLang(next);
    writeClaimLang(next);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center px-5 py-6 md:px-16 lg:px-20">
      <div className="flex w-full min-w-0 max-w-5xl flex-1 flex-col items-center justify-center text-center">
        <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--gold)]">
          <ShieldQuestion className="size-3.5" />
          Claim {String(number).padStart(3, "0")}
          {myth.category ? ` · ${myth.category.name}` : ""}
          {countryName(myth.countryCode) ? ` · ${countryName(myth.countryCode)}` : ""}
        </p>

        <h1 className="mt-7 max-w-full break-words font-[family-name:var(--font-display)] text-[2.25rem] leading-tight text-[var(--cream)] sm:text-5xl lg:text-6xl">
          “{copy.title}”
        </h1>
        {showLangPicker && (
          <label className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="sr-only">Read this claim in</span>
            <select
              value={lang}
              onChange={(event) => chooseLang(event.target.value as ClaimLang)}
              className="rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-3 py-1.5 text-xs text-[var(--gold)]"
            >
              {CLAIM_LANGS.filter((item) => langs.includes(item.code)).map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-10 grid w-full max-w-xl grid-cols-2 gap-3">
          <VoteButton
            value="FALSE"
            title="Myth"
            selected={guess === "FALSE"}
            percent={showStats ? myth.stats.falsePercent : null}
            onClick={() => onVote("FALSE")}
          />
          <VoteButton
            value="TRUE"
            title="Fact"
            selected={guess === "TRUE"}
            percent={showStats ? myth.stats.truePercent : null}
            onClick={() => onVote("TRUE")}
          />
        </div>
        {showStats && (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Based on {myth.stats.responseCount.toLocaleString("en-IN")} responses
          </p>
        )}
        {guess && (
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">{copy.explanation}</p>
        )}
      </div>

      <footer className="mt-6 flex w-full max-w-5xl flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
          <button
            type="button"
            onClick={onComments}
            className="inline-flex items-center gap-1.5 text-left hover:text-[var(--cream)]"
          >
            <MessageCircle className="size-4" />
            {myth.stats.commentCount} Comments
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 text-left hover:text-[var(--cream)]"
          >
            <Share2 className="size-4" />
            Share
          </button>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-4" />
            {myth.creator.displayName}
          </span>
        </div>
        <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.24em] text-[var(--muted)] md:hidden">
          <ChevronDown className="size-3.5" />
          Swipe for the next one
        </p>
      </footer>
    </div>
  );
}

function DesktopNav({
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 hidden -translate-y-1/2 px-4 md:flex md:justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-5 py-3 text-sm text-[var(--cream)] transition hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="size-5" />
        Prev
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-5 py-3 text-sm text-[var(--cream)] transition hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

function VoteButton({
  value,
  title,
  selected,
  percent,
  onClick,
}: {
  value: "TRUE" | "FALSE";
  title: string;
  selected: boolean;
  percent: number | null;
  onClick: () => void;
}) {
  const isFact = value === "TRUE";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-12 w-full items-center justify-center rounded-full border text-center text-sm font-semibold ${
        selected
          ? isFact
            ? "border-[var(--true)] bg-[var(--true)] text-[var(--cream)]"
            : "border-[var(--false)] bg-[var(--false)] text-[var(--cream)]"
          : isFact
            ? "border-[var(--true)]/40 bg-[var(--true)]/10 text-[var(--cream)] hover:bg-[var(--true)]/20"
            : "border-[var(--false)]/40 bg-[var(--false)]/10 text-[var(--cream)] hover:bg-[var(--false)]/20"
      }`}
    >
      <span className="inline-flex items-center justify-center gap-1.5">
        {selected && <Check className="size-4" />}
        <span>{title}</span>
        {percent != null && <span>{percent}%</span>}
      </span>
    </button>
  );
}

function AdSlide({
  title,
  body,
  href,
}: {
  title: string;
  body: string | null;
  href: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 text-center md:px-28">
      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
        <Megaphone className="size-4" />
        Advertisement
      </p>
      <h2 className="mt-6 max-w-2xl font-[family-name:var(--font-display)] text-4xl text-[var(--cream)]">
        {title}
      </h2>
      {body && <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">{body}</p>}
      {href && (
        <a
          href={href}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--gold)] px-5 py-2 text-sm text-[var(--gold)]"
        >
          Learn more
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  );
}
