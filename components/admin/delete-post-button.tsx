"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deletePost } from "@/app/admin/blog/actions";
import { adminUi } from "@/lib/admin-ui";

export function DeletePostButton({ id }: { id: string }) {
  const t = useTranslations("adminBlog");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className={adminUi.btnDanger}
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(t("confirmDelete"))) return;
        setBusy(true);
        await deletePost(id);
        setBusy(false);
        router.refresh();
      }}
      type="button"
    >
      {t("delete")}
    </button>
  );
}
