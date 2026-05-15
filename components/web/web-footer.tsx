"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function WebFooter() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: t("about"),
      links: [
        { label: t("aboutUs"), href: "/about" },
        { label: t("careers"), href: "/careers" },
        { label: t("press"), href: "/press" },
      ],
    },
    {
      title: t("business"),
      links: [
        { label: t("sellOnBina"), href: "/sell" },
        { label: t("supplierMembership"), href: "/membership" },
        { label: t("advertise"), href: "/advertise" },
      ],
    },
    {
      title: t("support"),
      links: [
        { label: t("helpCenter"), href: "/help" },
        { label: t("contactUs"), href: "/contact" },
        { label: t("reportIssue"), href: "/report" },
      ],
    },
    {
      title: t("legal"),
      links: [
        { label: t("terms"), href: "/terms" },
        { label: t("privacy"), href: "/privacy" },
        { label: t("cookies"), href: "/cookies" },
      ],
    },
  ];

  return (
    <footer className="border-t border-[var(--bina-border)] bg-[var(--bina-steel)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold text-[var(--bina-text)]">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--bina-muted)] hover:text-[var(--bina-text)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-[var(--bina-border)] pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-[var(--bina-muted)]">
              © {currentYear} BINAHub. {t("allRightsReserved")}
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-xs text-[var(--bina-muted)] hover:text-[var(--bina-text)]">
                {t("terms")}
              </Link>
              <Link href="/privacy" className="text-xs text-[var(--bina-muted)] hover:text-[var(--bina-text)]">
                {t("privacy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
