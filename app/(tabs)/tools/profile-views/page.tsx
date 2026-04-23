import { getTranslations } from "next-intl/server";

export default async function ProfileViewsPage() {
  const t = await getTranslations("toolsMenu");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="text-6xl">👁</span>
      <h1 className="font-bina-display text-xl font-black text-[var(--bina-text)]">{t("profileViews")}</h1>
      <p className="font-bina-display text-sm text-[var(--bina-muted)]">{t("comingSoon")}</p>
    </div>
  );
}
