import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminExpertVerificationActions } from "@/components/admin-expert-verification-actions";
import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ userId: string }> };

export default async function AdminExpertVerificationDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const t = await getTranslations("adminExpertVerifications.detail");
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone_number, expert_verification_status, expert_verification_admin_notes, expert_verification_reviewed_at, expert_credentials_summary",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  const showActions = profile.expert_verification_status === "pending";

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
        <Link className={adminUi.linkBack} href="/admin/expert-verifications">
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
            <strong>{t("statusLabel")}:</strong> {profile.expert_verification_status}
          </p>
          {profile.phone_number ? (
            <p className="mt-2 text-sm" dir="ltr">
              {profile.phone_number}
            </p>
          ) : null}
          {profile.expert_verification_admin_notes ? (
            <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">
              {t("lastNotes")}: {profile.expert_verification_admin_notes}
            </p>
          ) : null}
        </div>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("credentialsHeading")}</div>
        <div className={adminUi.widgetBody}>
          {profile.expert_credentials_summary?.trim() ? (
            <p className="whitespace-pre-wrap text-sm" dir="auto">
              {profile.expert_credentials_summary.trim()}
            </p>
          ) : (
            <p className="text-sm text-[var(--admin-text-secondary)]">{t("noCredentials")}</p>
          )}
        </div>
      </div>

      {showActions ? (
        <div className={adminUi.cardPadded}>
          <h2 className="text-sm font-semibold">{t("decisionHeading")}</h2>
          <AdminExpertVerificationActions userId={userId} />
        </div>
      ) : null}
    </div>
  );
}
