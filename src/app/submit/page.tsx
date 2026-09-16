"use client";

import { FolderOpen, Globe, Link2, PenLine, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { SWITCH_COUNTRIES, countryName, readGuestCountry } from "@/lib/country";
import type { Category } from "@/lib/types";

export default function SubmitPage() {
  const { me, login, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [countryCode, setCountryCode] = useState("global");
  const [countryReady, setCountryReady] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ title?: string; explanation?: string }>({});

  useEffect(() => {
    api.categories().then((result) => {
      setCategories(result.categories);
      setCategoryId(result.categories[0]?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (loading || countryReady) return;
    setCountryCode(me?.profile?.country_code ?? readGuestCountry() ?? "global");
    setCountryReady(true);
  }, [countryReady, loading, me?.profile?.country_code]);

  async function onSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!me?.profile) {
      login();
      return;
    }

    const nextErrors: { title?: string; explanation?: string } = {};
    if (title.trim().length < 8) {
      nextErrors.title = "Write a claim at least 8 characters long.";
    }
    if (explanation.trim().length < 20) {
      nextErrors.explanation = "Add at least 20 characters of context.";
    }
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.explanation) {
      setMessage("");
      return;
    }

    try {
      const result = await api.submitMyth({
        title,
        explanation,
        categoryId,
        countryCode: countryCode === "global" ? null : countryCode,
        sources: sourceUrl ? [{ url: sourceUrl }] : undefined,
      });
      setMessage(`Submitted. Status: ${result.myth.status}. An editor will review it.`);
      setTitle("");
      setExplanation("");
      setSourceUrl("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submit failed");
    }
  }

  return (
    <div className="page-shell grid min-w-0 gap-10 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start">
      <div>
      <h1 className="inline-flex items-center gap-3 font-[family-name:var(--font-display)] text-4xl">
        <PenLine className="size-8 text-[var(--gold)]" />
        Submit a myth
      </h1>
      <p className="mt-3 text-lg text-[var(--muted)]">
        Pick a country or Global. It stays pending until an admin approves it.
      </p>
      </div>
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <div>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setErrors((current) => ({ ...current, title: undefined }));
            }}
            placeholder="The claim"
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--ink-soft)] px-4 py-3"
          />
          {errors.title && <p className="mt-2 text-sm text-[var(--false)]">{errors.title}</p>}
        </div>
        <div>
          <textarea
            value={explanation}
            onChange={(event) => {
              setExplanation(event.target.value);
              setErrors((current) => ({ ...current, explanation: undefined }));
            }}
            placeholder="Why it is a fact, a myth, or still uncertain"
            rows={6}
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--ink-soft)] px-4 py-3"
          />
          {errors.explanation && (
            <p className="mt-2 text-sm text-[var(--false)]">{errors.explanation}</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <FolderOpen className="size-4" />
          Category
        </label>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--ink-soft)] px-4 py-3"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Globe className="size-4" />
          Country or global
        </label>
        <select
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--ink-soft)] px-4 py-3"
        >
          <option value="global">Global — every country</option>
          {SWITCH_COUNTRIES.map((code) => (
            <option key={code} value={code}>
              {countryName(code)}
            </option>
          ))}
          {countryCode !== "global" &&
            !(SWITCH_COUNTRIES as readonly string[]).includes(countryCode) && (
              <option value={countryCode}>{countryName(countryCode) ?? countryCode}</option>
            )}
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link2 className="size-4" />
          Source
        </label>
        <input
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="Source URL (optional)"
          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--ink-soft)] px-4 py-3"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-6 py-3 text-[var(--on-gold)]"
        >
          <Send className="size-4" />
          {me?.profile ? "Submit" : "Sign in to submit"}
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-[var(--gold)]">{message}</p>}
    </div>
  );
}
