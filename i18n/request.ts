import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale } from "./config";

const COOKIE_LOCALE = "locale";

export default getRequestConfig(async () => {
  const jar = await cookies();
  let locale = jar.get(COOKIE_LOCALE)?.value;
  if (!locale || !isLocale(locale)) {
    locale = defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
