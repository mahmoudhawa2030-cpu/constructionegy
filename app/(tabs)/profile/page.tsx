import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BusinessVerificationPanel } from "@/components/business-verification-panel";
import { ExpertVerificationPanel } from "@/components/expert-verification-panel";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { ProfileListingsGrid } from "@/components/profile-listings-grid";
import { getCurrentProfile } from "@/lib/auth/admin";
import type { BusinessVerificationDocType } from "@/lib/business-verification/constants";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { fetchProfileLegalCompanyName } from "@/lib/profiles/legal-company-name";
import { RFQ_SIGNED_URL_TTL } from "@/lib/rfq/constants";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

type ProfileFields = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "user_type" | "phone_number" | "whatsapp_number" | "location" | "avatar_url"
>;

type VerificationDocRow = {
  document_type: BusinessVerificationDocType;
  original_filename: string | null;
  previewUrl: string | null;
};

function imagePreviewExt(filename: string): boolean {
  const i = filename.lastIndexOf(".");
  const ext = i >= 0 ? filename.slice(i + 1).toLowerCase() : "";
  return ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp";
}

function defaultProfileFromUser(email: string | undefined, defaultDisplayName: string): ProfileFields {
  const local = email?.split("@")[0]?.trim();
  return {
    full_name: local && local.length >= 2 ? local : defaultDisplayName,
    user_type: "contractor",
    phone_number: null,
    whatsapp_number: null,
    location: null,
    avatar_url: null,
  };
}

export default async function ProfilePage() {
  const { user, profile } = await getCurrentProfile();
  const t = await getTranslations("profile");
  const supabase = await createClient();
  const { data: myListingsRaw } = user
    ? await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(48)
    : { data: null };

  const myListings = myListingsRaw ?? [];
  const categoryLabelMap = await getCategoryLabelMap();

  const legalCompanyNameForVerification =
    user && profile ? await fetchProfileLegalCompanyName(supabase, user.id) : null;

  let verificationDocs: VerificationDocRow[] = [];
  if (user && profile) {
    const { data: rawDocs } = await supabase
      .from("business_verification_documents")
      .select("document_type, original_filename, storage_path")
      .eq("user_id", user.id);
    for (const row of rawDocs ?? []) {
      let previewUrl: string | null = null;
      const name = row.original_filename ?? "";
      if (name && imagePreviewExt(name)) {
        const { data: signed } = await supabase.storage
          .from("business-verification")
          .createSignedUrl(row.storage_path, RFQ_SIGNED_URL_TTL);
        previewUrl = signed?.signedUrl ?? null;
      }
      verificationDocs.push({
        document_type: row.document_type as BusinessVerificationDocType,
        original_filename: row.original_filename,
        previewUrl,
      });
    }
  }

  const formProfile: ProfileFields = profile
    ? {
        full_name: profile.full_name,
        user_type: profile.user_type,
        phone_number: profile.phone_number,
        whatsapp_number: profile.whatsapp_number,
        location: profile.location,
        avatar_url: profile.avatar_url,
      }
    : defaultProfileFromUser(user?.email ?? undefined, t("defaultDisplayName"));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">{t("title")}</h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {user ? t("subtitleLoggedIn") : t("subtitleGuest")}
        </p>
        {user?.email ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-500" dir="ltr">
            {user.email}
          </p>
        ) : null}
      </div>

      {user ? (
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {t("greeting")}{" "}
          <span className="text-zinc-950 dark:text-zinc-50">{formProfile.full_name}</span>
        </p>
      ) : null}

      {user && !profile ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          {t("noProfileRecord")}
        </p>
      ) : null}

      <div className="flex w-full flex-col gap-2">
        {!user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/login"
          >
            {t("login")}
          </Link>
        ) : null}
        {user && profile ? (
          <BusinessVerificationPanel
            adminNotes={profile.business_verification_admin_notes}
            documents={verificationDocs}
            legalCompanyName={legalCompanyNameForVerification}
            status={profile.business_verification_status}
          />
        ) : null}
        {user && profile ? (
          <ExpertVerificationPanel
            adminNotes={profile.expert_verification_admin_notes}
            credentialsSummary={profile.expert_credentials_summary}
            status={profile.expert_verification_status}
          />
        ) : null}
        {user ? (
          <ProfileEditForm key={profile?.id ?? "new"} profile={formProfile} />
        ) : null}
        {user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/messages"
          >
            {t("messages")}
          </Link>
        ) : null}
        {user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/rfq"
          >
            {t("rfq")}
          </Link>
        ) : null}
        {user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/rfq/opportunities"
          >
            {t("rfqOpportunities")}
          </Link>
        ) : null}
        {user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/users/myads"
          >
            {t("myListingsLink")}
          </Link>
        ) : null}
        {user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/listings/new"
          >
            {t("addListing")}
          </Link>
        ) : (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/login?next=/listings/new"
          >
            {t("addListingLogin")}
          </Link>
        )}
        {profile?.is_admin ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            href="/admin"
          >
            {t("adminPanel")}
          </Link>
        ) : null}
      </div>
      </div>

      {user ? (
        <ProfileListingsGrid
          categoryLabelMap={categoryLabelMap}
          viewerUserId={user.id}
          empty={t.rich("emptyMyListingsRich", {
            link: (chunks) => (
              <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/listings/new">
                {chunks}
              </Link>
            ),
          })}
          listings={myListings}
          title={t("myListingsTitle")}
        />
      ) : null}
    </div>
  );
}
