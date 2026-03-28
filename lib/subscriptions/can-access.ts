import { createClient } from "@/lib/supabase/server";
import type { SubscriptionFeature } from "@/lib/subscriptions/features";

/**
 * Enforcement reads `app_settings.enforce_subscriptions` (`'true'` / `'false'`).
 * Toggle it from **لوحة الإدارة → الاشتراكات** so Postgres RLS and this check stay in sync.
 */
export async function isSubscriptionEnforcementOn(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("subscriptions_enforcement_enabled");
  if (error) {
    // Migration not applied yet — fail open so the site keeps working.
    return false;
  }
  return data === true;
}

/**
 * Returns true if the given user may use a paid feature (same rules as RLS).
 * Call only for the signed-in user (`userId` must match the session user).
 */
export async function canAccessFeature(
  userId: string,
  feature: SubscriptionFeature,
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return false;
  }

  if (!(await isSubscriptionEnforcementOn())) {
    return true;
  }

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
