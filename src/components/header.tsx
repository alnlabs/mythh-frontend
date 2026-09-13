"use client";

import {
  FolderOpen,
  Info,
  LogIn,
  LogOut,
  Menu,
  PenLine,
  Search,
  Shield,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useLayoutEffect, useRef, useState } from "react";

import { useAuth } from "./auth-provider";

function BrandMark() {
  const titleRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const title = titleRef.current;
    const tag = tagRef.current;
    if (!title || !tag) return;

    function fit() {
      if (!title || !tag) return;
      tag.style.fontSize = "20px";
      const target = title.getBoundingClientRect().width;
      const current = tag.getBoundingClientRect().width;
      if (target <= 0 || current <= 0) return;
      const size = parseFloat(getComputedStyle(tag).fontSize);
      tag.style.fontSize = `${(target / current) * size}px`;
    }

    void document.fonts.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(title);
    return () => observer.disconnect();
  }, []);

  return (
    <Link href="/" className="flex shrink-0 items-start gap-2">
      <Sparkles className="mt-0.5 size-5 text-[var(--gold)]" />
      <span className="flex flex-col">
        <span
          ref={titleRef}
          className="font-[family-name:var(--font-display)] text-2xl leading-none tracking-tight text-[var(--cream)]"
        >
          MYTHH
        </span>
        <span className="mt-0.5 block h-3.5 overflow-hidden">
          <span
            ref={tagRef}
            className="block origin-top scale-y-[0.68] whitespace-nowrap font-[family-name:var(--font-display)] leading-none text-[var(--gold)]"
          >
            or truth?
          </span>
        </span>
      </span>
    </Link>
  );
}

const links = [
  { href: "/categories", label: "Categories", icon: FolderOpen },
  { href: "/about", label: "About", icon: Info },
  { href: "/submit", label: "Submit", icon: PenLine },
];

export function Header() {
  const router = useRouter();
  const { me, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    if (!next) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden border-b border-[var(--line)] bg-[color:var(--ink)]/92 backdrop-blur-md">
      <div className="flex min-h-16 min-w-0 w-full items-center gap-3 px-4 py-2.5 md:gap-4 md:px-8 lg:px-12">
        <BrandMark />

        <nav className="hidden min-w-0 items-center gap-5 text-sm text-[var(--muted)] lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1.5 hover:text-[var(--cream)]"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="relative ml-auto hidden min-w-0 max-w-xl flex-1 lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search myths"
            className="w-full rounded-full border border-[var(--line)] bg-[var(--ink-soft)] py-2 pr-4 pl-10 text-sm text-[var(--cream)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--gold)]"
          />
        </form>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-3 lg:ml-0">
          {me?.profile ? (
            <>
              {me.profile.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--gold)]"
                >
                  <Shield className="size-4" />
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="inline-flex max-w-28 items-center gap-1.5 truncate text-sm text-[var(--cream)] sm:max-w-40"
              >
                <UserRound className="size-4 shrink-0" />
                <span className="truncate">
                  {me.profile.display_name ?? me.profile.email ?? "Profile"}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="hidden items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--cream)] lg:inline-flex"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={login}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[var(--ink)]"
            >
              <LogIn className="size-4" />
              Sign in
            </button>
          )}

          <button
            type="button"
            className="text-[var(--cream)] lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--line)] px-5 py-4 lg:hidden">
          <form onSubmit={onSearch} className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search myths"
              className="w-full rounded-full border border-[var(--line)] bg-[var(--ink-soft)] py-2 pr-4 pl-10 text-sm text-[var(--cream)] outline-none"
            />
          </form>
          <div className="flex flex-col gap-3 text-[var(--cream)]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2"
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            ))}
            {me?.profile ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)} className="inline-flex items-center gap-2">
                  <UserRound className="size-4" />
                  Profile
                </Link>
                {me.profile.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="inline-flex items-center gap-2">
                    <Shield className="size-4" />
                    Admin
                  </Link>
                )}
                <button type="button" className="inline-flex items-center gap-2 text-left" onClick={() => logout()}>
                  <LogOut className="size-4" />
                  Log out
                </button>
              </>
            ) : (
              <button type="button" className="inline-flex items-center gap-2 text-left" onClick={login}>
                <LogIn className="size-4" />
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
