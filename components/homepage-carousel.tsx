"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { resolveHomepageItemHref, type GuestHomepageItem } from "@/lib/homepage/guest-data";

type Props = {
  items: GuestHomepageItem[];
  locale: "ar" | "en";
  dotLabel: (index: number) => string;
  slideAria: (title: string) => string;
};

export function HomepageCarousel({ items, locale, dotLabel, slideAria }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollTo = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: i * w, behavior: "smooth" });
    setActive(i);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || items.length === 0) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      const i = Math.round(el.scrollLeft / w);
      setActive(Math.min(Math.max(i, 0), items.length - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const title = locale === "ar" ? item.title_ar || item.title_en : item.title_en || item.title_ar;
          const body =
            locale === "ar"
              ? item.description_ar || item.description_en
              : item.description_en || item.description_ar;
          const itemHref = resolveHomepageItemHref(item);
          return (
            <div
              key={item.id}
              className="w-full shrink-0 snap-start snap-always px-0.5"
            >
              <Link
                aria-label={slideAria(title)}
                className="flex min-h-[11rem] flex-col justify-between rounded-2xl border border-bina-border bg-gradient-to-b from-bina-steel3/40 to-bina-card p-4 shadow-sm transition hover:border-bina-or/35"
                href={itemHref}
                prefetch={true}
              >
                {item.image_url ? (
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl bg-bina-steel3">
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="100vw"
                      src={item.image_url}
                      unoptimized={item.image_url.startsWith("http")}
                    />
                  </div>
                ) : null}
                <div>
                  <h3 className="font-bina-display text-base font-bold leading-snug text-bina-text">{title}</h3>
                  {body ? (
                    <p className="mt-1 text-sm leading-relaxed text-bina-muted">{body}</p>
                  ) : null}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
      {items.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={dotLabel(i + 1)}
              aria-current={i === active ? "true" : undefined}
              className={`h-2 w-2 rounded-full transition ${i === active ? "bg-bina-or" : "bg-bina-steel4"}`}
              type="button"
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
