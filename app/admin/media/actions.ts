"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type MediaActionState = { ok: true; message: string } | { ok: false; message: string };

export async function deleteMediaFileAction(
  _prev: MediaActionState | null,
  formData: FormData,
): Promise<MediaActionState> {
  await requireAdmin();

  const bucket = String(formData.get("bucket") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();

  if (!bucket || !path) {
    return { ok: false, message: "Missing bucket or path." };
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/media");
  return { ok: true, message: "File deleted." };
}
