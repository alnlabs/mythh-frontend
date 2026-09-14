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
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { CommentsPanel } from "@/components/comments-panel";
import { ShareSheet } from "@/components/feed/share-sheet";
import { api, ApiError } from "@/lib/api";
import {
  pickNextMyth,
  pickRandomAd,
  readSeenMyths,
  rememberSeenMyth,
  shouldShowAd,
} from "@/lib/feed";
import { openNativeShare } from "@/lib/share-card";
import { countryName } from "@/lib/country";
import type { FeedItem, Myth } from "@/lib/types";

function startItem(items: FeedItem[]) {
  return items.find((item) => item.kind === "myth") ?? items[0] ?? null;
}

function startMyth(items: FeedItem[]) {
  const first = startItem(items);
  return first?.kind === "myth" ? first.myth : null;
}

export function SlideFeed({ items }: { items: FeedItem[] }) {
  const { me, login, loading } = useAuth();
  const myths = useMemo(
    () => items.filter((item): item is Extract<FeedItem, { kind: "myth" }> => item.kind === "myth").map((item) => item.myth),
    [items],
  );
  const ads = useMemo(
    () => items.filter((item): item is Extract<FeedItem, { kind: "ad" }> => item.kind === "ad").map((item) => item.ad),
    [items],
  );
  const [current, setCurrent] = useState<FeedItem | null>(() => startItem(items));
  const [history, setHistory] = useState<FeedItem[]>([]);
  const [seen, setSeen] = useState<string[]>(() => readSeenMyths());
  const [guess, setGuess] = useState<"TRUE" | "FALSE" | null>(null);
  const [myth, setMyth] = useState<Myth | null>(() => startMyth(items));
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [lastWheel, setLastWheel] = useState(0);
  const feedRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startY: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
  });
  const swipeLock = useRef(false);
  const startId = startMyth(items)?.id ?? "";
  const lastMythRef = useRef<Myth | null>(myth);
  if (myth) lastMythRef.current = myth;
  const stateRef = useRef({ current, history, seen, commentsOpen, shareOpen });
  stateRef.current = { current, history, seen, commentsOpen, shareOpen };

  useEffect(() => {
    const firstMyth = myths.find((item) => item.id === startId);
    if (!firstMyth) return;
    setCurrent({ kind: "myth", myth: firstMyth });
    setHistory([]);
    setGuess(null);
    setCommentsOpen(false);
    setShareOpen(false);
    setMyth(firstMyth);
    setSeen(rememberSeenMyth(firstMyth.id));
    // Only reset when the opened claim changes, not when the pool refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startId is the session key
  }, [startId]);

  useEffect(() => {
    if (!myth) return;
    const next = `/myths/${myth.slug}`;
    if (window.location.pathname === next) return;
    window.history.replaceState(window.history.state, "", next);
    document.title = `${myth.title} · MYTHH`;
  }, [myth]);

  const showItem = useCallback((item: FeedItem | null) => {
    if (!item) return;
    setCurrent(item);
    setGuess(null);
    setCommentsOpen(false);
    setShareOpen(false);
    if (item.kind === "myth") {
      setMyth(item.myth);
      setSeen(rememberSeenMyth(item.myth.id));
    } else {
      setMyth(null);
    }
  }, []);

  const goNext = useCallback(() => {
    const { current: now, history: past, seen: seenIds, commentsOpen: comments, shareOpen: sharing } =
      stateRef.current;
    if (!now || comments || sharing) return;
    if (myths.length <= 1 && (now.kind === "ad" || ads.length === 0)) return;

    if (now.kind === "myth" && shouldShowAd(false, ads.length > 0)) {
      const ad = pickRandomAd(ads, null);
      if (ad) {
        setHistory([...past, now]);
        showItem({ kind: "ad", ad });
        return;
      }
    }

    const nextMyth = pickNextMyth(
      myths,
      now.kind === "myth" ? now.myth : lastMythRef.current,
      seenIds,
    );
    if (!nextMyth || (now.kind === "myth" && nextMyth.id === now.myth.id)) return;
    setHistory([...past, now]);
    showItem({ kind: "myth", myth: nextMyth });
  }, [ads, myths, showItem]);

  const goPrev = useCallback(() => {
    const { history: past, commentsOpen: comments, shareOpen: sharing } = stateRef.current;
    if (comments || sharing || past.length === 0) return;
    const previous = past[past.length - 1];
    if (!previous) return;
    setHistory(past.slice(0, -1));
    showItem(previous);
  }, [showItem]);

  const go = useCallback(
    (delta: number) => {
      if (delta > 0) goNext();
      else goPrev();
    },
    [goNext, goPrev],
  );

  const vote = useCallback(
    async (value: "TRUE" | "FALSE") => {
      if (!myth || guess === value || loading) return;

      if (!me?.profile) {
        login();
        return;
      }

      setGuess(value);

      try {
        await api.vote(myth.slug, value);
        const next = await api.myth(myth.slug);
        setMyth(next.myth);
        setCurrent((now) =>
          now?.kind === "myth" && now.myth.id === next.myth.id ? { kind: "myth", myth: next.myth } : now,
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          login();
        }
      }
    },
    [guess, loading, login, me?.profile, myth],
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

  function applySwipe(y: number, animated: boolean) {
    const node = cardRef.current;
    if (!node) return;
    const distance = Math.abs(y);
    const shrink = 1 - Math.min(0.045, distance / 4200);
    node.style.transition = animated
      ? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease"
      : "none";
    node.style.transform = `translate3d(0, ${y}px, 0) scale(${shrink})`;
    node.style.opacity = String(1 - Math.min(0.42, distance / 780));
  }

  function startDrag(event: React.PointerEvent<HTMLElement>) {
    if (commentsOpen || shareOpen || swipeLock.current) return;
    if ((event.target as HTMLElement | null)?.closest("button, a, input, textarea, [data-share-sheet]")) {
      return;
    }
    window.getSelection()?.removeAllRanges();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      startY: event.clientY,
      lastY: event.clientY,
      lastT: Date.now(),
      velocity: 0,
    };
    applySwipe(0, false);
  }

  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current.active) return;
    event.preventDefault();
    window.getSelection()?.removeAllRanges();
    const now = Date.now();
    const dt = Math.max(1, now - dragRef.current.lastT);
    dragRef.current.velocity = (event.clientY - dragRef.current.lastY) / dt;
    dragRef.current.lastY = event.clientY;
    dragRef.current.lastT = now;
    let offset = event.clientY - dragRef.current.startY;
    if (offset > 0 && history.length === 0) offset *= 0.22;
    applySwipe(offset, false);
  }

  function finishDrag(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const offset = event.clientY - dragRef.current.startY;
    const velocity = dragRef.current.velocity;
    const height = feedRef.current?.clientHeight ?? 720;
    const goNextSlide = offset < -64 || velocity < -0.55;
    const goPrevSlide = (offset > 64 || velocity > 0.55) && history.length > 0;

    if (goNextSlide || goPrevSlide) {
      swipeLock.current = true;
      applySwipe(goNextSlide ? -height : height, true);
      window.setTimeout(() => {
        go(goNextSlide ? 1 : -1);
        applySwipe(0, false);
        swipeLock.current = false;
      }, 260);
      return;
    }

    applySwipe(0, true);
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

  return (
    <section
      ref={feedRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden select-none [-webkit-user-drag:none] [-webkit-touch-callout:none]"
      style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={(event) => {
        if (!dragRef.current.active) return;
        dragRef.current.active = false;
        applySwipe(0, true);
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
        canPrev={history.length > 0}
        canNext={myths.length > 1 || (Boolean(current && current.kind === "myth") && ads.length > 0)}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
      />

      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 justify-center md:hidden">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--gold)]/50">
          {history.length > 0 ? "Swipe" : "Swipe up"}
        </p>
      </div>

      <div
        ref={cardRef}
        className="relative z-10 flex min-h-0 w-full flex-1 flex-col will-change-transform"
      >
        {current.kind === "ad" ? (
          <AdSlide title={current.ad.title} body={current.ad.body} href={current.ad.linkUrl} />
        ) : (
          <MythSlide
            key={(myth ?? current.myth).id}
            myth={myth ?? current.myth}
            number={
              history.filter((item) => item.kind === "myth").length + 1
            }
            guess={guess}
            showStats={Boolean(guess && me?.profile)}
            onVote={vote}
            onComments={() => setCommentsOpen(true)}
            onShare={() => {
              setCommentsOpen(false);
              void openShareOptions();
            }}
          />
        )}
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

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center px-5 py-6 md:px-16 lg:px-20">
      <div className="flex w-full min-w-0 max-w-5xl flex-1 flex-col items-center justify-center text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ink-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--gold)]">
          <ShieldQuestion className="size-3.5" />
          Claim {String(number).padStart(3, "0")}
          {myth.category ? ` · ${myth.category.name}` : ""}
          {countryName(myth.countryCode) ? ` · ${countryName(myth.countryCode)}` : ""}
        </p>

        <h1 className="mt-7 max-w-full break-words font-[family-name:var(--font-display)] text-[2.25rem] leading-tight text-[var(--cream)] sm:text-5xl lg:text-6xl">
          “{myth.title}”
        </h1>

        <div className="mt-10 grid w-full max-w-xl grid-cols-2 gap-3">
          <VoteButton
            value="FALSE"
            title="Myth"
            selected={guess === "FALSE"}
            onClick={() => onVote("FALSE")}
          />
          <VoteButton
            value="TRUE"
            title="Fact"
            selected={guess === "TRUE"}
            onClick={() => onVote("TRUE")}
          />
        </div>
        {showStats && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <X className="size-4 text-[var(--false)]" />
              Myth {myth.stats.falsePercent}%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-[var(--true)]" />
              Fact {myth.stats.truePercent}%
            </span>
          </div>
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
  onClick,
}: {
  value: "TRUE" | "FALSE";
  title: string;
  selected: boolean;
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
