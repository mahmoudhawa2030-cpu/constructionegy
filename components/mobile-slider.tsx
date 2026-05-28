"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface SliderItem {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  link?: string;
  backgroundColor?: string;
}

interface Props {
  items: SliderItem[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

export function MobileSlider({ 
  items, 
  autoPlay = true, 
  interval = 3000, 
  showDots = true, 
  showArrows = false,
  className = "" 
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className={`relative w-full overflow-hidden rounded-lg ${className}`}>
      {/* Main Slider Container */}
      <div className="relative h-48 w-full md:h-64">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundColor: item.backgroundColor || "#f5f5f5",
            }}
          >
            {item.link ? (
              <Link href={item.link} className="block h-full w-full">
                <SliderContent item={item} />
              </Link>
            ) : (
              <SliderContent item={item} />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-opacity hover:bg-black/70 md:h-10 md:w-10"
            aria-label="Previous slide"
          >
            <svg
              className="h-4 w-4 md:h-5 md:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-opacity hover:bg-black/70 md:h-10 md:w-10"
            aria-label="Next slide"
          >
            <svg
              className="h-4 w-4 md:h-5 md:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 w-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "w-6 bg-white"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SliderContent({ item }: { item: SliderItem }) {
  return (
    <div className="relative h-full w-full">
      {/* Background Image */}
      {item.image && (
        <div className="absolute inset-0">
          <Image
            src={item.image}
            alt={item.title || "Slider image"}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Text Content - only render if both title AND subtitle are provided */}
      {item.title && item.subtitle && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-bold text-white drop-shadow-md md:text-xl">
            {item.title}
          </h3>
          <p className="mt-1 text-sm text-white drop-shadow-sm md:text-base">
            {item.subtitle}
          </p>
        </div>
      )}
    </div>
  );
}
