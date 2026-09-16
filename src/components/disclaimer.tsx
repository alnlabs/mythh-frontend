import Link from "next/link";

export const DISCLAIMER_LINE =
  "Cards are AI-generated from public claims on the open internet. For curiosity, not professional advice.";

export function SiteDisclaimer() {
  return (
    <p className="shrink-0 border-t border-[var(--line)] px-4 py-2.5 text-center text-[11px] leading-5 text-[var(--muted)]">
      {DISCLAIMER_LINE}{" "}
      <Link href="/about#disclaimer" className="text-[var(--gold)] hover:text-[var(--cream)]">
        Read the full note
      </Link>
    </p>
  );
}

export function DisclaimerSection() {
  return (
    <section
      id="disclaimer"
      className="mt-16 scroll-mt-24 rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] px-6 py-8"
    >
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">Disclaimer</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)]">
        AI write-ups of public claims. Not professional advice.
      </h2>
      <div className="mt-4 max-w-3xl space-y-3 text-sm leading-7 text-[var(--muted)]">
        <p>
          Seeded cards are AI-generated summaries of popular claims collected from the open internet
          — widely repeated public stories, not a copy of any one publisher’s article.
        </p>
        <p>
          Myth is a game. Explanations are short write-ups for voting and talk, not medical, legal,
          financial, or other professional advice. A Myth or Fact tally is what people here chose,
          not a diagnosis or a court finding.
        </p>
        <p>
          Do not start, stop, or change treatment, medicine, or any high-stakes action because of a
          card. If a claim touches your health or safety, ask a qualified professional.
        </p>
      </div>
    </section>
  );
}
