"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { addFeedPostComment } from "@/lib/feed/feed-post-social-actions";

async function submitComment(
  _prev: Awaited<ReturnType<typeof addFeedPostComment>> | null,
  formData: FormData,
) {
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "");
  return addFeedPostComment(postId, body);
}

type Props = {
  postId: string;
  viewerId: string | null;
};

export function FeedPostCommentForm({ postId, viewerId }: Props) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [state, action, pending] = useActionState(submitComment, null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state?.ok === true) {
      setFormKey((k) => k + 1);
      router.refresh();
    }
  }, [state, router]);

  if (!viewerId) {
    const next = encodeURIComponent(`/posts/${postId}#comments`);
    return (
      <p className="font-bina-display text-[11px] text-[var(--bina-muted)]">
        <Link href={`/login?next=${next}`} className="font-semibold text-[var(--bina-or)] underline">
          {t("social.loginToComment")}
        </Link>
      </p>
    );
  }

  return (
    <form key={formKey} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="post_id" value={postId} />
      <label className="flex flex-col gap-1">
        <span className="font-bina-display text-[10px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
          {t("social.commentLabel")}
        </span>
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={3}
          className="resize-y rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-2 font-bina-display text-sm text-[var(--bina-text)] outline-none ring-[var(--bina-or)] focus:ring-2"
          placeholder={t("social.commentPlaceholder")}
        />
      </label>
      {state?.ok === false ? (
        <p className="font-bina-display text-xs text-[var(--bina-red)]">{state.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="font-bina-display w-fit rounded-[var(--bina-r)] bg-[var(--bina-or)] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white disabled:opacity-60"
      >
        {pending ? t("social.commentSubmitting") : t("social.commentSubmit")}
      </button>
    </form>
  );
}
