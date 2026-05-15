import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { FeedPostCreateForm } from "@/components/feed-post-create-form";
import { createClient } from "@/lib/supabase/server";
import { isEnabled } from "@/lib/config/features";

export const dynamic = "force-dynamic";

export default async function NewFeedPostPage() {
  // Redirect if social features are disabled
  if (!isEnabled("social")) {
    redirect("/");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/posts/new");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("location")
    .eq("id", user.id)
    .maybeSingle();

  const t = await getTranslations("feedPost");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-3 pb-10 pt-4">
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          className="font-bina-display text-[11px] font-semibold text-[var(--bina-or)] underline"
        >
          ← {t("backToFeed")}
        </Link>
        <h1 className="font-bina-display text-xl font-black text-[var(--bina-text)]">{t("pageTitle")}</h1>
        <p className="font-bina-display text-[11px] leading-relaxed text-[var(--bina-muted)]">{t("intro")}</p>
      </div>

      <FeedPostCreateForm defaultLocation={profile?.location ?? null} />
    </div>
  );
}
