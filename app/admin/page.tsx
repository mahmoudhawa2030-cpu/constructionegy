import { AdminDashboard, type DashboardData } from "@/components/admin/admin-dashboard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MONTHS_BACK = 12;
const STATUS_ORDER = ["active", "pending", "sold", "rented", "paused"] as const;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    listingsCount,
    pendingCount,
    profilesCount,
    listingRows,
    categoryRows,
    recentListingRows,
    recentUserRows,
    profileMonthRows,
  ] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("category, status, price, created_at"),
    supabase.from("categories").select("slug, label_ar, label_en"),
    supabase
      .from("listings")
      .select("id, title, category, status, price, view_count, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("profiles")
      .select("id, full_name, user_type, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("profiles").select("created_at"),
  ]);

  const totalListings = listingsCount.count ?? 0;
  const pendingListings = pendingCount.count ?? 0;
  const totalProfiles = profilesCount.count ?? 0;

  const listings = listingRows.data ?? [];
  const categories = categoryRows.data ?? [];
  const catMap = new Map<string, { ar: string; en: string }>();
  for (const c of categories) {
    catMap.set(c.slug, { ar: c.label_ar, en: c.label_en ?? c.label_ar });
  }

  // ── Listings by category (top 10) ──
  const catCounts = new Map<string, number>();
  for (const l of listings) {
    catCounts.set(l.category, (catCounts.get(l.category) ?? 0) + 1);
  }
  const byCategory = [...catCounts.entries()]
    .map(([slug, count]) => {
      const labels = catMap.get(slug);
      return { ar: labels?.ar ?? slug, en: labels?.en ?? slug, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Listings by status ──
  const statusCounts = new Map<string, number>();
  for (const l of listings) {
    statusCounts.set(l.status, (statusCounts.get(l.status) ?? 0) + 1);
  }
  const byStatus = STATUS_ORDER.map((status) => ({ status, count: statusCounts.get(status) ?? 0 }));

  // ── Catalog value (sum of active listing prices) ──
  const totalValue = listings
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (Number(l.price) || 0), 0);

  // ── By month (last 12 months): listings + users ──
  const months: string[] = [];
  const now = new Date();
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  const listingByMonth = new Map<string, number>();
  for (const l of listings) {
    const k = monthKey(new Date(l.created_at));
    listingByMonth.set(k, (listingByMonth.get(k) ?? 0) + 1);
  }
  const userByMonth = new Map<string, number>();
  for (const p of profileMonthRows.data ?? []) {
    const k = monthKey(new Date(p.created_at));
    userByMonth.set(k, (userByMonth.get(k) ?? 0) + 1);
  }
  const byMonth = months.map((m) => ({
    month: m,
    listings: listingByMonth.get(m) ?? 0,
    users: userByMonth.get(m) ?? 0,
  }));

  // ── Recent tables ──
  const recentListings = (recentListingRows.data ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    category: catMap.get(l.category)?.ar ?? l.category,
    status: l.status,
    price: Number(l.price) || 0,
    views: l.view_count ?? 0,
    created: l.created_at,
  }));
  const recentUsers = (recentUserRows.data ?? []).map((p) => ({
    id: p.id,
    name: p.full_name,
    type: p.user_type,
    created: p.created_at,
  }));

  const data: DashboardData = {
    pending: pendingListings,
    totalListings,
    totalUsers: totalProfiles,
    totalValue,
    byCategory,
    byStatus,
    byMonth,
    recentListings,
    recentUsers,
  };

  return <AdminDashboard data={data} />;
}
