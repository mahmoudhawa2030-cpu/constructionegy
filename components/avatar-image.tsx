"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 text-2xl",
};

export function AvatarImage({ src, name, size = "lg" }: Props) {
  const [error, setError] = useState(false);
  const initials = name.slice(0, 1).toUpperCase();

  if (!src || error) {
    return (
      <div
        className={`shrink-0 overflow-hidden rounded-full bg-zinc-100 flex items-center justify-center font-semibold text-zinc-400 dark:bg-zinc-800 ${sizeClasses[size]}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`shrink-0 overflow-hidden rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 ${sizeClasses[size]}`}
      onError={() => setError(true)}
    />
  );
}
