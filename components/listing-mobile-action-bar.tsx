"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { revealSellerPhoneForListing } from "@/lib/listings/contact-actions";
import { trackMetaBrowserEvent } from "@/lib/meta/browser";

type Props = {
  listingId: string;
  isOwner: boolean;
  isLoggedIn: boolean;
};

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
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  async function handleCall() {
    if (revealedPhone) {
      trackMetaBrowserEvent("Contact", {
        customData: {
          content_ids: [listingId],
          content_type: "product",
          content_name: "listing_phone_click",
        },
      });
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
      trackMetaBrowserEvent("Contact", {
        customData: {
          content_ids: [listingId],
          content_type: "product",
          content_name: result.phone ? "listing_phone_click" : "listing_phone_reveal",
        },
      });
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
      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2b6cb0] py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
        disabled={phoneLoading}
        type="button"
        onClick={handleCall}
      >
        <PhoneIcon />
        <span>{phoneLoading ? "…" : revealedPhone ? revealedPhone : t("call")}</span>
      </button>
    </div>
  );
}
