"use client";

import { useLocale } from "next-intl";

export interface BilingualText {
  ar: string;
  en: string;
}

export function useBilingualText() {
  const locale = useLocale();

  return (text: BilingualText): string => {
    return text[locale as keyof BilingualText] || text.en;
  };
}
