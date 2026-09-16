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
import { FormEvent, useState } from "react";

import { Avatar } from "./avatar";
import { useAuth } from "./auth-provider";
import { CategorySwitch } from "./category-switch";
import { CountrySwitch } from "./country-switch";
import { ThemeToggle } from "./theme-toggle";

function BrandMark() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-1.5">
      <Sparkles className="size-4 shrink-0 text-[var(--gold)] sm:size-5" />
      <span className="min-w-0 leading-tight">
        <span className="block font-[family-name:var(--font-display)] text-[1.15rem] leading-none tracking-tight text-[var(--cream)] sm:text-2xl">
          Myth
        </span>
        <span className="mt-0.5 block font-[family-name:var(--font-display)] text-[0.7rem] leading-none text-[var(--gold)] max-[359px]:hidden sm:text-sm">
          or truth?
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

export function Header({ country, category }: { country: string; category: string }) {
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

  const signedIn = Boolean(me?.profile);

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden border-b border-[var(--line)] bg-[color:var(--ink)]/92 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <div className="flex w-full min-w-0 items-center gap-1.5 px-2 py-2 sm:gap-3 sm:px-4 lg:px-8">
        <div className="min-w-0 shrink-0">
          <BrandMark />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden sm:max-w-md sm:gap-2">
          <div className="min-w-0 flex-1 basis-0">
            <CategorySwitch value={category} compact />
          </div>
          <div className="min-w-0 flex-1 basis-0">
            <CountrySwitch value={country} compact />
          </div>
        </div>

        <nav className="hidden min-w-0 shrink-0 items-center gap-4 text-sm text-[var(--muted)] xl:flex">
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

        <form noValidate onSubmit={onSearch} className="relative hidden min-w-0 max-w-xs flex-1 lg:block lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search myths"
            className="w-full min-w-0 rounded-full border border-[var(--line)] bg-[var(--ink-soft)] py-2 pr-4 pl-10 text-sm text-[var(--cream)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--gold)]"
          />
        </form>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {signedIn ? (
            <>
              {me?.profile?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-1.5 text-sm text-[var(--gold)] xl:inline-flex"
                >
                  <Shield className="size-4" />
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 truncate text-sm text-[var(--cream)]"
                aria-label="Profile"
              >
                <Avatar
                  src={me?.profile?.avatar_url}
                  name={me?.profile?.display_name ?? me?.profile?.email ?? "Profile"}
                  className="size-7 text-[10px]"
                />
                <span className="hidden max-w-32 truncate xl:inline">
                  {me?.profile?.display_name ?? me?.profile?.email ?? "Profile"}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="hidden items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--cream)] xl:inline-flex"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={login}
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[var(--gold)] px-2.5 py-1 text-[11px] font-medium text-[var(--on-gold)] sm:px-4 sm:py-2 sm:text-sm"
            >
              <LogIn className="mr-1 hidden size-4 sm:inline" />
              Sign in
            </button>
          )}

          <button
            type="button"
            className="p-1 text-[var(--cream)] xl:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--line)] px-4 py-4 xl:hidden">
          <form noValidate onSubmit={onSearch} className="relative mb-4 lg:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search myths"
              className="w-full rounded-full border border-[var(--line)] bg-[var(--ink-soft)] py-2 pr-4 pl-10 text-sm text-[var(--cream)] outline-none"
            />
          </form>
          <div className="flex flex-col gap-3 text-[var(--cream)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">Theme</span>
              <ThemeToggle />
            </div>
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
