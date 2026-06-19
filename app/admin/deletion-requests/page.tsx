import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";
import { resolveDeletionRequest } from "@/lib/deletion-requests/actions";

export default async function DeletionRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("deletion_requests")
    .select("id, email, reason, status, created_at, resolved_at")
    .order("created_at", { ascending: false });

  const rows = requests ?? [];
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>طلبات حذف الحساب</h1>
        <p className={adminUi.pageLead}>
          المستخدمون الذين طلبوا حذف حساباتهم وبياناتهم. الطلبات المعلّقة:{" "}
          <strong>{pending}</strong>
        </p>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>قائمة الطلبات</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
            <table className={adminUi.table}>
              <thead>
                <tr className={adminUi.theadRow}>
                  <th className={adminUi.th}>البريد الإلكتروني</th>
                  <th className={adminUi.th}>السبب</th>
                  <th className={adminUi.th}>الحالة</th>
                  <th className={adminUi.th}>تاريخ الطلب</th>
                  <th className={adminUi.th}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-[var(--admin-text-secondary)]">
                      لا توجد طلبات بعد.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className={adminUi.tbodyRow}>
                      <td className={adminUi.td}>{r.email}</td>
                      <td className={`${adminUi.td} max-w-xs truncate`}>
                        {r.reason ?? <span className={adminUi.tdMuted}>—</span>}
                      </td>
                      <td className={adminUi.td}>
                        <span
                          className={
                            r.status === "pending"
                              ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                              : r.status === "resolved"
                              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                              : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600"
                          }
                        >
                          {r.status === "pending" ? "معلّق" : r.status === "resolved" ? "تم التنفيذ" : "مرفوض"}
                        </span>
                      </td>
                      <td className={`${adminUi.td} ${adminUi.tdMuted}`}>
                        {new Date(r.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className={adminUi.td}>
                        {r.status === "pending" ? (
                          <div className="flex gap-2">
                            <form
                              action={async () => {
                                "use server";
                                await resolveDeletionRequest(r.id, "resolved");
                              }}
                            >
                              <button type="submit" className={adminUi.btnDanger}>
                                تنفيذ الحذف
                              </button>
                            </form>
                            <form
                              action={async () => {
                                "use server";
                                await resolveDeletionRequest(r.id, "rejected");
                              }}
                            >
                              <button type="submit" className={adminUi.btnSecondary}>
                                رفض
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className={adminUi.tdMuted}>
                            {r.resolved_at
                              ? new Date(r.resolved_at).toLocaleDateString("ar-EG")
                              : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
