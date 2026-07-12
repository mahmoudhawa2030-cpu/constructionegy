import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

import { NewsTickerBar } from "@/components/news-ticker-bar";
import { getActiveNewsTicker } from "@/lib/news-ticker/queries";
import { createClient } from "@/lib/supabase/server";

type Props = {
  surface: "web" | "mobile";
  /** Override pathname; defaults to x-pathname / referer / / */
  pathname?: string;
};

async function resolvePathname(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  try {
    const h = await headers();
    const fromHeader = h.get("x-pathname") || h.get("x-invoke-path") || h.get("next-url");
    if (fromHeader) {
      try {
        if (fromHeader.startsWith("http")) return new URL(fromHeader).pathname;
        return fromHeader.split("?")[0] || "/";
      } catch {
        return fromHeader;
      }
    }
    const ref = h.get("referer");
    if (ref) {
      try {
        return new URL(ref).pathname;
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  return "/";
}

export async function NewsTickerSlot({ surface, pathname }: Props) {
  const supabase = await createClient();
  const localeRaw = await getLocale();
  const locale = localeRaw === "ar" ? "ar" : "en";
  const path = await resolvePathname(pathname);

  let ticker = null;
  try {
    ticker = await getActiveNewsTicker(supabase, { surface, pathname: path, locale });
  } catch {
    return null;
  }
  if (!ticker) return null;
  return <NewsTickerBar ticker={ticker} />;
}
