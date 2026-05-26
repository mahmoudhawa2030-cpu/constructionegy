"use client";

import { useRef } from "react";

import { deleteListingAsAdmin } from "@/app/admin/actions";

type Props = {
  listingId: string;
};

export function AdminListingDeleteButton({ listingId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        if (!confirm("حذف هذا الإعلان نهائياً؟ لا يمكن التراجع.")) {
          return;
        }
        await deleteListingAsAdmin(formData);
      }}
      className="mt-2"
    >
      <input name="listing_id" type="hidden" value={listingId} />
      <button
        className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
        type="submit"
      >
        حذف
      </button>
    </form>
  );
}
