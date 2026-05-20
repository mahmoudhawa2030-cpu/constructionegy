"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { StartChatResult } from "@/lib/chat/get-or-create-for-listing";
import { revealSellerPhoneForListing } from "@/lib/listings/contact-actions";

type Props = {
  listingId: string;
  isOwner: boolean;
  isLoggedIn: boolean;
};

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function ListingMobileActionBar({ listingId, isOwner, isLoggedIn }: Props) {
  const t = useTranslations("listingDetail");
  const [chatLoading, setChatLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  async function startChat() {
    if (!isLoggedIn) {
      window.location.assign(
        `/login?next=${encodeURIComponent(`/listings/${listingId}`)}`,
      );
      return;
    }
    setError(null);
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat/for-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
        credentials: "same-origin",
      });
      const raw: unknown = await res.json().catch(() => null);
      if (!raw || typeof raw !== "object" || !("ok" in raw)) {
        setError("تعذر بدء المحادثة.");
        return;
      }
      const result = raw as StartChatResult;
      if (result.ok) {
        window.location.assign(`/messages/${result.chatId}`);
        return;
      }
      if (result.reason === "login") {
        window.location.assign(
          `/login?next=${encodeURIComponent(`/listings/${listingId}`)}`,
        );
        return;
      }
      setError(result.message ?? "تعذر بدء المحادثة.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر بدء المحادثة.");
    } finally {
      setChatLoading(false);
    }
  }

  async function handleCall() {
    if (revealedPhone) {
      window.location.href = `tel:${revealedPhone.replace(/\s/g, "")}`;
      return;
    }
    if (!isLoggedIn) {
      window.location.assign(
        `/login?next=${encodeURIComponent(`/listings/${listingId}`)}`,
      );
      return;
    }
    setError(null);
    setPhoneLoading(true);
    const result = await revealSellerPhoneForListing(listingId);
    setPhoneLoading(false);
    if (result.ok) {
      setRevealedPhone(result.phone);
      if (result.phone) {
        window.location.href = `tel:${result.phone.replace(/\s/g, "")}`;
      } else {
        setError(t("noPhone"));
      }
      return;
    }
    if (result.reason === "login") {
      window.location.assign(
        `/login?next=${encodeURIComponent(`/listings/${listingId}`)}`,
      );
      return;
    }
    setError(result.message ?? t("noPhone"));
  }

  if (isOwner) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white px-3 pt-2 md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {error ? (
        <p className="mb-1 text-center text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#dc3545] py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
          disabled={chatLoading}
          type="button"
          onClick={startChat}
        >
          <ChatIcon />
          <span>{chatLoading ? "…" : t("chat")}</span>
        </button>
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2b6cb0] py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
          disabled={phoneLoading}
          type="button"
          onClick={handleCall}
        >
          <PhoneIcon />
          <span>{phoneLoading ? "…" : revealedPhone ? revealedPhone : t("call")}</span>
        </button>
      </div>
    </div>
  );
}
