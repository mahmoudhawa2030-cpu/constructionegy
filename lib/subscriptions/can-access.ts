import { createClient } from "@/lib/supabase/server";
import type { SubscriptionFeature } from "@/lib/subscriptions/features";

/**
 * Returns true if the given authenticated user may access a feature.
 *
 * PHASE 1 (now): ENFORCE_SUBSCRIPTIONS is unset / "false" → always returns true.
 * PHASE 2 (when you go paid): set env ENFORCE_SUBSCRIPTIONS=true.
 *   Access is granted when the user has a matching subscriptions row
 *   with feature = <requested> OR feature = "all", and valid_until is null or in the future.
 */
export async function canAccessFeature(
  userId: string,
  feature: SubscriptionFeature,
): Promise<boolean> {
  if (process.env.ENFORCE_SUBSCRIPTIONS !== "true") {
    return true; // Phase 1: everything free for all registered users
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("feature", [feature, "all"])
    .or(`valid_until.is.null,valid_until.gt.${now}`)
    .limit(1)
    .maybeSingle();

  return data !== null;
}
