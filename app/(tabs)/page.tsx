import { GuestConfigurableHome } from "@/components/guest-configurable-home";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-0 flex-1 flex-col font-sans">
      <GuestConfigurableHome isSignedIn={Boolean(user)} showDesktopFallback={true} />
    </div>
  );
}
