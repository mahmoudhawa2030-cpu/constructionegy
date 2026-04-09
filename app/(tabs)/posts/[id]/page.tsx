import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ExpertBadge } from "@/components/expert-badge";
import { FeedPostCommentForm } from "@/components/feed-post-comment-form";
import { FeedPostCommentList } from "@/components/feed-post-comment-list";
import { FeedPostOwnerActions } from "@/components/feed-post-owner-actions";
import { FeedPostSocialBar } from "@/components/feed-post-social-bar";
import { FeedVeteransPostDetailShell } from "@/components/feed-veterans-post-detail-shell";
import { enrichFeedPostsSocial } from "@/lib/feed/enrich-feed-post-social";
import type { FeedPostItem } from "@/lib/feed/feed-post-types";
import { normalizeFeedPostImages } from "@/lib/feed/normalize-feed-post-images";
import { fetchFeedPostComments } from "@/lib/feed/fetch-post-comments";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function FeedPostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("feed");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from("feed_posts")
    .select(
      "id,user_id,title,body,images,location,view_count,like_count,comment_count,created_at,status,is_veterans_corner",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  const [{ data: profile }, comments] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,user_type,business_verification_status,expert_verification_status")
      .eq("id", post.user_id)
      .maybeSingle(),
    fetchFeedPostComments(supabase, id),
  ]);

  const author = profile?.full_name ?? "—";
  const role = profile?.user_type ?? "contractor";
  const isPro = profile?.business_verification_status === "verified";
  const isExpert = profile?.expert_verification_status === "verified";
  const tExpertMeta = await getTranslations("expertVerification");
  const postImages = normalizeFeedPostImages(post.images);
  const thumb = postImages[0];

  const socialItem: FeedPostItem = {
    id: post.id,
    user_id: post.user_id,
    title: post.title,
    body: post.body,
    images: postImages,
    location: post.location,
    view_count: post.view_count,
    created_at: post.created_at,
    author_name: author,
    author_role: role,
    is_pro: isPro,
    is_expert: isExpert,
    likeCount: post.like_count ?? 0,
    commentCount: post.comment_count ?? 0,
    likedByViewer: false,
    savedByViewer: false,
  };
  await enrichFeedPostsSocial(supabase, [socialItem], user?.id ?? null);

  const isVeteransCorner = Boolean(post.is_veterans_corner);
  const isOwner = Boolean(user?.id && user.id === post.user_id);

  const postMain = (
    <>
      <p
        className={`font-bina-display mb-1 text-[10px] font-semibold uppercase tracking-wide ${
          isVeteransCorner ? "text-[var(--bina-gold)]" : "text-[var(--bina-muted)]"
        }`}
      >
        {isVeteransCorner ? t("veteransCornerTitle") : t("postKind")}
      </p>
      <h1 className="sr-only">{post.title}</h1>
      <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-bina-display text-[11px] text-[var(--bina-muted)]">
        <span>
          {author} · {role}
          {post.location ? ` · ${post.location}` : ""}
        </span>
        {isExpert ? (
          <ExpertBadge ariaLabel={tExpertMeta("badgeAria")} text={tExpertMeta("badgeShort")} />
        ) : null}
      </p>

      {isOwner ? <FeedPostOwnerActions postId={post.id} /> : null}

      {thumb ? (
        <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-[var(--bina-r)] border border-[var(--bina-border)]">
          <Image
            alt=""
            src={thumb}
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized={thumb.startsWith("http")}
          />
        </div>
      ) : null}

      <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--bina-text)]">{post.body}</div>

      <FeedPostSocialBar
        embed
        postId={post.id}
        title={post.title}
        initialLikeCount={socialItem.likeCount}
        initialCommentCount={socialItem.commentCount}
        initialLiked={socialItem.likedByViewer}
        initialSaved={socialItem.savedByViewer}
        viewerId={user?.id ?? null}
        variant={isVeteransCorner ? "veterans" : "default"}
      />

      <section
        id="comments"
        className={`mt-8 scroll-mt-4 border-t pt-6 ${
          isVeteransCorner ? "border-[#604010]" : "border-[var(--bina-border)]"
        }`}
      >
        <h2 className="font-bina-display mb-3 text-[12px] font-black uppercase tracking-wide text-[var(--bina-text)]">
          {t("social.commentsHeading")}
        </h2>
        <div className="mb-6">
          <FeedPostCommentForm postId={post.id} viewerId={user?.id ?? null} />
        </div>
        <FeedPostCommentList comments={comments} />
      </section>
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bina-steel)] px-3 pb-8 pt-4">
      <Link
        href="/"
        className="font-bina-display mb-4 inline-block text-[11px] font-semibold text-[var(--bina-or)] underline"
      >
        ← {t("backToFeed")}
      </Link>

      {isVeteransCorner ? <FeedVeteransPostDetailShell>{postMain}</FeedVeteransPostDetailShell> : postMain}
    </div>
  );
}
