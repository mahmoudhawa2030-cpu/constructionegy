"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createFeedPostFromForm,
  type CreateFeedPostState,
} from "@/lib/feed/post-actions";

type Props = {
  defaultLocation?: string | null;
};

export function FeedPostCreateForm({ defaultLocation }: Props) {
  const t = useTranslations("feedPost");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createFeedPostFromForm, null as CreateFeedPostState | null);

  useEffect(() => {
    if (state?.ok === true) {
      router.push(`/posts/${state.id}`);
    }
  }, [state, router]);

  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;
  const formError = state?.ok === false ? state.formError : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {formError ? (
        <p className="rounded-lg border border-[var(--bina-red)]/40 bg-[var(--bina-red)]/10 px-3 py-2 font-bina-display text-xs text-[var(--bina-red)]">
          {formError}
        </p>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="font-bina-display text-[11px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
          {t("titleLabel")}
        </span>
        <input
          className="rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-2 font-bina-display text-sm text-[var(--bina-text)] outline-none ring-[var(--bina-or)] focus:ring-2"
          name="title"
          required
          maxLength={200}
          type="text"
          autoComplete="off"
          placeholder={t("titlePlaceholder")}
        />
        {fieldErrors?.title ? (
          <span className="text-xs text-[var(--bina-red)]">{fieldErrors.title}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-bina-display text-[11px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
          {t("bodyLabel")}
        </span>
        <textarea
          className="min-h-[140px] resize-y rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-2 font-bina-display text-sm text-[var(--bina-text)] outline-none ring-[var(--bina-or)] focus:ring-2"
          name="body"
          required
          maxLength={8000}
          placeholder={t("bodyPlaceholder")}
        />
        {fieldErrors?.body ? (
          <span className="text-xs text-[var(--bina-red)]">{fieldErrors.body}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-bina-display text-[11px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
          {t("locationLabel")}
        </span>
        <input
          className="rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-2 font-bina-display text-sm text-[var(--bina-text)] outline-none ring-[var(--bina-or)] focus:ring-2"
          name="location"
          maxLength={120}
          type="text"
          defaultValue={defaultLocation ?? ""}
          placeholder={t("locationPlaceholder")}
        />
        {fieldErrors?.location ? (
          <span className="text-xs text-[var(--bina-red)]">{fieldErrors.location}</span>
        ) : null}
      </label>

      <button
        className="font-bina-display mt-2 rounded-[var(--bina-r)] bg-[var(--bina-or)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? t("submitting") : t("submit")}
      </button>

      <Link
        href="/"
        className="font-bina-display text-center text-[11px] font-semibold text-[var(--bina-or)] underline"
      >
        {t("cancel")}
      </Link>
    </form>
  );
}
