"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Props = {
  images: string[];
  title?: string;
};

const navArrowBtn =
  "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-zinc-200/85 text-white shadow-sm backdrop-blur-[1px] transition hover:bg-zinc-300/95 active:scale-95 dark:border-white/15 dark:bg-zinc-600/80 dark:hover:bg-zinc-500/90";

const navArrowBtnLightbox =
  "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25 active:scale-95";

function Chevron({ dir, className }: { dir: "left" | "right"; className?: string }) {
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
      {dir === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}

export function ListingImageGallery({ images, title }: Props) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const n = images.length;
  const safeIndex = n > 0 ? Math.min(index, n - 1) : 0;
  const current = images[safeIndex] ?? "";

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? n - 1 : i - 1));
  }, [n]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= n - 1 ? 0 : i + 1));
  }, [n]);

  useEffect(() => {
    if (index >= n && n > 0) setIndex(n - 1);
  }, [index, n]);

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

  return (
    <>
      <div className="flex flex-col gap-2" dir="ltr">
        <div className="relative w-full min-w-0 flex-1">
          <button
            aria-label="تكبير الصورة"
            className="relative block h-[27.3rem] w-full min-h-0 cursor-zoom-in overflow-hidden rounded-lg bg-zinc-100 sm:h-[29.25rem] dark:bg-zinc-900"
            type="button"
            onClick={() => setLightbox(true)}
          >
            <Image
              alt={altText}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              src={current}
              unoptimized
              priority
            />
          </button>

          {n > 1 ? (
            <>
              <button
                aria-label="الصورة السابقة"
                className={`absolute start-2 top-1/2 -translate-y-1/2 ${navArrowBtn}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goPrev();
                }}
              >
                <Chevron dir="left" />
              </button>
              <button
                aria-label="الصورة التالية"
                className={`absolute end-2 top-1/2 -translate-y-1/2 ${navArrowBtn}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goNext();
                }}
              >
                <Chevron dir="right" />
              </button>
            </>
          ) : null}

          {n > 1 ? (
            <span className="pointer-events-none absolute bottom-2 end-2 rounded-md bg-black/40 px-2 py-0.5 text-[11px] tabular-nums text-white/95 backdrop-blur-[1px]">
              {safeIndex + 1} / {n}
            </span>
          ) : null}
        </div>

        {n > 1 ? (
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            اضغط على الصورة للتكبير
          </p>
        ) : (
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            اضغط على الصورة للتكبير
          </p>
        )}
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
                  unoptimized
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
