"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  currentUrl: string | null;
  name: string;
  displayName: string;
  onUploaded: (url: string) => void;
};

export function AvatarUpload({ currentUrl, name, displayName, onUploaded }: Props) {
  const t = useTranslations("profile");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !json.url) {
        setError(json.error ?? t("avatarUploadError"));
        setPreview(currentUrl);
        return;
      }
      setPreview(json.url);
      onUploaded(json.url);
    } catch {
      setError(t("avatarUploadError"));
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={t("avatarUploadAria")}
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-100 transition-opacity hover:opacity-80 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800"
      >
        {preview ? (
          <Image
            src={preview}
            alt={displayName}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized={preview.startsWith("blob:")}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-bina-display text-xl font-bold text-zinc-400 dark:text-zinc-500">
            {initials}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </span>
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </span>
        ) : null}
      </button>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleChange}
        aria-hidden="true"
      />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {uploading ? t("avatarUploading") : t("avatarHint")}
      </p>

      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
