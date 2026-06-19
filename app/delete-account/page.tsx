import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/seo/site-url";
import { DeleteAccountForm } from "./delete-account-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deleteAccount");
  return {
    title: t("title"),
    alternates: { canonical: `${getSiteUrl()}/delete-account` },
    robots: { index: false, follow: false },
  };
}

export default async function DeleteAccountPage() {
  const t = await getTranslations("deleteAccount");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasPending = false;
  if (user) {
    const { data } = await supabase
      .from("deletion_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();
    hasPending = !!data;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
      <p className="mb-8 text-sm text-zinc-500">{t("subtitle")}</p>

      {!user ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="mb-4 text-sm text-amber-900 dark:text-amber-100">{t("loginRequired")}</p>
          <a
            href="/login?next=/delete-account"
            className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {t("loginButton")}
          </a>
        </div>
      ) : hasPending ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-sm text-blue-900 dark:text-blue-100">{t("alreadyRequested")}</p>
        </div>
      ) : (
        <DeleteAccountForm />
      )}
    </div>
  );
}
