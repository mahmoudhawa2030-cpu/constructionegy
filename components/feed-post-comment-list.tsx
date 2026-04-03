import { getLocale, getTranslations } from "next-intl/server";

import type { FeedPostCommentItem } from "@/lib/feed/fetch-post-comments";

function rel(iso: string, locale: string) {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "auto" });
  if (diff < 60) return rtf.format(-diff, "second");
  const m = Math.floor(diff / 60);
  if (m < 60) return rtf.format(-m, "minute");
  const h = Math.floor(m / 60);
  if (h < 48) return rtf.format(-h, "hour");
  return rtf.format(-Math.floor(h / 24), "day");
}

type Props = {
  comments: FeedPostCommentItem[];
};

export async function FeedPostCommentList({ comments }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("feed");

  if (!comments.length) {
    return <p className="font-bina-display text-[11px] text-[var(--bina-muted)]">{t("social.noComments")}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((c) => (
        <li key={c.id} className="rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel2)] px-3 py-2">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-1">
            <span className="font-bina-display text-[11px] font-bold text-[var(--bina-text)]">{c.author_name}</span>
            <time className="font-bina-display text-[9px] text-[var(--bina-muted)]" dateTime={c.created_at}>
              {rel(c.created_at, locale)}
            </time>
          </div>
          <p className="whitespace-pre-wrap font-bina-display text-[12px] leading-relaxed text-[var(--bina-text)]">
            {c.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
