"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { addFeedPostComment } from "@/lib/feed/feed-post-social-actions";

async function submitComment(
  _prev: Awaited<ReturnType<typeof addFeedPostComment>> | null,
  formData: FormData,
) {
  const postId = String(formData.get("post_id") ?? "");
  const parentId = String(formData.get("parent_id") ?? "") || null;
  const body = String(formData.get("body") ?? "");
  return addFeedPostComment(postId, body, parentId);
}

type Props = {
  postId: string;
  viewerId: string | null;
  replyTo?: { id: string; authorName: string } | null;
  onCancel?: () => void;
  onSuccess?: (body: string, parentId: string | null) => void;
  autoFocus?: boolean;
};

export function FeedPostCommentForm({ postId, viewerId, replyTo, onCancel, onSuccess, autoFocus }: Props) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [state, action, pending] = useActionState(submitComment, null);
  const [formKey, setFormKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isReply = Boolean(replyTo);
  const mentionPrefix = replyTo ? `@${replyTo.authorName} ` : "";

  useEffect(() => {
    if (state?.ok === true) {
      if (onSuccess) {
        const body = state.submittedBody ?? "";
        const parentId = state.submittedParentId ?? null;
        onSuccess(body, parentId);
      }
      setFormKey((k) => k + 1);
      router.refresh();
      if (onCancel) onCancel();
    }
  }, [state, router, onCancel, onSuccess]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [autoFocus, formKey]);

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
      {replyTo ? <input type="hidden" name="parent_id" value={replyTo.id} /> : null}
      <label className="flex flex-col gap-1">
        <span className="font-bina-display text-[10px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
          {isReply ? t("social.replyLabel", { name: replyTo!.authorName }) : t("social.commentLabel")}
        </span>
        <textarea
          ref={textareaRef}
          name="body"
          required
          maxLength={2000}
          rows={isReply ? 2 : 3}
          defaultValue={mentionPrefix}
          className="resize-y rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-2 font-bina-display text-sm text-[var(--bina-text)] outline-none ring-[var(--bina-or)] focus:ring-2"
          placeholder={isReply ? t("social.replyPlaceholder") : t("social.commentPlaceholder")}
        />
      </label>
      {state?.ok === false ? (
        <p className="font-bina-display text-xs text-[var(--bina-red)]">{state.message}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="font-bina-display w-fit rounded-[var(--bina-r)] bg-[var(--bina-or)] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {pending
            ? isReply ? t("social.replySubmitting") : t("social.commentSubmitting")
            : isReply ? t("social.replySubmit") : t("social.commentSubmit")}
        </button>
        {isReply && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="font-bina-display text-[11px] font-semibold text-[var(--bina-muted)] underline"
          >
            {t("social.cancelReply")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
