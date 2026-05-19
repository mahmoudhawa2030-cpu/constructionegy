"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Props = {
  images: string[];
  title?: string;
};

const navArrowBtnLightbox =
  "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25 active:scale-95";

function Chevron({
  dir,
  className,
}: {
  dir: "left" | "right" | "up" | "down";
  className?: string;
}) {
  const path =
    dir === "left"
      ? "M15 18l-6-6 6-6"
      : dir === "right"
        ? "M9 18l6-6-6-6"
        : dir === "up"
          ? "M18 15l-6-6-6 6"
          : "M6 9l6 6 6-6";
  return (
    <svg
      aria-hidden
      className={className ?? "h-3 w-3"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path d={path} />
    </svg>
  );
}

const THUMB_VISIBLE = 5;
const THUMB_SIZE = 64; // px
const THUMB_GAP = 8;

export function ListingImageGallery({ images, title }: Props) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [thumbOffset, setThumbOffset] = useState(0);

  const n = images.length;
  const safeIndex = n > 0 ? Math.min(index, n - 1) : 0;
  const current = images[safeIndex] ?? "";

  const goPrev = useCallback(() => {
    setIndex((i) => {
      const clamped = n > 0 ? Math.min(i, n - 1) : 0;
      return clamped <= 0 ? n - 1 : clamped - 1;
    });
  }, [n]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      const clamped = n > 0 ? Math.min(i, n - 1) : 0;
      return clamped >= n - 1 ? 0 : clamped + 1;
    });
  }, [n]);

  // Keep selected thumbnail visible
  useEffect(() => {
    if (safeIndex < thumbOffset) {
      setThumbOffset(safeIndex);
    } else if (safeIndex >= thumbOffset + THUMB_VISIBLE) {
      setThumbOffset(safeIndex - THUMB_VISIBLE + 1);
    }
  }, [safeIndex, thumbOffset]);

  useEffect(() => {
    if (!lightbox) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (n <= 1) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, n, goPrev, goNext]);

  if (n === 0) return null;

  const altText = title ? `صورة ${safeIndex + 1} — ${title}` : `صورة ${safeIndex + 1}`;
  const canScrollUp = thumbOffset > 0;
  const canScrollDown = thumbOffset + THUMB_VISIBLE < n;
  const thumbsViewportHeight = THUMB_VISIBLE * THUMB_SIZE + (THUMB_VISIBLE - 1) * THUMB_GAP;

  return (
    <>
      <div className="flex flex-col gap-3" dir="ltr">
        {/* Desktop: vertical thumbs + main image side by side */}
        <div className="flex gap-3 items-start">
          {n > 1 ? (
            <div
              className="hidden lg:flex flex-col items-center shrink-0"
              style={{ width: THUMB_SIZE }}
            >
              <button
                aria-label="السابق"
                className={`w-full flex items-center justify-center py-1 mb-1 rounded transition-colors ${canScrollUp ? "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800" : "text-zinc-300 cursor-default dark:text-zinc-700"}`}
                disabled={!canScrollUp}
                type="button"
                onClick={() => setThumbOffset((o) => Math.max(0, o - 1))}
              >
                <Chevron dir="up" className="h-5 w-5" />
              </button>
              <div
                className="flex flex-col overflow-hidden"
                style={{ gap: THUMB_GAP, height: thumbsViewportHeight }}
              >
                <div
                  className="flex flex-col transition-transform duration-200"
                  style={{
                    gap: THUMB_GAP,
                    transform: `translateY(-${thumbOffset * (THUMB_SIZE + THUMB_GAP)}px)`,
                  }}
                >
                  {images.map((src, i) => (
                    <button
                      aria-label={`صورة ${i + 1}`}
                      className={`relative overflow-hidden rounded-lg border-2 shrink-0 transition-colors ${i === safeIndex ? "border-bina-or" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"}`}
                      key={src + i}
                      style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                      type="button"
                      onClick={() => setIndex(i)}
                    >
                      <Image
                        alt={`${title ?? ""} ${i + 1}`}
                        className="object-cover"
                        fill
                        sizes="64px"
                        src={src}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <button
                aria-label="التالي"
                className={`w-full flex items-center justify-center py-1 mt-1 rounded transition-colors ${canScrollDown ? "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800" : "text-zinc-300 cursor-default dark:text-zinc-700"}`}
                disabled={!canScrollDown}
                type="button"
                onClick={() =>
                  setThumbOffset((o) => Math.min(n - THUMB_VISIBLE, o + 1))
                }
              >
                <Chevron dir="down" className="h-5 w-5" />
              </button>
            </div>
          ) : null}

          {/* Main image */}
          <div className="relative flex-1 min-w-0">
            <button
              aria-label="تكبير الصورة"
              className="relative block h-[15rem] w-full cursor-zoom-in overflow-hidden rounded-lg bg-zinc-100 sm:h-[20rem] lg:h-[22rem] dark:bg-zinc-900"
              type="button"
              onClick={() => setLightbox(true)}
            >
              <Image
                alt={altText}
                className="object-contain"
                fill
                sizes="(max-width: 1024px) 100vw, 540px"
                src={current}
                priority
              />
            </button>

            {n > 1 ? (
              <>
                <button
                  aria-label="الصورة السابقة"
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-700 shadow transition hover:bg-white"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goPrev();
                  }}
                >
                  <Chevron dir="left" className="h-4 w-4" />
                </button>
                <button
                  aria-label="الصورة التالية"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-700 shadow transition hover:bg-white"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goNext();
                  }}
                >
                  <Chevron dir="right" className="h-4 w-4" />
                </button>
                <span className="pointer-events-none absolute bottom-2 end-2 rounded-md bg-black/40 px-2 py-0.5 text-[11px] tabular-nums text-white/95 backdrop-blur-[1px]">
                  {safeIndex + 1} / {n}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile/tablet: horizontal scrolling thumbs */}
        {n > 1 ? (
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((src, i) => (
              <button
                aria-label={`صورة ${i + 1}`}
                className={`relative overflow-hidden rounded-lg border-2 shrink-0 transition-colors ${i === safeIndex ? "border-bina-or" : "border-zinc-200 dark:border-zinc-700"}`}
                key={src + i}
                style={{ width: 64, height: 64 }}
                type="button"
                onClick={() => setIndex(i)}
              >
                <Image
                  alt={`${title ?? ""} ${i + 1}`}
                  className="object-cover"
                  fill
                  sizes="64px"
                  src={src}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lightbox ? (
        <div aria-modal className="fixed inset-0 z-50" role="dialog">
          <button
            aria-label="إغلاق"
            className="absolute inset-0 bg-black/92"
            type="button"
            onClick={() => setLightbox(false)}
          />
          <div className="relative z-10 flex h-full min-h-0 flex-col pointer-events-none">
            <div className="pointer-events-auto flex shrink-0 justify-end p-2 sm:p-3">
              <button
                aria-label="إغلاق"
                className="rounded-lg bg-white/10 px-3 py-2 text-2xl leading-none text-white hover:bg-white/20"
                type="button"
                onClick={() => setLightbox(false)}
              >
                ×
              </button>
            </div>

            <div className="pointer-events-auto relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-4">
              {n > 1 ? (
                <button
                  aria-label="الصورة السابقة"
                  className={`absolute start-1 top-1/2 -translate-y-1/2 sm:start-2 ${navArrowBtnLightbox}`}
                  type="button"
                  onClick={goPrev}
                >
                  <Chevron dir="left" className="h-3 w-3" />
                </button>
              ) : null}

              <div className="relative h-[min(85vh,calc(100dvh-7rem))] w-full max-w-6xl">
                <Image
                  alt={altText}
                  className="object-contain"
                  fill
                  sizes="100vw"
                  src={current}
                  priority
                />
              </div>

              {n > 1 ? (
                <button
                  aria-label="الصورة التالية"
                  className={`absolute end-1 top-1/2 -translate-y-1/2 sm:end-2 ${navArrowBtnLightbox}`}
                  type="button"
                  onClick={goNext}
                >
                  <Chevron dir="right" className="h-3 w-3" />
                </button>
              ) : null}
            </div>

            {n > 1 ? (
              <p
                className="pointer-events-auto shrink-0 pb-4 text-center text-xs text-white/70"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                {safeIndex + 1} / {n}
              </p>
            ) : (
              <div className="shrink-0 pb-4" aria-hidden />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
