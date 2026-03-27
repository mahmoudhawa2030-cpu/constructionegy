"use client";

import { useTranslations } from "next-intl";

export function MapLoadingFallback() {
  const t = useTranslations("mapPage");
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-zinc-500 dark:text-zinc-400">
      {t("loadingMap")}
    </div>
  );
}
