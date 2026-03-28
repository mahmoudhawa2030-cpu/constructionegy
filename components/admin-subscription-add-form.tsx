"use client";

import { useActionState } from "react";
import { SUBSCRIPTION_FEATURES, FEATURE_LABELS } from "@/lib/subscriptions/features";
import { createSubscriptionFromForm, type SubscriptionActionState } from "@/app/admin/subscriptions/actions";
import { adminUi } from "@/lib/admin-ui";

type Props = { userId: string };

export function AdminSubscriptionAddForm({ userId }: Props) {
  const [state, action, pending] = useActionState<SubscriptionActionState | null, FormData>(
    createSubscriptionFromForm,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="user_id" value={userId} />

      <div className="flex flex-col gap-1">
        <label className={adminUi.label} htmlFor="sub-feature">
          الميزة
        </label>
        <select className={adminUi.select} id="sub-feature" name="feature" required>
          {SUBSCRIPTION_FEATURES.map((f) => (
            <option key={f} value={f}>
              {FEATURE_LABELS[f].ar}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={adminUi.label} htmlFor="sub-valid-until">
          صالح حتى (اتركه فارغاً = لا ينتهي)
        </label>
        <input
          className={adminUi.input}
          id="sub-valid-until"
          name="valid_until"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={adminUi.label} htmlFor="sub-notes">
          ملاحظات (اختياري)
        </label>
        <input
          className={adminUi.input}
          id="sub-notes"
          name="notes"
          type="text"
          maxLength={500}
          placeholder="مثال: دفع بالتحويل، نسخة تجريبية…"
        />
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}

      <div>
        <button className={adminUi.btnPrimary} disabled={pending} type="submit">
          {pending ? "جاري الإضافة…" : "إضافة اشتراك"}
        </button>
      </div>
    </form>
  );
}
