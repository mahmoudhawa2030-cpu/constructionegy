import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RfqBidAddFilesForm } from "@/components/rfq-bid-add-files-form";
import { RfqOpportunityBidForm } from "@/components/rfq-opportunity-bid-form";
import { RFQ_SIGNED_URL_TTL } from "@/lib/rfq/constants";
import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

const IMG_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ draftId: string }> };

export default async function RfqOpportunityDetailPage({ params }: PageProps) {
  const { draftId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/rfq/opportunities/${draftId}`)}`);
  }

  if (!(await canAccessFeature(user.id, "rfq"))) {
    redirect("/subscription-required?feature=rfq");
  }

  const t = await getTranslations("rfqOpportunity.detail");

  const tOpp = await getTranslations("rfqOpportunity");
  const tBidAtt = await getTranslations("rfqOpportunity.bidAttachments");

  const { data: draft, error } = await supabase
    .from("rfq_drafts")
    .select(
      "id, title, status, user_id, updated_at, profiles!rfq_drafts_user_id_fkey ( id, full_name )",
    )
    .eq("id", draftId)
    .maybeSingle();

  if (error || !draft) {
    notFound();
  }

  if (draft.user_id === user.id) {
    redirect(`/rfq?draft=${draft.id}`);
  }

  if (!["submitted", "open_for_bids"].includes(draft.status)) {
    notFound();
  }

  const { data: items } = await supabase
    .from("rfq_items")
    .select("row_index, description, quantity, unit, notes")
    .eq("draft_id", draft.id)
    .order("row_index", { ascending: true });

  const { data: atts } = await supabase
    .from("rfq_attachments")
    .select("id, original_filename, content_type, byte_size, storage_path")
    .eq("draft_id", draft.id)
    .order("created_at", { ascending: false });

  const attachments: { id: string; name: string; url: string | null; byteSize: number }[] = [];
  for (const a of atts ?? []) {
    const { data: signed } = await supabase.storage
      .from("rfq-attachments")
      .createSignedUrl(a.storage_path, RFQ_SIGNED_URL_TTL);
    attachments.push({
      id: a.id,
      name: a.original_filename,
      url: signed?.signedUrl ?? null,
      byteSize: a.byte_size,
    });
  }

  const { data: myBid } = await supabase
    .from("rfq_bids")
    .select("id, status, total_amount, currency, supplier_notes, created_at")
    .eq("draft_id", draft.id)
    .eq("supplier_user_id", user.id)
    .maybeSingle();

  const bidAttachments: { id: string; name: string; url: string | null; byteSize: number }[] = [];
  if (myBid) {
    const { data: bidAttRows } = await supabase
      .from("rfq_bid_attachments")
      .select("id, original_filename, byte_size, storage_path")
      .eq("bid_id", myBid.id)
      .order("created_at", { ascending: false });
    for (const a of bidAttRows ?? []) {
      const { data: signed } = await supabase.storage
        .from("rfq-attachments")
        .createSignedUrl(a.storage_path, RFQ_SIGNED_URL_TTL);
      bidAttachments.push({
        id: a.id,
        name: a.original_filename,
        url: signed?.signedUrl ?? null,
        byteSize: a.byte_size,
      });
    }
  }

  const profile = draft.profiles as { id: string; full_name: string | null } | null;
  const creatorName = profile?.full_name?.trim() || tOpp("creatorFallbackName");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-3 py-5 sm:px-4 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {draft.title?.trim() || t("untitled")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            <span>{tOpp("postedByLabel")} </span>
            <Link
              className="font-medium text-zinc-800 underline dark:text-zinc-200"
              href={`/profile/${draft.user_id}`}
              prefetch={true}
              aria-label={tOpp("viewCreatorProfileAria", { name: creatorName })}
            >
              {creatorName}
            </Link>
          </p>
        </div>
        <Link
          className="shrink-0 text-sm font-medium text-zinc-800 underline dark:text-zinc-200"
          href="/rfq/opportunities"
          prefetch={true}
        >
          {t("back")}
        </Link>
      </div>

      <section aria-labelledby="opp-items">
        <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50" id="opp-items">
          {t("itemsHeading")}
        </h2>
        {!items?.length ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("noItems")}</p>
        ) : (
          <div className="max-h-80 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[20rem] text-start text-xs">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-2 py-1.5 font-medium">{t("colRow")}</th>
                  <th className="px-2 py-1.5 font-medium">{t("colDescription")}</th>
                  <th className="px-2 py-1.5 font-medium">{t("colQty")}</th>
                  <th className="px-2 py-1.5 font-medium">{t("colUnit")}</th>
                  <th className="px-2 py-1.5 font-medium">{t("colNotes")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.row_index} className="border-t border-zinc-200 dark:border-zinc-700">
                    <td className="px-2 py-1 tabular-nums text-zinc-600 dark:text-zinc-400">{row.row_index}</td>
                    <td className="px-2 py-1 text-zinc-900 dark:text-zinc-100">{row.description}</td>
                    <td className="px-2 py-1 tabular-nums">{row.quantity ?? "—"}</td>
                    <td className="px-2 py-1">{row.unit ?? "—"}</td>
                    <td className="px-2 py-1 text-zinc-600 dark:text-zinc-300">{row.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="opp-attach">
        <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50" id="opp-attach">
          {t("attachmentsHeading")}
        </h2>
        {attachments.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("noAttachments")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {attachments.map((a) => {
              const ext = extOf(a.name);
              const isImg = IMG_EXT.has(ext);
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-[10px] font-bold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {a.url && isImg ? (
                      <Image alt="" className="h-full w-full object-cover" height={56} src={a.url} unoptimized width={56} />
                    ) : (
                      ext || "file"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{a.name}</p>
                    <p className="text-xs text-zinc-500">{a.byteSize} B</p>
                    {a.url ? (
                      <a
                        className="text-xs font-medium text-zinc-700 underline dark:text-zinc-300"
                        href={a.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {t("open")}
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {myBid ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("yourBidHeading")}</h2>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {myBid.status === "draft"
              ? t("bidStateDraft")
              : myBid.status === "submitted"
                ? t("bidStateSubmitted")
                : myBid.status === "withdrawn"
                  ? t("bidStateWithdrawn")
                  : myBid.status === "accepted"
                    ? t("bidStateAccepted")
                    : myBid.status === "rejected"
                      ? t("bidStateRejected")
                      : t("bidStateUnknown")}
            {myBid.total_amount !== null && myBid.total_amount !== undefined
              ? ` · ${myBid.total_amount} ${myBid.currency}`
              : ""}
          </p>
          {myBid.supplier_notes ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{myBid.supplier_notes}</p>
          ) : null}
          <h3 className="mt-4 text-xs font-semibold text-zinc-900 dark:text-zinc-50">{tBidAtt("heading")}</h3>
          {bidAttachments.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tBidAtt("empty")}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2" aria-label={tBidAtt("fileListAria")}>
              {bidAttachments.map((a) => {
                const ext = extOf(a.name);
                const isImg = IMG_EXT.has(ext);
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-600 dark:bg-zinc-950"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-[10px] font-bold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {a.url && isImg ? (
                        <Image
                          alt=""
                          className="h-full w-full object-cover"
                          height={48}
                          src={a.url}
                          unoptimized
                          width={48}
                        />
                      ) : (
                        ext || "file"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{a.name}</p>
                      <p className="text-xs text-zinc-500">{a.byteSize} B</p>
                      {a.url ? (
                        <a
                          className="text-xs font-medium text-zinc-700 underline dark:text-zinc-300"
                          href={a.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {tBidAtt("open")}
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {myBid.status === "draft" ? <RfqBidAddFilesForm bidId={myBid.id} /> : null}
        </div>
      ) : (
        <RfqOpportunityBidForm draftId={draft.id} />
      )}
    </div>
  );
}
