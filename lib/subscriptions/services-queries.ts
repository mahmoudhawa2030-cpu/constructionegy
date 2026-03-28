import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type SubscriptionServiceRow = Database["public"]["Tables"]["subscription_services"]["Row"];

export async function getSubscriptionServicesOrdered(): Promise<SubscriptionServiceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_services")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }
  return data ?? [];
}
