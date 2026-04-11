"use client";

import { useTranslations } from "next-intl";

/** Gold header bar shared by feed card and post detail (Veterans Corner). */
export function FeedVeteransCornerBanner() {
  const t = useTranslations("feed");

  return (
    <div
      className="flex min-h-[34px] flex-wrap items-center gap-1 px-2.5 py-1.5 max-[380px]:px-2"
      style={{ background: "linear-gradient(90deg,#3d2a00,#2e2000)", borderBottom: "1px solid #604010" }}
    >
      <span className="text-[12px] leading-none text-[var(--bina-gold)]" aria-hidden>
        ★
      </span>
      <span className="font-bina-display text-[9px] font-black uppercase tracking-[0.06em] text-[var(--bina-gold)]">
        {t("veteransCornerTitle")}
      </span>
      <span className="mx-0.5 text-[var(--bina-gold)] opacity-50">·</span>
      <span className="font-bina-display text-[9px] font-bold leading-tight text-[var(--bina-gold)]">{t("veteransWisdom")}</span>
      <span className="ms-auto shrink-0 rounded border border-[#604010] bg-[#3d2a00] px-1 py-px font-bina-display text-[7px] font-bold text-[var(--bina-gold)]">
        ★ {t("veteranBadge")}
      </span>
    </div>
  );
}
