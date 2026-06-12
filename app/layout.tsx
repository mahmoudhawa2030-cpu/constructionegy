import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { AppThemeProvider } from "@/components/app-theme-provider";
import { CapacitorBridge } from "@/components/capacitor-bridge";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";
import { getSiteUrl } from "@/lib/seo/site-url";
import { getTrackingScripts } from "@/lib/tracking/get-tracking-scripts";

import "./globals.css";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(getSiteUrl()),
    title: t("title"),
    description: t("description"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const tracking = await getTrackingScripts();

  return (
    <html
      className={`${notoSansArabic.variable} ${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
      dir={dir}
      lang={locale}
      suppressHydrationWarning
    >
      {tracking.header ? (
        <head dangerouslySetInnerHTML={{ __html: tracking.header }} />
      ) : null}
      <body className="flex h-full flex-col font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppThemeProvider>
            <CapacitorBridge />
            <PresenceHeartbeat />
            {children}
          </AppThemeProvider>
        </NextIntlClientProvider>
        {tracking.footer ? (
          <div dangerouslySetInnerHTML={{ __html: tracking.footer }} />
        ) : null}
      </body>
    </html>
  );
}
