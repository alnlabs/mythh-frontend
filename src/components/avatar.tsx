"use client";

import { useEffect, useState } from "react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0] ?? "";
  if (first.includes("@")) return first[0]?.toUpperCase() ?? "?";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();

  return `${first[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function Avatar({
  src,
  name,
  className = "size-20 text-2xl",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--ink)] font-[family-name:var(--font-display)] text-[var(--gold)] ${className}`}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? ""}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
