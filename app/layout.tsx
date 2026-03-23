import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";

import { CapacitorBridge } from "@/components/capacitor-bridge";

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

export const metadata: Metadata = {
  title: "construction-egy",
  description: "Next.js + Supabase SSR",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${notoSansArabic.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      dir="rtl"
      lang="ar"
    >
      <body className="flex min-h-full flex-col font-sans">
        <CapacitorBridge />
        {children}
      </body>
    </html>
  );
}
