"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type {
  HomepageContent,
  MobileHomepageConfig,
  SectionConfig,
} from "./types";
import { DEFAULT_CONTENT, DEFAULT_SECTIONS } from "./types";

const CONFIG_KEY = "default";

export async function getMobileHomepageConfig(): Promise<MobileHomepageConfig | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("mobile_homepage_config")
    .select("*")
    .eq("key", CONFIG_KEY)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    key: data.key,
    sections: data.sections as SectionConfig[],
    content: data.content as HomepageContent,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function saveMobileHomepageSections(
  sections: SectionConfig[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return { success: false, error: "Not authorized" };
  }

  // Upsert config
  const { error } = await (supabase as any)
    .from("mobile_homepage_config")
    .upsert(
      {
        key: CONFIG_KEY,
        sections,
      },
      { onConflict: "key" }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/(mobile)");
  return { success: true };
}

export async function saveMobileHomepageContent(
  content: HomepageContent
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return { success: false, error: "Not authorized" };
  }

  // Get existing config or create new
  const { data: existing } = await (supabase as any)
    .from("mobile_homepage_config")
    .select("id, sections")
    .eq("key", CONFIG_KEY)
    .maybeSingle();

  if (existing) {
    const { error } = await (supabase as any)
      .from("mobile_homepage_config")
      .update({ content })
      .eq("id", existing.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await (supabase as any).from("mobile_homepage_config").insert({
      key: CONFIG_KEY,
      sections: DEFAULT_SECTIONS,
      content,
    });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/");
  revalidatePath("/(mobile)");
  return { success: true };
}

export async function saveMobileHomepageConfig(
  sections: SectionConfig[],
  content: HomepageContent,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return { success: false, error: "Not authorized" };
  }

  const ordered = sections.map((s, i) => ({ ...s, order: i + 1 }));

  const { error } = await (supabase as any)
    .from("mobile_homepage_config")
    .upsert(
      {
        key: CONFIG_KEY,
        sections: ordered,
        content,
      },
      { onConflict: "key" },
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/(mobile)");
  revalidatePath("/admin/homepage/mobile");
  return { success: true };
}

export async function getMergedHomepageConfig(): Promise<{
  sections: SectionConfig[];
  content: HomepageContent;
}> {
  const config = await getMobileHomepageConfig();

  return {
    sections: config?.sections ?? DEFAULT_SECTIONS,
    content: config?.content ?? DEFAULT_CONTENT,
  };
}
