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
export async function isBusinessVerified(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("business_verification_status")
    .eq("id", userId)
    .maybeSingle();
  return data?.business_verification_status === "verified";
}

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

  if (feature === "rfq" && !(await isBusinessVerified(userId))) {
    return false;
  }

  if (!(await isSubscriptionEnforcementOn())) {
    return true;
  }

  const { data: svc, error: svcErr } = await supabase
    .from("subscription_services")
    .select("requires_subscription")
    .eq("feature_key", feature)
    .maybeSingle();

  if (!svcErr && svc && !svc.requires_subscription) {
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

/**
 * When enforcement is off, any active category is allowed.
 * When on, free categories (`requires_subscription = false`) are allowed for everyone;
 * paid categories require `premium_listings` or `all` (same as RLS on listings insert/update).
 */
export async function canPostListingInCategory(userId: string, categorySlug: string): Promise<boolean> {
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

  const { data: cat } = await supabase
    .from("categories")
    .select("requires_subscription")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!cat) {
    return false;
  }
  if (!cat.requires_subscription) {
    return true;
  }

  return canAccessFeature(userId, "premium_listings");
}
