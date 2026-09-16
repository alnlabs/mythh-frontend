"use client";

import { LogIn, MessageCircle, Send, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";

import { useAuth } from "./auth-provider";

export function CommentsPanel({
  slug,
  open,
  onClose,
}: {
  slug: string;
  open: boolean;
  onClose: () => void;
}) {
  const { me, login } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const signedIn = Boolean(me?.profile);

  useEffect(() => {
    if (!open) return;
    api
      .comments(slug)
      .then((result) => setComments(result.comments))
      .catch(() => setComments([]));
  }, [open, slug]);

  async function onSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!signedIn) {
      login();
      return;
    }

    if (!content.trim()) {
      setError("Write a comment first.");
      return;
    }

    try {
      setError("");
      await api.comment(slug, content);
      setContent("");
      const result = await api.comments(slug);
      setComments(result.comments);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not comment");
    }
  }

  if (!open) return null;

  return (
    <div
      data-selectable
      className="absolute inset-x-0 bottom-0 z-30 max-h-[70%] overflow-y-auto border-t border-[var(--line)] bg-[var(--ink-soft)] p-4 select-text"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--gold)]">
          <MessageCircle className="size-4" />
          Comments
        </h2>
        <button type="button" onClick={onClose} className="text-[var(--muted)]" aria-label="Close comments">
          <X className="size-5" />
        </button>
      </div>

      {signedIn ? (
        <form noValidate onSubmit={onSubmit} className="mb-4 flex gap-2">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add a thought"
            className="flex-1 rounded-full border border-[var(--line)] bg-[var(--ink)] px-4 py-2 text-sm text-[var(--cream)] outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold)] px-4 text-sm text-[var(--on-gold)]"
          >
            <Send className="size-4" />
            Post
          </button>
        </form>
      ) : (
        <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--ink)] px-4 py-4">
          <p className="text-sm font-medium text-[var(--cream)]">Want to join the discussion?</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Sign in to comment on this myth.</p>
          <button
            type="button"
            onClick={login}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--on-gold)]"
          >
            <LogIn className="size-4" />
            Sign in
          </button>
        </div>
      )}
      {error && <p className="mb-3 text-sm text-[var(--false)]">{error}</p>}

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-[var(--muted)]">No comments yet.</li>
        )}
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-2xl bg-[var(--ink)] p-3">
            <p className="text-xs text-[var(--gold)]">{comment.author.displayName}</p>
            <p className="mt-1 text-sm text-[var(--cream)]">{comment.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
