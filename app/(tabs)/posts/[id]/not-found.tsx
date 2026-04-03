import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function FeedPostNotFound() {
  const t = await getTranslations("feed");

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 bg-[var(--bina-steel)] px-4 py-12 text-center">
      <p className="font-bina-display text-sm text-[var(--bina-muted)]">{t("postNotFound")}</p>
      <Link
        href="/"
        className="font-bina-display text-[11px] font-semibold text-[var(--bina-or)] underline"
      >
        {t("backToFeed")}
      </Link>
    </div>
  );
}
