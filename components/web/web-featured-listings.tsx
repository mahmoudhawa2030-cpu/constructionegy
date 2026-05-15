"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

type Listing = {
  id: string;
  title: string;
  price: number | null;
  price_unit: string | null;
  images: string[] | null;
  location: string | null;
  status: string;
  profiles: { full_name: string } | null;
};

type Props = {
  listings: Listing[];
};

export function WebFeaturedListings({ listings }: Props) {
  const t = useTranslations("listings");
  const locale = useLocale();
  const isAr = locale === "ar";

  const formatPrice = (price: number | null, unit: string | null) => {
    if (!price) return t("contactForPrice");
    const formatted = new Intl.NumberFormat(isAr ? "ar-EG" : "en-US").format(price);
    return `${formatted} ${unit || "EGP"}`;
  };

  if (!listings.length) {
    return <p className="text-[var(--bina-muted)]">{t("noListings")}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((listing) => {
        const thumb = listing.images?.[0];
        const supplier = listing.profiles?.full_name;

        return (
          <Link
            key={listing.id}
            href={`/listings/${listing.id}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-[var(--bina-border)] bg-white transition-all hover:border-[var(--bina-primary)] hover:shadow-md"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bina-steel)]">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={listing.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl">📦</div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-2 text-sm font-semibold text-[var(--bina-text)]">
                {listing.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--bina-muted)]">{supplier}</p>
              <div className="mt-auto pt-3">
                <p className="text-lg font-bold text-[var(--bina-primary)]">
                  {formatPrice(listing.price, listing.price_unit)}
                </p>
                {listing.location && (
                  <p className="mt-1 text-xs text-[var(--bina-muted)]">📍 {listing.location}</p>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
