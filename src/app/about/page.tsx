import {
  Check,
  FolderOpen,
  MessageCircle,
  PenLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

import { DisclaimerSection } from "@/components/disclaimer";
import { MythMark } from "@/components/myth-mark";
import { SITE_HOST, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Myth is a swipe-based way to meet popular claims, choose Myth or Fact, and learn in public.",
  path: "/about",
});

const steps = [
  {
    title: "Meet a claim",
    body: "Each card is one popular belief. Swipe on your phone or use Prev and Next on desktop.",
  },
  {
    title: "Call Myth or Fact",
    body: "Pick Myth or Fact. The crowd split is on the claim, and your choice is marked after you answer. Sign in only if you want to comment.",
  },
  {
    title: "Talk it through",
    body: "Open comments, or send the claim’s page link to a friend.",
  },
];

const values = [
  {
    icon: Sparkles,
    title: "Browse freely",
    body: "Read the feed, search, and open any myth page without an account.",
  },
  {
    icon: ShieldCheck,
    title: "Comment with a name",
    body: "Browse and vote without an account. Sign in with Google to comment or submit. No password to remember.",
  },
  {
    icon: PenLine,
    title: "Editors first",
    body: "New claims stay pending until someone reviews them. Nothing jumps the queue.",
  },
  {
    icon: MessageCircle,
    title: "Ads stay in the stack",
    body: "Sponsored cards appear as occasional slides. No popups. No overlays.",
  },
];

export default function AboutPage() {
  return (
    <div className="page-shell">
      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
        <MythMark className="size-4" />
        About
      </p>
      <h1 className="mt-4 max-w-5xl font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--cream)] md:text-6xl xl:text-7xl">
        Guess the claim. Then see what people believe.
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">
        Myth is a swipe stack of popular claims. Cards in the feed are AI-generated from public
        claims on the open internet. You pick <span className="text-[var(--cream)]">Myth</span> or{" "}
        <span className="text-[var(--cream)]">Fact</span>, watch the split, and keep going. Login is only for
        actions that change the record.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[var(--on-gold)]"
        >
          Start the feed
        </Link>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-5 py-3 text-sm text-[var(--cream)]"
        >
          <FolderOpen className="size-4" />
          Browse categories
        </Link>
      </div>

      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-[var(--false)]/40 bg-[var(--false)]/15 px-5 py-6">
          <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--false)]">
            <X className="size-4" />
            Myth
          </p>
          <p className="mt-3 text-[var(--cream)]">I don’t buy it. This claim should not stand.</p>
        </div>
        <div className="rounded-3xl border border-[var(--true)]/40 bg-[var(--true)]/15 px-5 py-6">
          <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--true)]">
            <Check className="size-4" />
            Fact
          </p>
          <p className="mt-3 text-[var(--cream)]">I buy it. This one sounds true enough to stand.</p>
        </div>
      </div>

      <h2 className="mt-16 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)]">
        How a session goes
      </h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-xl text-[var(--cream)]">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{step.body}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-16 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)]">
        How we keep it clean
      </h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {values.map((value) => (
          <li key={value.title} className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
            <h3 className="inline-flex items-center gap-2 text-lg text-[var(--cream)]">
              <value.icon className="size-5 text-[var(--gold)]" />
              {value.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{value.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-16 rounded-3xl border border-[var(--gold)]/30 bg-[var(--ink-soft)] px-6 py-8 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--cream)]">
          Got a claim we should test?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
          Sign in and submit it. An editor reads it before it reaches the feed.
        </p>
        <Link
          href="/submit"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[var(--on-gold)]"
        >
          <PenLine className="size-4" />
          Submit a myth
        </Link>
      </div>

      <DisclaimerSection />

      <p className="mt-10 text-center text-sm text-[var(--muted)]">{SITE_HOST} · or truth?</p>
    </div>
  );
}
