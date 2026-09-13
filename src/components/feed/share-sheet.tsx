"use client";

import {
  Copy,
  Download,
  Link2,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  captureShareImage,
  copyShareLink,
  downloadShareImage,
  mythShareText,
  mythShareUrl,
  openNativeShare,
  openShareLink,
} from "@/lib/share-card";
import type { Myth } from "@/lib/types";

function FacebookMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M14 8h3V4.5h-3c-2.8 0-4.5 1.7-4.5 4.4V11H7v3.5h2.5V22H14v-7.5h3.1L18 11h-4V8.9c0-.5.2-.9.9-.9Z" />
    </svg>
  );
}

export function ShareSheet({
  myth,
  guess,
  onClose,
}: {
  myth: Myth;
  guess: "TRUE" | "FALSE" | null;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  const url = useMemo(() => mythShareUrl(myth), [myth]);
  const text = useMemo(() => mythShareText(myth, guess), [guess, myth]);
  const message = `${text} ${url}`;

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    captureShareImage(myth, guess)
      .then((image) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(image);
        setBlob(image);
        setPreview(objectUrl);
      })
      .catch(() => {
        if (active) setStatus("Could not make the screenshot");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [guess, myth]);

  async function onNativeShare() {
    if (!blob) return;
    try {
      await openNativeShare(myth, blob, guess);
      setStatus("Opened share options");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("Share options are not available here");
    }
  }

  async function onCopy() {
    try {
      await copyShareLink(url);
      setStatus("Link copied");
    } catch {
      setStatus("Could not copy the link");
    }
  }

  function onSave() {
    if (!blob) return;
    downloadShareImage(blob, myth.slug);
    setStatus("Screenshot saved");
  }

  const apps = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      color: "#25D366",
      icon: MessageCircle,
      onClick: () => openShareLink(`https://wa.me/?text=${encodeURIComponent(message)}`),
    },
    {
      id: "messages",
      label: "Messages",
      color: "#34C759",
      icon: MessageSquare,
      onClick: () => openShareLink(`sms:?&body=${encodeURIComponent(message)}`),
    },
    {
      id: "telegram",
      label: "Telegram",
      color: "#2AABEE",
      icon: Send,
      onClick: () =>
        openShareLink(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        ),
    },
    {
      id: "x",
      label: "X",
      color: "#111111",
      icon: X,
      onClick: () =>
        openShareLink(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        ),
    },
    {
      id: "facebook",
      label: "Facebook",
      color: "#1877F2",
      icon: FacebookMark,
      onClick: () =>
        openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
    },
    {
      id: "email",
      label: "Mail",
      color: "#D4B36A",
      icon: Mail,
      onClick: () =>
        openShareLink(
          `mailto:?subject=${encodeURIComponent("MYTHH")}&body=${encodeURIComponent(message)}`,
        ),
    },
  ];

  return (
    <div
      data-share-sheet
      className="absolute inset-0 z-40 flex items-end bg-black/55"
      onPointerDown={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full rounded-t-[28px] border-t border-[var(--line)] bg-[var(--ink-soft)] px-5 pb-6 pt-3"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[var(--line)]" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold)]">Share</p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl">Send this claim</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--muted)]" aria-label="Close share">
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink)]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Share preview" className="mx-auto h-44 w-auto object-contain" />
          ) : (
            <div className="flex h-44 items-center justify-center text-sm text-[var(--muted)]">
              Preparing screenshot…
            </div>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {apps.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={app.onClick}
              className="flex w-16 shrink-0 flex-col items-center gap-2 text-center"
            >
              <span
                className="flex size-14 items-center justify-center rounded-full text-white"
                style={{ background: app.color }}
              >
                <app.icon className="size-6" />
              </span>
              <span className="text-[11px] text-[var(--cream)]">{app.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => void onCopy()}
            className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--ink)] px-3 py-3 text-xs text-[var(--cream)]"
          >
            <Copy className="size-5 text-[var(--gold)]" />
            Copy link
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--ink)] px-3 py-3 text-xs text-[var(--cream)]"
          >
            <Download className="size-5 text-[var(--gold)]" />
            Save image
          </button>
          <button
            type="button"
            onClick={() => void (canNativeShare ? onNativeShare() : onCopy())}
            className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--ink)] px-3 py-3 text-xs text-[var(--cream)]"
          >
            {canNativeShare ? (
              <Share2 className="size-5 text-[var(--gold)]" />
            ) : (
              <Link2 className="size-5 text-[var(--gold)]" />
            )}
            More
          </button>
        </div>

        {status && <p className="mt-3 text-center text-sm text-[var(--gold)]">{status}</p>}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-full border border-[var(--line)] py-3 text-sm text-[var(--cream)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
