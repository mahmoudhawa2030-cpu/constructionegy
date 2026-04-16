import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RfqBiddersTable, type RfqBidRowForTable } from "@/components/rfq-bidders-table";
import { RfqCreatorForm } from "@/components/rfq-creator-form";
import { RfqMyDraftsList } from "@/components/rfq-my-drafts-list";
import { RfqUpload } from "@/components/rfq-upload";
import { RFQ_SIGNED_URL_TTL } from "@/lib/rfq/constants";
import { listRfqBidsForBuyerDraft } from "@/lib/rfq/bid-service";
import type { RfqAttachmentDto } from "@/lib/rfq/types";
import { createRfqDraft } from "@/lib/rfq/draft-service";
import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ draft?: string; new?: string }>;
};

export default async function RfqPage({ searchParams }: PageProps) {
  const { draft: draftParam, new: newParam } = await searchParams;
  const wantNewDraft =
    newParam === "1" || newParam === "true" || (typeof newParam === "string" && newParam.toLowerCase() === "yes");
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
  const tDraft = await getTranslations("rfqDraft");

  const { data: drafts } = await supabase
    .from("rfq_drafts")
    .select("id, title, status, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(30);

  let activeDraftId: string | null = null;
  let initialTitle: string | null = null;
  let initialDescription: string | null = null;
  let initialLocation: string | null = null;
  let initialClosingDate: string | null = null;
  let initialStatus = "draft";
  let initialAttachments: RfqAttachmentDto[] = [];
  let bidsForTable: RfqBidRowForTable[] = [];

  const paramId =
    typeof draftParam === "string" && UUID_RE.test(draftParam.trim()) ? draftParam.trim() : null;

  if (paramId) {
    const { data: one } = await supabase
      .from("rfq_drafts")
      .select("id, title, description, location, closing_date, status, user_id")
      .eq("id", paramId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (one) {
      activeDraftId = one.id;
      initialTitle = one.title;
      initialDescription = one.description;
      initialLocation = one.location;
      initialClosingDate = one.closing_date;
      initialStatus = one.status;

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

      if (one.status !== "draft") {
        const listed = await listRfqBidsForBuyerDraft(supabase, user.id, one.id);
        if (listed.ok) {
          bidsForTable = listed.bids.map((b) => {
            const row = b as typeof b & {
              profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
            };
            const prof = row.profiles;
            const profileObj = Array.isArray(prof) ? prof[0] : prof;
            return {
              id: row.id,
              supplier_user_id: row.supplier_user_id,
              total_amount: row.total_amount !== null ? Number(row.total_amount) : null,
              currency: row.currency,
              status: row.status,
              supplier_notes: row.supplier_notes,
              created_at: row.created_at,
              profiles: profileObj ? { full_name: profileObj.full_name } : null,
            };
          });
        }
      }
    }
  }

  const firstDraft = drafts?.[0];
  if (!activeDraftId) {
    if (firstDraft) {
      if (!wantNewDraft) {
        redirect(`/rfq?draft=${firstDraft.id}`);
      }
    } else {
      const created = await createRfqDraft(supabase, user.id);
      if (created.ok) {
        redirect(`/rfq?draft=${created.id}`);
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
            <>
              <div className="order-1 w-full min-w-0">
                <RfqCreatorForm
                  draftId={activeDraftId}
                  initialClosingDateIso={initialClosingDate}
                  initialDescription={initialDescription}
                  initialLocation={initialLocation}
                  initialTitle={initialTitle}
                  status={initialStatus}
                />
              </div>
              {initialStatus !== "draft" ? (
                <section
                  aria-labelledby="rfq-bidders-section"
                  className="order-3 w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50" id="rfq-bidders-section">
                    {tDraft("myDrafts.biddersTable")}
                  </h2>
                  <div className="mt-3">
                    <RfqBiddersTable bids={bidsForTable} />
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
          <div className="order-2 w-full min-w-0">
            <RfqUpload
              key={activeDraftId ?? "new"}
              allowUpload={allowUpload}
              draftIdInUrl={paramId}
              initialAttachments={initialAttachments}
              initialDraftId={activeDraftId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
