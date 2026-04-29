"use server";

import { createClient } from "@/lib/supabase/server";

export type RecordProfileViewResult =
  | { ok: true; recorded: boolean }
  | { ok: false; error: string };

export async function recordProfileView(
  subjectId: string,
): Promise<RecordProfileViewResult> {
  const id = subjectId.trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    return { ok: false, error: "invalid_id" };
  }

  const supabase = await createClient();
  const { data: recorded, error } = await supabase.rpc("record_profile_view", {
    p_subject_id: id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, recorded: Boolean(recorded) };
}

export type ProfileViewer = {
  viewer_id: string;
  viewed_at: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: string | null;
  business_verification_status: string | null;
  expert_verification_status: string | null;
};

export type GetProfileViewersResult =
  | { ok: true; viewers: ProfileViewer[] }
  | { ok: false; error: string };

export async function getProfileViewers(
  limit = 50,
  offset = 0,
): Promise<GetProfileViewersResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_profile_viewers", {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, viewers: (data ?? []) as ProfileViewer[] };
}
