import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { user: null as null, profile: null as null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, is_admin, user_type, phone_number, whatsapp_number, location, avatar_url",
    )
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await getCurrentProfile();
  if (!user) {
    redirect("/login");
  }
  if (!profile?.is_admin) {
    redirect("/");
  }
  return { user, profile };
}
