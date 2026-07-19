"use client";

import { recordListingPhoneClick } from "@/lib/listings/phone-click-actions";
import { trackMetaBrowserEvent } from "@/lib/meta/browser";

type Props = {
  listingId: string;
  /** Normalized for tel:, no spaces */
  telHref: string;
  className?: string;
  children: React.ReactNode;
};

export function ListingPhoneLink({ listingId, telHref, className, children }: Props) {
  return (
    <a
      className={className}
      dir="ltr"
      href={telHref}
      onClick={() => {
        trackMetaBrowserEvent("Contact", {
          customData: {
            content_ids: [listingId],
            content_type: "product",
            content_name: "listing_phone_click",
          },
        });
        void recordListingPhoneClick(listingId);
      }}
    >
      {children}
    </a>
  );
}

