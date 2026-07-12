import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { logNotFound } from "@/lib/seo/redirects";

export default async function GlobalNotFound() {
  const t = await getTranslations("notFound");
  const headerList = await headers();
  const pathname = headerList.get("x-pathname");
  const referrer = headerList.get("referer");

  if (pathname) {
    // Fire-and-forget: never block the 404 render on the log write.
    void logNotFound(pathname, referrer);
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-6xl font-bold tracking-tight text-[var(--admin-brand,#1a5fb4)]">404</p>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">{t("description")}</p>
      <Link
        className="mt-2 rounded-sm bg-[var(--admin-brand,#1a5fb4)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        href="/"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
