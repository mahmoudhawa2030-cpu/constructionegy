"use client";

import Link from "next/link";
import { useState } from "react";

import { getOrCreateChatForListing } from "@/lib/chat/actions";
import { revealSellerPhoneForListing } from "@/lib/listings/contact-actions";

type Props = {
  listingId: string;
  isOwner: boolean;
  isLoggedIn: boolean;
};

export function ListingContact({ listingId, isOwner, isLoggedIn }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneRevealLoading, setPhoneRevealLoading] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null | undefined>(undefined);

  async function startChat() {
    setError(null);
    setLoading(true);
    try {
      const result = await getOrCreateChatForListing(listingId);
      if (result.ok) {
        // Full navigation is more reliable than client router after server actions
        // (Firefox + Vercel sometimes fail to apply router.push before paint).
        window.location.assign(`/messages/${result.chatId}`);
        return;
      }
      if (result.reason === "login") {
        window.location.assign(
          `/login?next=${encodeURIComponent(`/listings/${listingId}`)}`,
        );
        return;
      }
      if (result.reason === "own_listing") {
        setError("لا يمكنك مراسلة نفسك لإعلانك.");
        return;
      }
      setError(result.message ?? "تعذر بدء المحادثة.");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "تعذر بدء المحادثة.");
    } finally {
      setLoading(false);
    }
  }

  async function revealPhone() {
    setError(null);
    setPhoneRevealLoading(true);
    const result = await revealSellerPhoneForListing(listingId);
    setPhoneRevealLoading(false);
    if (result.ok) {
      setRevealedPhone(result.phone);
      return;
    }
    if (result.reason === "login") {
      window.location.assign(
        `/login?next=${encodeURIComponent(`/listings/${listingId}`)}`,
      );
      return;
    }
    if (result.reason === "own_listing") {
      setError("هذا إعلانك.");
      return;
    }
    setError(result.message ?? "تعذر جلب رقم الهاتف.");
  }

  if (isOwner) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        هذا إعلانك — يمكن للمشترين مراسلتك من هنا عند عرض الإعلان.
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          سجّل الدخول لمراسلة البائع بخصوص هذا الإعلان.
        </p>
        <Link
          className="inline-flex w-fit rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          href={`/login?next=/listings/${listingId}`}
        >
          تسجيل الدخول للمراسلة
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-2">
        {revealedPhone === undefined ? (
          <button
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            disabled={phoneRevealLoading}
            type="button"
            onClick={revealPhone}
          >
            {phoneRevealLoading ? "جاري التحميل…" : "إظهار رقم الهاتف"}
          </button>
        ) : revealedPhone ? (
          <a
            className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-medium text-emerald-950 tabular-nums dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
            dir="ltr"
            href={`tel:${revealedPhone.replace(/\s/g, "")}`}
          >
            {revealedPhone}
          </a>
        ) : (
          <p className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
            لا يوجد رقم هاتف مُسجّل لدى البائع.
          </p>
        )}
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">تواصل مع البائع عبر المحادثة.</p>
      <button
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        disabled={loading}
        type="button"
        onClick={startChat}
      >
        {loading ? "جاري الفتح…" : "مراسلة البائع"}
      </button>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
