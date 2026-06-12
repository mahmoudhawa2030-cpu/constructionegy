"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type TrackingActionState =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function saveTrackingScripts(
  _prev: TrackingActionState | null,
  formData: FormData,
): Promise<TrackingActionState> {
  await requireAdmin();

  const header = String(formData.get("header_scripts") ?? "").trim();
  const footer = String(formData.get("footer_scripts") ?? "").trim();

  const supabase = await createClient();

  const { error } = await supabase.from("app_settings").upsert(
    [
      { key: "tracking_header_scripts", value: header },
      { key: "tracking_footer_scripts", value: footer },
    ],
    { onConflict: "key" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/tracking");
  revalidatePath("/", "layout");
  return { ok: true, message: "saved" };
}
