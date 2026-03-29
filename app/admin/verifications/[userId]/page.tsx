import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminBusinessVerificationActions } from "@/components/admin-business-verification-actions";
import { RFQ_SIGNED_URL_TTL } from "@/lib/rfq/constants";
import { adminUi } from "@/lib/admin-ui";
import { fetchProfileLegalCompanyName } from "@/lib/profiles/legal-company-name";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ userId: string }> };

function docTypeLabel(type: string, t: (key: string) => string): string {
  switch (type) {
    case "commercial_register":
      return t("docType.commercial_register");
    case "tax_card":
      return t("docType.tax_card");
    case "personal_id":
      return t("docType.personal_id");
    default:
      return type;
  }
}

export default async function AdminVerificationDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const t = await getTranslations("adminVerifications.detail");
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone_number, business_verification_status, business_verification_admin_notes, business_verification_reviewed_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  const legalCompanyName = await fetchProfileLegalCompanyName(supabase, userId);

  const { data: docs } = await supabase
    .from("business_verification_documents")
    .select("document_type, original_filename, storage_path, byte_size")
    .eq("user_id", userId)
    .order("document_type", { ascending: true });

  const links: { type: string; name: string; url: string | null }[] = [];
  for (const d of docs ?? []) {
    const { data: signed } = await supabase.storage
      .from("business-verification")
      .createSignedUrl(d.storage_path, RFQ_SIGNED_URL_TTL);
    links.push({
      type: d.document_type,
      name: d.original_filename,
      url: signed?.signedUrl ?? null,
    });
  }

  const showActions = profile.business_verification_status === "pending";

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>{t("title")}</h1>
        <p className={adminUi.pageLead}>
          {profile.full_name} ·{" "}
          <span className="font-mono text-sm" dir="ltr">
            {profile.id}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link className={adminUi.linkBack} href="/admin/verifications">
          {t("back")}
        </Link>
        <Link className={adminUi.linkBack} href={`/admin/users/${userId}/edit`}>
          {t("editUser")}
        </Link>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("statusSection")}</div>
        <div className={adminUi.widgetBody}>
          <p className="text-sm">
            <strong>{t("statusLabel")}:</strong> {profile.business_verification_status}
          </p>
          {legalCompanyName?.trim() ? (
            <p className="mt-2 text-sm">
              <strong>{t("legalCompanyLabel")}:</strong>{" "}
              <span dir="auto">{legalCompanyName.trim()}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">{t("legalCompanyMissing")}</p>
          )}
          {profile.phone_number ? (
            <p className="mt-2 text-sm" dir="ltr">
              {profile.phone_number}
            </p>
          ) : null}
          {profile.business_verification_admin_notes ? (
            <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">
              {t("lastNotes")}: {profile.business_verification_admin_notes}
            </p>
          ) : null}
        </div>
      </div>

      {showActions ? (
        <div className={adminUi.cardPadded}>
          <h2 className="text-sm font-semibold">{t("decisionHeading")}</h2>
          <AdminBusinessVerificationActions userId={userId} />
        </div>
      ) : null}

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("documentsHeading")}</div>
        <div className={adminUi.widgetBody}>
          {links.length === 0 ? (
            <p className="text-sm text-[var(--admin-text-secondary)]">{t("noDocs")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {links.map((x) => (
                <li key={x.type} className="text-sm">
                  <strong>{docTypeLabel(x.type, t)}</strong> — {x.name}
                  {x.url ? (
                    <>
                      {" "}
                      <a className="text-[var(--admin-brand)] underline" href={x.url} rel="noreferrer" target="_blank">
                        {t("open")}
                      </a>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
