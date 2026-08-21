"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ListingPhoneLink } from "@/components/listing-phone-link";
import { revealSellerPhoneForListing } from "@/lib/listings/contact-actions";
import { trackMetaBrowserEvent } from "@/lib/meta/browser";

type Props = {
  listingId: string;
  isOwner: boolean;
  isLoggedIn: boolean;
};

export function ListingContact({ listingId, isOwner }: Props) {
  const t = useTranslations("listingDetail");
  const [error, setError] = useState<string | null>(null);
  const [phoneRevealLoading, setPhoneRevealLoading] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null | undefined>(undefined);

  async function revealPhone() {
    setError(null);
    setPhoneRevealLoading(true);
    const result = await revealSellerPhoneForListing(listingId);
    setPhoneRevealLoading(false);
    if (result.ok) {
      setRevealedPhone(result.phone);
      trackMetaBrowserEvent("Contact", {
        customData: {
          content_ids: [listingId],
          content_type: "product",
          content_name: "listing_phone_reveal",
        },
      });
      return;
    }
    if (result.reason === "own_listing") {
      setError(t("ownListing"));
      return;
    }
    setError(result.message ?? t("noPhone"));
  }

  if (isOwner) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {t("ownListingPhoneHint")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("contactByPhoneOnly")}</p>
      {revealedPhone === undefined ? (
        <button
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          disabled={phoneRevealLoading}
          type="button"
          onClick={revealPhone}
        >
          {phoneRevealLoading ? t("loadingPhone") : t("showPhone")}
        </button>
      ) : revealedPhone ? (
        <ListingPhoneLink
          className="block w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-medium text-emerald-950 tabular-nums dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
          listingId={listingId}
          telHref={`tel:${revealedPhone.replace(/\s/g, "")}`}
        >
          {revealedPhone}
        </ListingPhoneLink>
      ) : (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          {t("noPhone")}
        </p>
      )}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
