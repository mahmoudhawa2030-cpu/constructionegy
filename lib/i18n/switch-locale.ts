"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { type Locale, isLocale } from "@/i18n/config";

const COOKIE_LOCALE = "locale";

export async function switchLocale(locale: string, pathname: string): Promise<void> {
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(COOKIE_LOCALE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const safe = pathname.startsWith("/") ? pathname : "/";
  redirect(safe);
}
