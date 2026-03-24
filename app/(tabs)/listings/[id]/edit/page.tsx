import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ListingForm, type ListingFormInitial } from "@/components/listing-form";
import { getCategoriesForListingForm } from "@/lib/categories/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/listings/${id}/edit`);
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !listing) {
    notFound();
  }

  const categories = await getCategoriesForListingForm([listing.category]);

  const initial: ListingFormInitial = {
    title: listing.title,
    category: listing.category,
    type: listing.type,
    condition: listing.condition,
    price: Number(listing.price),
    price_unit: listing.price_unit,
    description: listing.description ?? "",
    location: listing.location,
    images: listing.images ?? [],
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <Link
          className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          href={`/listings/${id}`}
        >
          ← العودة للإعلان
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">تعديل الإعلان</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          عدّل الحقول ثم احفظ. الصور الجديدة تُضاف إلى الموجودة حتى {10} صور.
        </p>
      </div>
      <ListingForm categories={categories} initial={initial} listingId={id} mode="edit" />
    </div>
  );
}
