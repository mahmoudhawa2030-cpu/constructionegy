import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ChatThread } from "@/components/chat-thread";
import { UserPresenceBadge } from "@/components/user-presence-badge";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ chatId: string }> };

export default async function ChatThreadPage({ params }: PageProps) {
  const { chatId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/messages/${chatId}`);
  }

  const { data: chat, error: chatErr } = await supabase
    .from("chats")
    .select("id, listing_id, participant1_id, participant2_id")
    .eq("id", chatId)
    .maybeSingle();

  if (chatErr || !chat) {
    notFound();
  }

  if (chat.participant1_id !== user.id && chat.participant2_id !== user.id) {
    notFound();
  }

  let listingTitle = "محادثة";
  if (chat.listing_id) {
    const { data: listing } = await supabase
      .from("listings")
      .select("title")
      .eq("id", chat.listing_id)
      .maybeSingle();
    if (listing?.title) listingTitle = listing.title;
  }

  const otherId =
    chat.participant1_id === user.id ? chat.participant2_id : chat.participant1_id;
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("full_name, last_seen_at")
    .eq("id", otherId)
    .maybeSingle();

  const { data: messages, error: msgErr } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (msgErr) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <p className="text-sm text-red-600 dark:text-red-400">تعذر تحميل الرسائل.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" dir="rtl">
      <header className="shrink-0 border-b border-zinc-200 bg-zinc-50/90 px-4 py-3 sm:px-5 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Link
          className="mb-2 inline-block text-sm font-medium text-zinc-600 underline hover:text-zinc-900 md:hidden dark:text-zinc-400 dark:hover:text-zinc-100"
          href="/messages"
        >
          المحادثات
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl dark:text-zinc-50">
          {listingTitle}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            مع{" "}
            <Link
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-950 dark:text-zinc-200 dark:decoration-zinc-500 dark:hover:text-zinc-50"
              href={`/profile/${otherId}`}
            >
              {otherProfile?.full_name ?? "مستخدم"}
            </Link>
          </span>
          <UserPresenceBadge compact lastSeenAt={otherProfile?.last_seen_at ?? null} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col pt-2 sm:px-5 sm:pb-2 sm:pt-4">
        <ChatThread
          chatId={chatId}
          currentUserId={user.id}
          initialMessages={messages ?? []}
        />
      </div>
    </div>
  );
}
