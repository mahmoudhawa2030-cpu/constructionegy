"use client";

import { recordListingPhoneClick } from "@/lib/listings/phone-click-actions";

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
        void recordListingPhoneClick(listingId);
      }}
    >
      {children}
    </a>
  );
}
