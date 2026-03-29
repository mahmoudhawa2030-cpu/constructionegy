import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminRfqBidModerationForm } from "@/components/admin-rfq-bid-moderation-form";
import { AdminRfqDraftModerationForm } from "@/components/admin-rfq-draft-moderation-form";
import { RFQ_SIGNED_URL_TTL } from "@/lib/rfq/constants";
import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const IMG_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function moderationNoteFromMetadata(metadata: Json | null): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>).admin_moderation_note;
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminRfqDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("adminRfq.detail");
  const tList = await getTranslations("adminRfq.list");
  const supabase = await createClient();

  const { data: draft, error } = await supabase
    .from("rfq_drafts")
    .select("id, title, status, user_id, created_at, updated_at, metadata")
    .eq("id", id)
    .maybeSingle();

  if (error || !draft) {
    notFound();
  }

  const { data: buyer } = await supabase.from("profiles").select("full_name, phone_number").eq("id", draft.user_id).maybeSingle();

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
    const { data: signed } = await supabase.storage.from("rfq-attachments").createSignedUrl(a.storage_path, RFQ_SIGNED_URL_TTL);
    attachments.push({
      id: a.id,
      name: a.original_filename,
      url: signed?.signedUrl ?? null,
      byteSize: a.byte_size,
    });
  }

  const { data: bidsRaw } = await supabase
    .from("rfq_bids")
    .select(
      "id, status, total_amount, currency, supplier_notes, created_at, supplier_user_id, profiles!rfq_bids_supplier_user_id_fkey(full_name)",
    )
    .eq("draft_id", draft.id)
    .order("created_at", { ascending: false });

  const bids = bidsRaw ?? [];
  const modNote = moderationNoteFromMetadata(draft.metadata);

  const statusHuman: Record<string, string> = {
    draft: tList("statusLabel.draft"),
    submitted: tList("statusLabel.submitted"),
    open_for_bids: tList("statusLabel.open_for_bids"),
    closed: tList("statusLabel.closed"),
    archived: tList("statusLabel.archived"),
    awarded: tList("statusLabel.awarded"),
  };
  const statusDisplay = statusHuman[draft.status] ?? draft.status;

  const bidStatusLabel = (s: string) =>
    ({
      draft: t("bidForm.statusOption.draft"),
      submitted: t("bidForm.statusOption.submitted"),
      withdrawn: t("bidForm.statusOption.withdrawn"),
      accepted: t("bidForm.statusOption.accepted"),
      rejected: t("bidForm.statusOption.rejected"),
    })[s] ?? s;

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminUi.pageTitle}>{draft.title?.trim() || t("untitled")}</h1>
          <p className={adminUi.pageLead}>
            {t("statusLine", { status: statusDisplay })} · {t("idLabel")}{" "}
            <span className="font-mono" dir="ltr">
              {draft.id}
            </span>
          </p>
        </div>
        <Link className={adminUi.linkBack} href="/admin/rfq">
          {t("backList")}
        </Link>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("buyerSection")}</div>
        <div className={adminUi.widgetBody}>
          <p className="text-sm text-[var(--admin-text)]">
            <Link className="font-semibold text-[var(--admin-brand)] hover:underline" href={`/admin/users/${draft.user_id}/edit`}>
              {buyer?.full_name?.trim() || "—"}
            </Link>
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--admin-text-secondary)]" dir="ltr" title={draft.user_id}>
            {draft.user_id}
          </p>
          {buyer?.phone_number ? (
            <p className="mt-1 text-sm text-[var(--admin-text-secondary)]" dir="ltr">
              {buyer.phone_number}
            </p>
          ) : null}
        </div>
      </div>

      <AdminRfqDraftModerationForm
        currentStatus={draft.status}
        draftId={draft.id}
        moderationNotePreview={modNote}
      />

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("itemsHeading")}</div>
        <div className={adminUi.widgetBodyFlush}>
          {!items?.length ? (
            <p className="px-4 py-3 text-sm text-[var(--admin-text-secondary)]">{t("noItems")}</p>
          ) : (
            <div className={adminUi.tableWrap}>
              <table className={adminUi.table}>
                <thead>
                  <tr className={adminUi.theadRow}>
                    <th className={adminUi.th}>{t("colRow")}</th>
                    <th className={adminUi.th}>{t("colDescription")}</th>
                    <th className={adminUi.th}>{t("colQty")}</th>
                    <th className={adminUi.th}>{t("colUnit")}</th>
                    <th className={adminUi.th}>{t("colNotes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.row_index} className={adminUi.tbodyRow}>
                      <td className={`${adminUi.tdMuted} tabular-nums`}>{row.row_index}</td>
                      <td className={adminUi.td}>{row.description}</td>
                      <td className={`${adminUi.td} tabular-nums`}>{row.quantity ?? "—"}</td>
                      <td className={adminUi.td}>{row.unit ?? "—"}</td>
                      <td className={adminUi.tdMuted}>{row.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("attachmentsHeading")}</div>
        <div className={adminUi.widgetBody}>
          {attachments.length === 0 ? (
            <p className="text-sm text-[var(--admin-text-secondary)]">{t("noAttachments")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {attachments.map((a) => {
                const ext = extOf(a.name);
                const isImg = IMG_EXT.has(ext);
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-2"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-zinc-100 text-[10px] font-bold dark:bg-zinc-800">
                      {a.url && isImg ? (
                        <Image alt="" className="h-full w-full object-cover" height={48} src={a.url} unoptimized width={48} />
                      ) : (
                        ext || "file"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-[var(--admin-text-secondary)]">{a.byteSize} B</p>
                      {a.url ? (
                        <a className="text-xs text-[var(--admin-brand)] underline" href={a.url} rel="noreferrer" target="_blank">
                          {t("openAttachment")}
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("bidsHeading")}</div>
        <div className={adminUi.widgetBodyFlush}>
          {bids.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--admin-text-secondary)]">{t("noBids")}</p>
          ) : (
            <div className={adminUi.tableWrap}>
              <table className={adminUi.table}>
                <thead>
                  <tr className={adminUi.theadRow}>
                    <th className={adminUi.th}>{t("colSupplier")}</th>
                    <th className={adminUi.th}>{t("colBidStatus")}</th>
                    <th className={adminUi.th}>{t("colAmount")}</th>
                    <th className={adminUi.th}>{t("colBidNotes")}</th>
                    <th className={adminUi.th}>{t("colModerate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b) => {
                    const prof = b.profiles as { full_name: string | null } | null;
                    return (
                      <tr key={b.id} className={adminUi.tbodyRow}>
                        <td className={adminUi.td}>
                          <Link
                            className="font-semibold text-[var(--admin-brand)] hover:underline"
                            href={`/admin/users/${b.supplier_user_id}/edit`}
                          >
                            {prof?.full_name?.trim() || "—"}
                          </Link>
                          <p className="mt-0.5 font-mono text-xs text-[var(--admin-text-secondary)]" dir="ltr">
                            {b.supplier_user_id.slice(0, 8)}…
                          </p>
                        </td>
                        <td className={adminUi.td}>{bidStatusLabel(b.status)}</td>
                        <td className={`${adminUi.td} tabular-nums`}>
                          {b.total_amount != null ? `${b.total_amount} ${b.currency}` : "—"}
                        </td>
                        <td className={`${adminUi.tdMuted} max-w-[14rem] truncate`}>{b.supplier_notes ?? "—"}</td>
                        <td className={adminUi.td}>
                          <AdminRfqBidModerationForm bidId={b.id} currentStatus={b.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
