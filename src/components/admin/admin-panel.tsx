"use client";

import {
  Check,
  Clock3,
  Eye,
  EyeOff,
  Flag,
  LogIn,
  Megaphone,
  MessageCircle,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { verdictLabel } from "@/lib/feed";

type Tab = "queue" | "comments" | "reports" | "people" | "ads";
type Dashboard = Awaited<ReturnType<typeof api.dashboard>>;
type Pending = Awaited<ReturnType<typeof api.pendingMyths>>["myths"];
type Comments = Awaited<ReturnType<typeof api.adminComments>>["comments"];
type Reports = Awaited<ReturnType<typeof api.adminReports>>["reports"];
type People = Awaited<ReturnType<typeof api.adminUsers>>["users"];
type Ads = Awaited<ReturnType<typeof api.adminAdvertisements>>["advertisements"];

const tabs: { id: Tab; label: string }[] = [
  { id: "queue", label: "Queue" },
  { id: "comments", label: "Comments" },
  { id: "reports", label: "Reports" },
  { id: "people", label: "People" },
  { id: "ads", label: "Ads" },
];

function when(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminPanel() {
  const { me, loading, login } = useAuth();
  const [tab, setTab] = useState<Tab>("queue");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [pending, setPending] = useState<Pending>([]);
  const [comments, setComments] = useState<Comments>([]);
  const [reports, setReports] = useState<Reports>([]);
  const [people, setPeople] = useState<People>([]);
  const [ads, setAds] = useState<Ads>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [adTitle, setAdTitle] = useState("");
  const [adBody, setAdBody] = useState("");
  const [adLink, setAdLink] = useState("");

  async function load() {
    const [nextDashboard, nextPending, nextComments, nextReports, nextPeople, nextAds] =
      await Promise.all([
        api.dashboard(),
        api.pendingMyths(),
        api.adminComments(),
        api.adminReports(),
        api.adminUsers(),
        api.adminAdvertisements(),
      ]);
    setDashboard(nextDashboard);
    setPending(nextPending.myths);
    setComments(nextComments.comments);
    setReports(nextReports.reports);
    setPeople(nextPeople.users);
    setAds(nextAds.advertisements);
  }

  useEffect(() => {
    if (loading || me?.profile?.role !== "ADMIN") return;
    let active = true;
    Promise.resolve()
      .then(() => load())
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Admin access failed");
        }
      });
    return () => {
      active = false;
    };
  }, [loading, me]);

  function submitAd() {
    if (adTitle.trim().length < 2) {
      setError("Give the ad a title of at least 2 characters.");
      return;
    }
    void run("new-ad", async () => {
      await api.createAdvertisement({
        title: adTitle,
        body: adBody || undefined,
        linkUrl: adLink || undefined,
        isActive: true,
      });
      setAdTitle("");
      setAdBody("");
      setAdLink("");
    });
  }

  async function run(id: string, action: () => Promise<void>) {
    setBusy(id);
    setError("");
    try {
      await action();
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed");
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 text-[var(--muted)]">
        Loading the desk…
      </div>
    );
  }

  if (!me?.profile) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-12 text-center">
        <p className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
          <Shield className="size-3.5" />
          Editors only
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl">Admin</h1>
        <p className="mt-3 text-[var(--muted)]">Sign in to review claims, comments, and ads.</p>
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

  if (me.profile.role !== "ADMIN") {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-12 text-center">
        <Shield className="mx-auto size-8 text-[var(--gold)]" />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl">This desk is closed</h1>
        <p className="mt-3 text-[var(--muted)]">
          You are signed in as {me.profile.display_name ?? "a reader"}. Ask an editor to add you.
        </p>
      </div>
    );
  }

  const stats = dashboard?.stats;

  return (
    <div className="page-shell">
      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
        <Shield className="size-3.5" />
        Editor desk
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">Admin</h1>
        <p className="text-sm text-[var(--muted)]">
          Signed in as {dashboard?.admin?.display_name ?? me.profile.display_name}
        </p>
      </div>

      {error && <p className="mt-4 rounded-2xl bg-[var(--false)]/15 px-4 py-3 text-sm text-[var(--false)]">{error}</p>}

      {stats && (
        <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Stat icon={Clock3} label="Pending" value={stats.myths.pending} />
          <Stat icon={Check} label="Approved" value={stats.myths.approved} />
          <Stat icon={X} label="Rejected" value={stats.myths.rejected} />
          <Stat icon={Users} label="People" value={stats.users} />
          <Stat icon={MessageCircle} label="Comments" value={stats.comments} />
          <Stat icon={Flag} label="Open reports" value={stats.openReports} />
          <Stat icon={Megaphone} label="Ads" value={stats.advertisements} />
          <Stat icon={Shield} label="Votes" value={stats.votes} />
        </dl>
      )}

      <div className="mt-10 flex max-w-full gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              tab === item.id
                ? "bg-[var(--gold)] text-[var(--ink)]"
                : "border border-[var(--line)] text-[var(--cream)]"
            }`}
          >
            {item.label}
            {item.id === "queue" && stats ? ` ${stats.myths.pending}` : ""}
            {item.id === "reports" && stats ? ` ${stats.openReports}` : ""}
          </button>
        ))}
      </div>

      {tab === "queue" && (
        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          {pending.length === 0 && <div className="xl:col-span-2"><Empty>No claims waiting.</Empty></div>}
          {pending.map((myth) => (
            <article key={myth.id} className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                {verdictLabel(myth.verdict)} · {myth.status}
              </p>
              <h2 className="mt-2 text-2xl text-[var(--cream)]">{myth.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{myth.explanation}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy === myth.id}
                  onClick={() => void run(myth.id, () => api.approveMyth(myth.id).then(() => undefined))}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--true)] px-4 py-2 text-sm"
                >
                  <Check className="size-4" />
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy === myth.id}
                  onClick={() => void run(myth.id, () => api.rejectMyth(myth.id).then(() => undefined))}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--false)] px-4 py-2 text-sm"
                >
                  <X className="size-4" />
                  Reject
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === "comments" && (
        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          {comments.length === 0 && <div className="xl:col-span-2"><Empty>No comments yet.</Empty></div>}
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                {comment.status} · {comment.user?.display_name ?? "Unknown"} · {when(comment.created_at)}
              </p>
              <p className="mt-3 text-[var(--cream)]">{comment.content}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void run(comment.id, () =>
                      api
                        .setCommentStatus(comment.id, comment.status === "VISIBLE" ? "HIDDEN" : "VISIBLE")
                        .then(() => undefined),
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                >
                  {comment.status === "VISIBLE" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  {comment.status === "VISIBLE" ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void run(comment.id, () => api.deleteAdminComment(comment.id).then(() => undefined))
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--false)] px-4 py-2 text-sm"
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === "reports" && (
        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          {reports.length === 0 && <div className="xl:col-span-2"><Empty>No reports.</Empty></div>}
          {reports.map((report) => (
            <article key={report.id} className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                {report.status} · {report.target} · {report.reporter?.display_name ?? "Anonymous"}
              </p>
              <p className="mt-3 text-[var(--cream)]">{report.reason}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{when(report.created_at)}</p>
              {report.status === "OPEN" && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      void run(report.id, () => api.setReportStatus(report.id, "REVIEWED").then(() => undefined))
                    }
                    className="inline-flex items-center justify-center rounded-full bg-[var(--true)] px-4 py-2 text-sm"
                  >
                    Mark reviewed
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      void run(report.id, () => api.setReportStatus(report.id, "DISMISSED").then(() => undefined))
                    }
                    className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {tab === "people" && (
        <section className="mt-6 space-y-3">
          {people.length === 0 && <Empty>No people yet.</Empty>}
          {people.map((person) => (
            <article
              key={person.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] px-5 py-4"
            >
              <div>
                <p className="text-[var(--cream)]">{person.display_name ?? "Unnamed"}</p>
                <p className="text-sm text-[var(--muted)]">
                  {person.email ?? "No email"} · {person.role} · {person.status}
                </p>
              </div>
              {person.id !== me.profile.id && (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void run(person.id, () =>
                      api
                        .setUserStatus(person.id, person.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")
                        .then(() => undefined),
                    )
                  }
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                >
                  {person.status === "ACTIVE" ? "Suspend" : "Restore"}
                </button>
              )}
            </article>
          ))}
        </section>
      )}

      {tab === "ads" && (
        <section className="mt-6 space-y-4">
          <form
            noValidate
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              submitAd();
            }}
            className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5"
          >
            <h2 className="text-sm uppercase tracking-[0.2em] text-[var(--gold)]">New slide</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={adTitle}
                onChange={(event) => setAdTitle(event.target.value)}
                placeholder="Title"
                className="rounded-2xl border border-[var(--line)] bg-[var(--ink)] px-4 py-3"
              />
              <input
                value={adLink}
                onChange={(event) => setAdLink(event.target.value)}
                placeholder="https://example.com"
                className="rounded-2xl border border-[var(--line)] bg-[var(--ink)] px-4 py-3"
              />
            </div>
            <textarea
              value={adBody}
              onChange={(event) => setAdBody(event.target.value)}
              placeholder="Optional body"
              rows={3}
              className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--ink)] px-4 py-3"
            />
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={submitAd}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[var(--ink)]"
            >
              Add ad
            </button>
          </form>

          {ads.length === 0 && <Empty>No advertisements yet.</Empty>}
          {ads.map((ad) => (
            <article key={ad.id} className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                {ad.is_active ? "Live" : "Off"} · {when(ad.created_at)}
              </p>
              <h2 className="mt-2 text-xl text-[var(--cream)]">{ad.title}</h2>
              {ad.body && <p className="mt-2 text-sm text-[var(--muted)]">{ad.body}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void run(ad.id, () => api.setAdvertisementActive(ad.id, !ad.is_active).then(() => undefined))
                  }
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                >
                  {ad.is_active ? "Turn off" : "Turn on"}
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void run(ad.id, () => api.deleteAdvertisement(ad.id).then(() => undefined))}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--false)] px-4 py-2 text-sm"
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-4">
      <dt className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-2 font-[family-name:var(--font-display)] text-3xl">{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="rounded-3xl border border-dashed border-[var(--line)] px-5 py-10 text-center text-[var(--muted)]">{children}</p>;
}
