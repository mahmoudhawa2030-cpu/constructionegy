"use client";

import { useTranslations } from "next-intl";

/** Gold header bar shared by feed card and post detail (Veterans Corner). */
export function FeedVeteransCornerBanner() {
  const t = useTranslations("feed");

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-[7px]"
      style={{ background: "linear-gradient(90deg,#3d2a00,#2e2000)", borderBottom: "1px solid #604010" }}
    >
      <span className="text-[13px] text-[var(--bina-gold)]" aria-hidden>
        ★
      </span>
      <span className="font-bina-display text-[10px] font-black uppercase tracking-[1px] text-[var(--bina-gold)]">
        {t("veteransCornerTitle")}
      </span>
      <span className="mx-0.5 text-[var(--bina-gold)] opacity-50">·</span>
      <span className="font-bina-display text-[10px] font-bold text-[var(--bina-gold)]">{t("veteransWisdom")}</span>
      <span className="ms-auto rounded border border-[#604010] bg-[#3d2a00] px-1.5 py-px font-bina-display text-[8px] font-bold text-[var(--bina-gold)]">
        ★ {t("veteranBadge")}
      </span>
    </div>
  );
}
