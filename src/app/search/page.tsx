import { Search } from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api";
import { verdictLabel } from "@/lib/feed";

export const metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const myths = q ? (await api.search(q)).myths : [];

  return (
    <div className="page-shell">
      <h1 className="inline-flex items-center gap-3 font-[family-name:var(--font-display)] text-4xl">
        <Search className="size-8 text-[var(--gold)]" />
        Search
      </h1>
      <form noValidate className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Try Napoleon, brain, water..."
          className="w-full rounded-full border border-[var(--line)] bg-[var(--ink-soft)] py-3 pr-5 pl-12 text-[var(--cream)] outline-none"
        />
      </form>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {q && myths.length === 0 && (
          <li className="text-[var(--muted)]">No myths matched “{q}”.</li>
        )}
        {myths.map((myth) => (
          <li key={myth.id}>
            <Link href={`/myths/${myth.slug}`} className="block rounded-3xl bg-[var(--ink-soft)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                {verdictLabel(myth.verdict)}
              </p>
              <h2 className="mt-2 text-2xl">{myth.title}</h2>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
