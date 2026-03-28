import Link from "next/link";
import { redirect } from "next/navigation";

import { ListingForm } from "@/components/listing-form";
import { getActiveCategoriesForSelect } from "@/lib/categories/queries";
import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/listings/new");
  }

  if (!(await canAccessFeature(user.id, "premium_listings"))) {
    redirect("/subscription-required?feature=premium_listings");
  }

  const categories = await getActiveCategoriesForSelect();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <Link
          className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          href="/gallery"
        >
          ← العودة للمعرض
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">إضافة إعلان</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          اختر المحافظة، ثم اسم الإعلان والتفاصيل. يُرسل الإعلان لمراجعة الإدارة قبل الظهور في
          المعرض العام.
        </p>
      </div>
      <ListingForm categories={categories} />
    </div>
  );
}
