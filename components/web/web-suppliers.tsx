"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

type Supplier = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  business_verification_status: string;
};

type Props = {
  suppliers: Supplier[];
};

export function WebSuppliers({ suppliers }: Props) {
  const t = useTranslations("suppliers");

  if (!suppliers.length) {
    return <p className="text-[var(--bina-muted)]">{t("noSuppliers")}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
      {suppliers.map((supplier) => (
        <Link
          key={supplier.id}
          href={`/profile/${supplier.id}`}
          className="group flex flex-col items-center gap-3 rounded-xl border border-[var(--bina-border)] bg-white p-4 text-center transition-all hover:border-[var(--bina-primary)] hover:shadow-md"
        >
          <div className="relative">
            {supplier.avatar_url ? (
              <img
                src={supplier.avatar_url}
                alt={supplier.full_name || ""}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bina-primary)] text-2xl font-bold text-white">
                {supplier.full_name?.charAt(0).toUpperCase() || "S"}
              </div>
            )}
            {supplier.business_verification_status === "verified" && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                ✓
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-[var(--bina-text)] line-clamp-1">
              {supplier.full_name || t("unnamedSupplier")}
            </p>
            <p className="text-xs text-green-600">{t("verified")}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
