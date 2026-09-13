"use client";

import {
  Clock3,
  FolderOpen,
  LogIn,
  LogOut,
  Mail,
  PenLine,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { verdictLabel } from "@/lib/feed";

type Submission = Awaited<ReturnType<typeof api.myMyths>>["myths"][number];

function statusLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "Live";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending review";
  }
}

export default function ProfilePage() {
  const { me, loading, login, logout } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!me?.profile) return;

    let active = true;
    api
      .myMyths()
      .then((result) => {
        if (active) setSubmissions(result.myths);
      })
      .catch(() => {
        if (active) setSubmissions([]);
      });

    return () => {
      active = false;
    };
  }, [me?.profile]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 text-[var(--muted)]">
        Loading your profile…
      </div>
    );
  }

  if (!me?.profile) {
    return (
      <div className="page-shell flex flex-col justify-center text-center">
        <p className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
          <UserRound className="size-3.5" />
          Your desk
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl">Profile</h1>
        <p className="mt-3 text-[var(--muted)]">
          Sign in to vote Myth or Fact, comment, and submit claims.
        </p>
        <button
          type="button"
          onClick={login}
          className="mx-auto mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-6 py-3 text-[var(--ink)]"
        >
          <LogIn className="size-4" />
          Sign in with Google
        </button>
      </div>
    );
  }

  const name = me.profile.display_name ?? me.profile.email ?? "MYTHH member";
  const pending = submissions.filter((myth) => myth.status === "PENDING").length;
  const live = submissions.filter((myth) => myth.status === "APPROVED").length;

  return (
    <div className="page-shell">
      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
        <Sparkles className="size-3.5" />
        Profile
      </p>

      <div className="mt-6 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <section className="h-fit rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {me.profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.profile.avatar_url}
              alt=""
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--gold)]">
              <UserRound className="size-8" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-[family-name:var(--font-display)] text-4xl text-[var(--cream)]">
              {name}
            </h1>
            <p className="mt-2 inline-flex items-center gap-2 text-[var(--muted)]">
              <Mail className="size-4" />
              {me.profile.email ?? "No email on file"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/40 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                <Shield className="size-3.5" />
                {me.profile.role === "ADMIN" ? "Editor" : "Member"}
              </span>
              <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                {me.profile.status === "ACTIVE" ? "Active" : "Suspended"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)]"
          >
            Back to the feed
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] px-5 py-2.5 text-sm text-[var(--cream)]"
          >
            <PenLine className="size-4" />
            Submit a claim
          </Link>
          {me.profile.role === "ADMIN" && (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--gold)]/40 px-5 py-2.5 text-sm text-[var(--gold)]"
            >
              <Shield className="size-4" />
              Admin desk
            </Link>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] px-5 py-2.5 text-sm text-[var(--muted)]"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--ink)] p-4">
          <dt className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            <Clock3 className="size-3.5" />
            Pending
          </dt>
          <dd className="mt-2 font-[family-name:var(--font-display)] text-3xl">{pending}</dd>
        </div>
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--ink)] p-4">
          <dt className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            <Sparkles className="size-3.5" />
            Live
          </dt>
          <dd className="mt-2 font-[family-name:var(--font-display)] text-3xl">{live}</dd>
        </div>
      </dl>
      </section>

      <section>
      <h2 className="font-[family-name:var(--font-display)] text-3xl">Your claims</h2>
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {submissions.length === 0 && (
          <li className="rounded-3xl border border-dashed border-[var(--line)] px-5 py-10 text-center text-[var(--muted)]">
            You have not submitted a claim yet.
            <Link href="/submit" className="mt-3 block text-[var(--gold)]">
              Send the first one
            </Link>
          </li>
        )}
        {submissions.map((myth) => {
          const body = (
            <>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                {statusLabel(myth.status)} · {verdictLabel(myth.verdict)}
              </p>
              <h3 className="mt-2 text-xl text-[var(--cream)]">{myth.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {new Date(myth.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </>
          );

          return (
            <li key={myth.id}>
              {myth.status === "APPROVED" ? (
                <Link
                  href={`/myths/${myth.slug}`}
                  className="block rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5 hover:border-[var(--gold)]"
                >
                  {body}
                </Link>
              ) : (
                <div className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-10 inline-flex items-center gap-2 text-sm text-[var(--muted)]">
        <FolderOpen className="size-4" />
        Browse more in categories if you want a different stack.
      </p>
      </section>
      </div>
    </div>
  );
}
