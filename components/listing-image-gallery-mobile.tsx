"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  title?: string;
  /** Where the back arrow should navigate (defaults to /gallery). */
  backHref?: string;
  /** Where the search/magnifier icon should navigate. */
  searchHref?: string;
};

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className ?? "h-3.5 w-3.5"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function ListingImageGalleryMobile({
  images,
  title,
  backHref = "/gallery",
  searchHref = "/gallery",
}: Props) {
  const t = useTranslations("listingDetail");
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const n = images.length;

  // Update index based on horizontal scroll position
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth;
        if (w === 0) return;
        const i = Math.round(el.scrollLeft / w);
        setIndex(Math.max(0, Math.min(n - 1, i)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [n]);

  if (n === 0) {
    return (
      <div className="relative w-full bg-zinc-100" style={{ aspectRatio: "1 / 1" }}>
        <OverlayButtons backHref={backHref} searchHref={searchHref} backLabel={t("back")} searchLabel={t("search")} />
      </div>
    );
  }

  return (
    <div className="relative w-full bg-zinc-100" style={{ aspectRatio: "1 / 1" }} dir="ltr">
      <div
        ref={trackRef}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
      >
        {images.map((src, i) => (
          <div
            key={src + i}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              alt={title ? `${title} ${i + 1}` : `image ${i + 1}`}
              className="object-cover"
              fill
              sizes="100vw"
              src={src}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      <OverlayButtons backHref={backHref} searchHref={searchHref} backLabel={t("back")} searchLabel={t("search")} />

      {/* Photo counter bottom-right */}
      <div className="pointer-events-none absolute bottom-3 end-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white tabular-nums">
        <CameraIcon />
        <span>
          {index + 1}/{n}
        </span>
      </div>
    </div>
  );
}

function OverlayButtons({
  backHref,
  searchHref,
  backLabel,
  searchLabel,
}: {
  backHref: string;
  searchHref: string;
  backLabel: string;
  searchLabel: string;
}) {
  return (
    <>
      <Link
        aria-label={backLabel}
        className="absolute start-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-md backdrop-blur-sm active:scale-95"
        href={backHref}
      >
        <svg
          aria-hidden
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <Link
        aria-label={searchLabel}
        className="absolute end-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-md backdrop-blur-sm active:scale-95"
        href={searchHref}
      >
        <svg
          aria-hidden
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </Link>
    </>
  );
}
