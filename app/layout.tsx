import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { AppThemeProvider } from "@/components/app-theme-provider";
import { CapacitorBridge } from "@/components/capacitor-bridge";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";

import "./globals.css";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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

  return (
    <html
      className={`${notoSansArabic.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      dir={dir}
      lang={locale}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppThemeProvider>
            <CapacitorBridge />
            <PresenceHeartbeat />
            {children}
          </AppThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
