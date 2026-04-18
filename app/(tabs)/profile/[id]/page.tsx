"use client";

import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ProfileTabStrip } from "@/components/profile-tab-strip";
import { UserPresenceBadge } from "@/components/user-presence-badge";
import { ExpertBadge } from "@/components/expert-badge";
import { AvatarImage } from "@/components/avatar-image";
import { VerifiedBadge } from "@/components/verified-badge";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { fetchProfileLegalCompanyName } from "@/lib/profiles/legal-company-name";
import { enrichFeedPostsSocial } from "@/lib/feed/enrich-feed-post-social";
import { normalizeFeedPostImages } from "@/lib/feed/normalize-feed-post-images";
import type { FeedPostItem } from "@/lib/feed/feed-post-types";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "ar";
  const loc = locale === "en" ? "en" : "ar";
  const t = await getTranslations("publicProfile");
  const dateLocale = loc === "en" ? "en-GB" : "ar-EG";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/profile/${id}`)}`);
  }

  if (user.id === id) {
    redirect("/profile");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, user_type, location, avatar_url, created_at, last_seen_at, business_verification_status, expert_verification_status",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  const { data: listingsRaw } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  const listings = listingsRaw ?? [];

  const isVerifiedBusiness = profile.business_verification_status === "verified";
  const isExpert = profile.expert_verification_status === "verified";

  type FeedPostRow = Database["public"]["Tables"]["feed_posts"]["Row"];
  let feedPostRows: FeedPostRow[] = [];
  try {
    const { data } = await supabase
      .from("feed_posts")
      .select("*")
      .eq("user_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(48);
    feedPostRows = data ?? [];
  } catch {
    feedPostRows = [];
  }

  const userPosts: FeedPostItem[] = feedPostRows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    body: row.body,
    images: normalizeFeedPostImages(row.images),
    location: row.location,
    view_count: row.view_count,
    created_at: row.created_at,
    author_name: profile.full_name,
    author_role: profile.user_type ?? "contractor",
    is_pro: isVerifiedBusiness,
    is_expert: isExpert,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    likedByViewer: false,
    savedByViewer: false,
  }));
  await enrichFeedPostsSocial(supabase, userPosts, user.id).catch(() => {});

  const categoryLabelMap = await getCategoryLabelMap();
  const userTypeLabel =
    profile.user_type === "supplier" ? t("userType.supplier") : t("userType.contractor");
  const tExpert = await getTranslations("expertVerification");
  const legalCompanyName = isVerifiedBusiness ? await fetchProfileLegalCompanyName(supabase, profile.id) : null;
  const legalCompanyNameTrimmed = legalCompanyName?.trim() ?? "";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Link className="text-zinc-600 underline dark:text-zinc-400" href="/gallery">
            {t("galleryLink")}
          </Link>
          <Link className="text-zinc-600 underline dark:text-zinc-400" href={`/users/${id}/ads`}>
            {t("allAdsLink")}
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">{t("title")}</h1>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <AvatarImage src={profile.avatar_url} name={profile.full_name} />
        <div className="w-full text-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{profile.full_name}</p>
            {isVerifiedBusiness ? <VerifiedBadge className="self-center" label={t("verifiedBadgeAria")} /> : null}
            {isExpert ? (
              <ExpertBadge ariaLabel={tExpert("badgeAria")} className="self-center" text={tExpert("badgeShort")} />
            ) : null}
          </div>
          {isVerifiedBusiness && legalCompanyNameTrimmed ? (
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300" dir="auto">
              {t("legalCompanyNameParens", { name: legalCompanyNameTrimmed })}
            </p>
          ) : null}
          <div className="mt-2 flex justify-center">
            <UserPresenceBadge lastSeenAt={profile.last_seen_at} />
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{userTypeLabel}</p>
          {profile.location ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{profile.location}</p>
          ) : null}
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            {t("memberSince", { date: new Date(profile.created_at).toLocaleDateString(dateLocale) })}
          </p>
        </div>
      </div>

      <p className="mx-auto max-w-lg text-center text-xs text-zinc-500 dark:text-zinc-400">{t("contactHint")}</p>

      <ProfileTabStrip
        listings={listings}
        posts={userPosts}
        categoryLabelMap={categoryLabelMap}
        viewerUserId={user.id}
        emptyListings={t("emptyListings")}
      />
    </div>
  );
}
