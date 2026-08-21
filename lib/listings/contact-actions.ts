"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type RevealSellerPhoneResult =
  | { ok: true; phone: string | null }
  | { ok: false; reason: "not_found" | "own_listing" | "error"; message?: string };

/**
 * Reveal seller phone for a public listing.
 * Available to visitors (no login). Uses service role so phone is readable
 * even when profiles RLS blocks anon SELECT of phone_number.
 */
export async function revealSellerPhoneForListing(
  listingId: string,
): Promise<RevealSellerPhoneResult> {
  const id = listingId?.trim();
  if (!id) {
    return { ok: false, reason: "not_found" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createServiceRoleClient();
    const db = admin ?? supabase;

    // Prefer the user-scoped client first so public listing RLS still applies for guests.
    // Fall back to service role only for the profile phone lookup if needed.
    let listing:
      | { id: string; user_id: string; status: string | null }
      | null = null;

    const listingRes = await supabase
      .from("listings")
      .select("id, user_id, status")
      .eq("id", id)
      .maybeSingle();

    if (listingRes.error) {
      // If anon cannot read listings for some reason, try service role then re-check status.
      if (admin) {
        const adminListing = await admin
          .from("listings")
          .select("id, user_id, status")
          .eq("id", id)
          .maybeSingle();
        if (adminListing.error) {
          return { ok: false, reason: "error", message: adminListing.error.message };
        }
        listing = adminListing.data;
      } else {
        return { ok: false, reason: "error", message: listingRes.error.message };
      }
    } else {
      listing = listingRes.data;
    }

    if (!listing) {
      return { ok: false, reason: "not_found" };
    }

    // Block clearly non-public statuses when we had to bypass RLS.
    const blocked = new Set(["draft", "deleted", "rejected", "archived", "sold", "expired", "hidden"]);
    if (listing.status && blocked.has(String(listing.status)) && (!user || listing.user_id !== user.id)) {
      return { ok: false, reason: "not_found" };
    }

    if (user && listing.user_id === user.id) {
      return { ok: false, reason: "own_listing" };
    }

    // Phone is often not readable by anon via RLS — use service role when available.
    const profileClient = admin ?? db;
    const { data: profile, error: profileErr } = await profileClient
      .from("profiles")
      .select("phone_number")
      .eq("id", listing.user_id)
      .maybeSingle();

    if (profileErr) {
      return { ok: false, reason: "error", message: profileErr.message };
    }

    return { ok: true, phone: profile?.phone_number ?? null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "error", message };
  }
}
