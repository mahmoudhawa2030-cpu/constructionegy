"use client";

import { useEffect, useState } from "react";

/**
 * Flash-deals countdown timer.
 * Client-only (renders interactive HH:MM:SS digits).
 */
export function CountdownTimer({ initialSeconds = 5 * 3600 + 28 * 60 + 44 }: { initialSeconds?: number }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const s = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="flex gap-1 items-center" dir="ltr">
      <TimeDigit value={h} />
      <span className="text-[#888] text-sm font-bold">:</span>
      <TimeDigit value={m} />
      <span className="text-[#888] text-sm font-bold">:</span>
      <TimeDigit value={s} />
    </div>
  );
}

function TimeDigit({ value }: { value: string }) {
  return (
    <div className="bg-[#1a1a1a] text-white text-sm font-bold py-1.5 px-2.5 rounded-lg min-w-[32px] text-center font-mono tabular-nums">
      {value}
    </div>
  );
}
