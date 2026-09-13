"use client";

import { FolderOpen, Link2, PenLine, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function SubmitPage() {
  const { me, login } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.categories().then((result) => {
      setCategories(result.categories);
      setCategoryId(result.categories[0]?.id ?? "");
    });
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!me?.profile) {
      login();
      return;
    }

    try {
      const result = await api.submitMyth({
        title,
        explanation,
        categoryId,
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
        It stays pending until an admin approves it.
      </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          required
          minLength={8}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="The claim"
          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--ink-soft)] px-4 py-3"
        />
        <textarea
          required
          minLength={20}
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          placeholder="Why it is a fact, a myth, or still uncertain"
          rows={6}
          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--ink-soft)] px-4 py-3"
        />
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
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-6 py-3 text-[var(--ink)]"
        >
          <Send className="size-4" />
          {me?.profile ? "Submit" : "Sign in to submit"}
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-[var(--gold)]">{message}</p>}
    </div>
  );
}
