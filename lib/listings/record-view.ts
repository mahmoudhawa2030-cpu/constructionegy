"use server";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

const COOKIE_PREFIX = "lv_";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24; /* 24h: one increment per listing per browser day */

export type RecordListingViewResult = { ok: true; recorded: boolean } | { ok: false; error: string };

export async function recordListingView(listingId: string): Promise<RecordListingViewResult> {
  const id = listingId.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return { ok: false, error: "معرّف غير صالح" };
  }

  const jar = await cookies();
  const cookieName = `${COOKIE_PREFIX}${id}`;
  if (jar.get(cookieName)?.value === "1") {
    return { ok: true, recorded: false };
  }

  const supabase = await createClient();
  const { data: didIncrement, error } = await supabase.rpc("increment_listing_view", {
    p_listing_id: id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (didIncrement) {
    jar.set(cookieName, "1", {
      path: "/",
      maxAge: COOKIE_MAX_AGE_SEC,
      sameSite: "lax",
      httpOnly: true,
    });
  }

  return { ok: true, recorded: Boolean(didIncrement) };
}
