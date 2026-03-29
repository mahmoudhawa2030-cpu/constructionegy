"use client";

import { useTranslations } from "next-intl";
import { useCallback, useId, useRef } from "react";

type Props = {
  length: number;
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  /** ID of the visible code label (preferred over `aria-label` on the group). */
  labelledBy?: string;
  autoFocusFirst?: boolean;
};

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** One input per digit — visible “cells” for email OTP (LTR). */
export function EmailOtpCells({
  length,
  value,
  onChange,
  disabled,
  labelledBy,
  autoFocusFirst,
}: Props) {
  const t = useTranslations("signup");
  const baseId = useId();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const padded = digitsOnly(value).slice(0, length);
  const chars = Array.from({ length }, (_, i) => padded[i] ?? "");

  const focusAt = (i: number) => {
    const el = inputsRef.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const setDigitAt = useCallback(
    (index: number, raw: string) => {
      const d = digitsOnly(raw).slice(-1);
      const arr = Array.from({ length }, (_, i) => (i < padded.length ? padded[i]! : ""));
      arr[index] = d;
      onChange(arr.join(""));
      if (d && index < length - 1) {
        requestAnimationFrame(() => focusAt(index + 1));
      }
    },
    [length, onChange, padded],
  );

  const clearDigitAt = useCallback(
    (index: number) => {
      const arr = Array.from({ length }, (_, i) => (i < padded.length ? padded[i]! : ""));
      arr[index] = "";
      onChange(arr.join(""));
    },
    [length, onChange, padded],
  );

  return (
    <div
      aria-label={labelledBy ? undefined : t("otpLabel")}
      aria-labelledby={labelledBy}
      className="flex flex-col gap-2"
      role="group"
    >
      <div
        className="flex flex-wrap justify-center gap-2"
        dir="ltr"
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text");
          const next = digitsOnly(text).slice(0, length);
          onChange(next);
          requestAnimationFrame(() => focusAt(Math.min(Math.max(0, next.length - 1), length - 1)));
        }}
      >
        {Array.from({ length }, (_, index) => (
          <input
            aria-label={t("otpDigitAria", { n: index + 1, total: length })}
            autoFocus={autoFocusFirst && index === 0}
            className="h-12 w-10 rounded-lg border border-zinc-300 bg-white text-center font-mono text-lg text-zinc-900 tabular-nums outline-none ring-zinc-400 focus:ring-2 sm:h-14 sm:w-11 sm:text-xl dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            disabled={disabled}
            id={`${baseId}-${index}`}
            inputMode="numeric"
            key={index}
            maxLength={1}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            value={chars[index]}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length <= 1) {
                setDigitAt(index, v);
              } else {
                const next = digitsOnly(v).slice(0, length);
                onChange(next);
                requestAnimationFrame(() => focusAt(Math.min(next.length, length - 1)));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace") {
                if (chars[index]) {
                  e.preventDefault();
                  clearDigitAt(index);
                } else if (index > 0) {
                  e.preventDefault();
                  clearDigitAt(index - 1);
                  focusAt(index - 1);
                }
              }
              if (e.key === "ArrowLeft" && index > 0) {
                e.preventDefault();
                focusAt(index - 1);
              }
              if (e.key === "ArrowRight" && index < length - 1) {
                e.preventDefault();
                focusAt(index + 1);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
