"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import type {
  TickerDataSource,
  TickerPageScope,
  TickerPlatform,
} from "@/lib/news-ticker/types";
import { createClient } from "@/lib/supabase/server";

export type TickerActionState =
  | { ok: true; message: string; id?: string }
  | { ok: false; message: string };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function int(fd: FormData, key: string, fallback: number): number {
  const n = Number(str(fd, key));
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function parsePlatform(v: string): TickerPlatform {
  if (v === "web" || v === "mobile" || v === "both") return v;
  return "both";
}

function parseScope(v: string): TickerPageScope {
  if (["all", "home", "listings", "blog", "rfq", "custom"].includes(v)) return v as TickerPageScope;
  return "all";
}

function parseSource(v: string): TickerDataSource {
  if (["custom", "seo_posts", "listings", "rfq"].includes(v)) return v as TickerDataSource;
  return "custom";
}

export async function createNewsTicker(
  _prev: TickerActionState | null,
  formData: FormData,
): Promise<TickerActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const name = str(formData, "name") || "News ticker";
  const row = {
    name,
    enabled: bool(formData, "enabled"),
    platform: parsePlatform(str(formData, "platform")),
    page_scope: parseScope(str(formData, "page_scope")),
    page_path: str(formData, "page_path"),
    data_source: parseSource(str(formData, "data_source")),
    max_items: Math.min(50, Math.max(1, int(formData, "max_items", 10))),
    speed_seconds: Math.min(120, Math.max(8, int(formData, "speed_seconds", 28))),
    label_ar: str(formData, "label_ar") || "عاجل",
    label_en: str(formData, "label_en") || "News",
    bg_color: str(formData, "bg_color") || "#0f172a",
    text_color: str(formData, "text_color") || "#f8fafc",
    accent_color: str(formData, "accent_color") || "#ef4444",
    sort_order: int(formData, "sort_order", 0),
  };

  const { data, error } = await (supabase as any).from("news_tickers").insert(row).select("id").single();
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/news-ticker");
  revalidatePath("/", "layout");
  return { ok: true, message: "created", id: data.id as string };
}

export async function updateNewsTicker(
  _prev: TickerActionState | null,
  formData: FormData,
): Promise<TickerActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = str(formData, "id");
  if (!id) return { ok: false, message: "missing_id" };

  const row = {
    name: str(formData, "name") || "News ticker",
    enabled: bool(formData, "enabled"),
    platform: parsePlatform(str(formData, "platform")),
    page_scope: parseScope(str(formData, "page_scope")),
    page_path: str(formData, "page_path"),
    data_source: parseSource(str(formData, "data_source")),
    max_items: Math.min(50, Math.max(1, int(formData, "max_items", 10))),
    speed_seconds: Math.min(120, Math.max(8, int(formData, "speed_seconds", 28))),
    label_ar: str(formData, "label_ar") || "عاجل",
    label_en: str(formData, "label_en") || "News",
    bg_color: str(formData, "bg_color") || "#0f172a",
    text_color: str(formData, "text_color") || "#f8fafc",
    accent_color: str(formData, "accent_color") || "#ef4444",
    sort_order: int(formData, "sort_order", 0),
  };

  const { error } = await (supabase as any).from("news_tickers").update(row).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/news-ticker");
  revalidatePath(`/admin/news-ticker/${id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "saved", id };
}

export async function deleteNewsTicker(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const id = str(formData, "id");
  if (!id) return;
  await (supabase as any).from("news_tickers").delete().eq("id", id);
  revalidatePath("/admin/news-ticker");
  revalidatePath("/", "layout");
}

export async function toggleNewsTicker(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const id = str(formData, "id");
  const enabled = bool(formData, "enabled");
  if (!id) return;
  await (supabase as any).from("news_tickers").update({ enabled }).eq("id", id);
  revalidatePath("/admin/news-ticker");
  revalidatePath("/", "layout");
}

export async function saveTickerItems(
  _prev: TickerActionState | null,
  formData: FormData,
): Promise<TickerActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const tickerId = str(formData, "ticker_id");
  if (!tickerId) return { ok: false, message: "missing_id" };

  let raw = str(formData, "items_json");
  let parsed: Array<{
    id?: string;
    textAr?: string;
    textEn?: string;
    href?: string;
    enabled?: boolean;
    sortOrder?: number;
  }> = [];
  try {
    parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) throw new Error("invalid");
  } catch {
    return { ok: false, message: "invalid_items" };
  }

  // Replace strategy: delete all then insert (admin-only, small lists)
  const { error: delErr } = await (supabase as any)
    .from("news_ticker_items")
    .delete()
    .eq("ticker_id", tickerId);
  if (delErr) return { ok: false, message: delErr.message };

  const rows = parsed
    .map((it, i) => ({
      ticker_id: tickerId,
      text_ar: (it.textAr ?? "").trim(),
      text_en: (it.textEn ?? "").trim(),
      href: (it.href ?? "").trim(),
      enabled: it.enabled !== false,
      sort_order: typeof it.sortOrder === "number" ? it.sortOrder : i,
    }))
    .filter((r) => r.text_ar || r.text_en);

  if (rows.length) {
    const { error: insErr } = await (supabase as any).from("news_ticker_items").insert(rows);
    if (insErr) return { ok: false, message: insErr.message };
  }

  revalidatePath(`/admin/news-ticker/${tickerId}`);
  revalidatePath("/admin/news-ticker");
  revalidatePath("/", "layout");
  return { ok: true, message: "items_saved", id: tickerId };
}
