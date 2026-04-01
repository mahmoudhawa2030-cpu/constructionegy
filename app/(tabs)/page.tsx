import { redirect } from "next/navigation";

import { GuestConfigurableHome } from "@/components/guest-configurable-home";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/users/myads");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col font-sans">
      <GuestConfigurableHome showDesktopFallback={true} />
    </div>
  );
}
