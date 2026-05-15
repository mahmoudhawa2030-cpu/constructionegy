import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { WebHero } from "@/components/web/web-hero";
import { WebCategories } from "@/components/web/web-categories";
import { WebFeaturedListings } from "@/components/web/web-featured-listings";
import { WebSuppliers } from "@/components/web/web-suppliers";
import { WebRfqSection } from "@/components/web/web-rfq-section";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WebHomePage() {
  const supabase = await createClient();
  const t = await getTranslations("home");

  // Fetch data for web homepage
  const [{ data: categories }, { data: featuredListings }, { data: suppliers }] = await Promise.all([
    supabase
      .from("categories")
      .select("slug, label_ar, label_en, icon")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("listings")
      .select("id, title, price, price_unit, images, location, status, profiles(full_name)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, business_verification_status")
      .eq("business_verification_status", "verified")
      .limit(6),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <WebHero />

      {/* Categories Grid */}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-[var(--bina-text)]">
          {t("browseCategories")}
        </h2>
        <WebCategories categories={categories ?? []} />
      </section>

      {/* Featured Listings */}
      <section className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[var(--bina-text)]">
            {t("featuredListings")}
          </h2>
          <a href="/gallery" className="text-sm font-medium text-[var(--bina-primary)] hover:underline">
            {t("viewAll")} →
          </a>
        </div>
        <WebFeaturedListings listings={featuredListings ?? []} />
      </section>

      {/* Verified Suppliers */}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-[var(--bina-text)]">
          {t("verifiedSuppliers")}
        </h2>
        <WebSuppliers suppliers={suppliers ?? []} />
      </section>

      {/* RFQ Section */}
      <section className="mt-12 mb-8">
        <WebRfqSection />
      </section>
    </div>
  );
}
