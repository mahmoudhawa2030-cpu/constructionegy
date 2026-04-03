import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function FeedPostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("feed");

  const { data: post, error } = await supabase
    .from("feed_posts")
    .select("id,user_id,title,body,images,location,created_at,status")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,user_type")
    .eq("id", post.user_id)
    .maybeSingle();

  const author = profile?.full_name ?? "—";
  const role = profile?.user_type ?? "contractor";
  const thumb = post.images?.[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bina-steel)] px-3 pb-8 pt-4">
      <Link
        href="/"
        className="font-bina-display mb-4 inline-block text-[11px] font-semibold text-[var(--bina-or)] underline"
      >
        ← {t("backToFeed")}
      </Link>

      <p className="font-bina-display mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
        {t("postKind")}
      </p>
      <h1 className="sr-only">{post.title}</h1>
      <p className="font-bina-display mb-4 text-[11px] text-[var(--bina-muted)]">
        {author} · {role}
        {post.location ? ` · ${post.location}` : ""}
      </p>

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
    </div>
  );
}
