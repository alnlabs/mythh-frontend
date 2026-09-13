import { redirect } from "next/navigation";

import { api } from "@/lib/api";
import { shuffle } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const { myths } = await api.myths("?limit=50").catch(() => ({ myths: [] }));
  const pick = shuffle(myths)[0];
  const { auth } = await searchParams;

  if (!pick) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-[var(--muted)]">
        No myths yet.
      </div>
    );
  }

  const next = auth ? `/myths/${pick.slug}?auth=${encodeURIComponent(auth)}` : `/myths/${pick.slug}`;
  redirect(next);
}
