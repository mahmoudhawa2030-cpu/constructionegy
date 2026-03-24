import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export async function getAllCategoriesForAdmin(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[categories]", error.message);
    return [];
  }
  return (data ?? []) as CategoryRow[];
}
