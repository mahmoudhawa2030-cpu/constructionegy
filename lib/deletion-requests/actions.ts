"use server";

import { createClient } from "@/lib/supabase/server";

export type DeletionRequestResult =
  | { success: true }
  | { error: "login_required" | "already_pending" | "db_error" };

export async function submitDeletionRequest(
  reason: string
): Promise<DeletionRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "login_required" };

  const { data: existing } = await supabase
    .from("deletion_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return { error: "already_pending" };

  const { error } = await supabase.from("deletion_requests").insert({
    user_id: user.id,
    email: user.email ?? "",
    reason: reason.trim() || null,
    status: "pending",
  });

  if (error) return { error: "db_error" };
  return { success: true };
}

export async function resolveDeletionRequest(
  id: string,
  status: "resolved" | "rejected"
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("deletion_requests")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id);
  return { success: !error };
}
