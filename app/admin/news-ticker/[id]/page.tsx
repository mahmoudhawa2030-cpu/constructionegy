import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { NewsTickerForm } from "@/components/admin/news-ticker-form";
import { adminUi } from "@/lib/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import { getNewsTickerAdmin } from "@/lib/news-ticker/queries";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function AdminNewsTickerEditPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const t = await getTranslations("adminNewsTicker");
  const supabase = await createClient();

  let ticker = null;
  try {
    ticker = await getNewsTickerAdmin(supabase, id);
  } catch {
    ticker = null;
  }
  if (!ticker) notFound();

  return (
    <div className={adminUi.page}>
      <div className="mb-4">
        <Link className={adminUi.linkBack} href="/admin/news-ticker">
          {t("backList")}
        </Link>
        <h1 className={adminUi.pageTitle}>{t("editTitle")}</h1>
        <p className={adminUi.pageLead}>{ticker.name}</p>
      </div>
      <NewsTickerForm mode="edit" initial={ticker} />
    </div>
  );
}
