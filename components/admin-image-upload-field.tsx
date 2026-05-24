"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { uploadHeroImageAction } from "@/app/admin/homepage/web-actions";
import { adminUi } from "@/lib/admin-ui";

/**
 * Shared file-upload + URL fallback field for homepage admin forms.
 * Renders a "Choose file..." button that uploads to Supabase storage
 * and writes the resulting public URL into a hidden input named `image_url`.
 * Also shows a text input so an external URL can still be pasted.
 */
export function AdminImageUploadField({
  defaultValue = "",
  name = "image_url",
  label,
}: {
  defaultValue?: string;
  name?: string;
  label?: string;
}) {
  const t = useTranslations("adminWebHomepage");
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState<"idle" | "uploading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setStatus("uploading");
    setErrorMsg("");
    startTransition(async () => {
      const result = await uploadHeroImageAction(null, fd);
      if (result.ok) {
        setUrl(result.url);
        setStatus("ok");
      } else {
        setStatus("error");
        setErrorMsg(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-[var(--admin-text-secondary)]">
        {label ?? t("uploadImage")}
      </span>

      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-28 w-full max-w-xs rounded object-cover border border-[var(--admin-cell-border)]"
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className={`${adminUi.btnSecondary} px-3 py-1.5 text-sm`}
        >
          {isPending ? t("uploading") : t("uploadChoose")}
        </button>
        {status === "ok" && (
          <span className="text-xs text-emerald-600">{t("uploadSuccess")}</span>
        )}
        {status === "error" && (
          <span className="text-xs text-red-600">
            {t("uploadFailed")}: {errorMsg}
          </span>
        )}
        <span className="text-[10px] text-[var(--admin-text-secondary)]">
          {t("uploadHint")}
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      <input type="hidden" name={name} value={url} />

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-[var(--admin-text-secondary)]">{t("orPasteUrl")}</span>
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setStatus("idle");
          }}
          dir="ltr"
          placeholder="https://…"
          className={adminUi.inputMono}
        />
      </label>
    </div>
  );
}
