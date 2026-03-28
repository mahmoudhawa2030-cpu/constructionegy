import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RfqUpload } from "@/components/rfq-upload";
import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RfqPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/rfq")}`);
  }

  if (!(await canAccessFeature(user.id, "rfq"))) {
    redirect("/subscription-required?feature=rfq");
  }

  const t = await getTranslations("rfqPage");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-3 py-5 sm:px-4 sm:py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </div>
      <RfqUpload />
    </div>
  );
}
