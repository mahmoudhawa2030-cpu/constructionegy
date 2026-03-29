import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RfqDraftControls } from "@/components/rfq-draft-controls";
import { RfqMyDraftsList } from "@/components/rfq-my-drafts-list";
import { RfqUpload } from "@/components/rfq-upload";
import { RFQ_SIGNED_URL_TTL } from "@/lib/rfq/constants";
import type { RfqAttachmentDto, RfqItemPreview } from "@/lib/rfq/types";
import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ draft?: string }>;
};

export default async function RfqPage({ searchParams }: PageProps) {
  const { draft: draftParam } = await searchParams;
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

  const { data: drafts } = await supabase
    .from("rfq_drafts")
    .select("id, title, status, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(30);

  let activeDraftId: string | null = null;
  let initialTitle: string | null = null;
  let initialStatus = "draft";
  let initialLineItems: RfqItemPreview[] = [];
  let initialAttachments: RfqAttachmentDto[] = [];

  const paramId =
    typeof draftParam === "string" && UUID_RE.test(draftParam.trim()) ? draftParam.trim() : null;

  if (paramId) {
    const { data: one } = await supabase
      .from("rfq_drafts")
      .select("id, title, status, user_id")
      .eq("id", paramId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (one) {
      activeDraftId = one.id;
      initialTitle = one.title;
      initialStatus = one.status;

      const { data: items } = await supabase
        .from("rfq_items")
        .select("row_index, description, quantity, unit, notes")
        .eq("draft_id", one.id)
        .order("row_index", { ascending: true });

      initialLineItems =
        items?.map((row) => ({
          rowIndex: row.row_index,
          description: row.description,
          quantity: row.quantity !== null && row.quantity !== undefined ? Number(row.quantity) : null,
          unit: row.unit,
          notes: row.notes,
        })) ?? [];

      const { data: atts } = await supabase
        .from("rfq_attachments")
        .select("id, draft_id, original_filename, content_type, byte_size, created_at, storage_path")
        .eq("draft_id", one.id)
        .order("created_at", { ascending: false });

      for (const a of atts ?? []) {
        const { data: signed } = await supabase.storage
          .from("rfq-attachments")
          .createSignedUrl(a.storage_path, RFQ_SIGNED_URL_TTL);
        initialAttachments.push({
          id: a.id,
          draftId: a.draft_id,
          originalFilename: a.original_filename,
          contentType: a.content_type,
          byteSize: a.byte_size,
          signedUrl: signed?.signedUrl ?? null,
          createdAt: a.created_at,
        });
      }
    }
  }

  const allowUpload = !activeDraftId || initialStatus === "draft";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-3 py-5 sm:px-4 sm:py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
        <p className="mt-2">
          <Link
            className="text-sm font-medium text-zinc-800 underline dark:text-zinc-200"
            href="/rfq/opportunities"
            prefetch={true}
          >
            {t("opportunitiesLink")}
          </Link>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_1fr]">
        <RfqMyDraftsList drafts={drafts ?? []} />
        <div className="flex min-w-0 flex-col gap-4">
          {activeDraftId ? (
            <RfqDraftControls draftId={activeDraftId} initialTitle={initialTitle} status={initialStatus} />
          ) : null}
          <RfqUpload
            key={activeDraftId ?? "new"}
            allowUpload={allowUpload}
            draftIdInUrl={paramId}
            initialAttachments={initialAttachments}
            initialDraftId={activeDraftId}
            initialLineItems={initialLineItems}
          />
        </div>
      </div>
    </div>
  );
}
