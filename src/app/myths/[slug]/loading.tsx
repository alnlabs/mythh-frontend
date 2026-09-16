export default function MythLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-6">
      <div className="h-6 w-52 animate-pulse rounded-full bg-[var(--ink-soft)]" />
      <div className="mt-8 h-20 w-full max-w-3xl animate-pulse rounded-2xl bg-[var(--ink-soft)]" />
      <div className="mt-10 grid w-full max-w-xl grid-cols-2 gap-3">
        <div className="h-12 animate-pulse rounded-full bg-[var(--ink-soft)]" />
        <div className="h-12 animate-pulse rounded-full bg-[var(--ink-soft)]" />
      </div>
    </div>
  );
}
