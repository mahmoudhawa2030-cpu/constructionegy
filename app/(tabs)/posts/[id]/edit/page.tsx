import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FeedPostEditForm } from "@/components/feed-post-edit-form";
import { normalizeFeedPostImages } from "@/lib/feed/normalize-feed-post-images";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditFeedPostPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/posts/${id}/edit`);
  }

  const { data: post, error } = await supabase
    .from("feed_posts")
    .select("id,user_id,body,images,location,status")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !post) {
    notFound();
  }
  if (post.user_id !== user.id) {
    notFound();
  }

  const t = await getTranslations("feedPost");
  const images = normalizeFeedPostImages(post.images);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-3 pb-10 pt-4">
      <div className="flex flex-col gap-1">
        <Link
          className="font-bina-display text-[11px] font-semibold text-[var(--bina-or)] underline"
          href={`/posts/${id}`}
        >
          ← {t("owner.backToPost")}
        </Link>
        <h1 className="font-bina-display text-xl font-black text-[var(--bina-text)]">{t("owner.pageTitle")}</h1>
        <p className="font-bina-display text-[11px] leading-relaxed text-[var(--bina-muted)]">{t("owner.intro")}</p>
      </div>

      <FeedPostEditForm
        initialBody={post.body}
        initialImageUrls={images}
        initialLocation={post.location}
        postId={post.id}
      />
    </div>
  );
}
