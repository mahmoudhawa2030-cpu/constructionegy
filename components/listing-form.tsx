"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CategoryOption } from "@/lib/categories/queries";
import { createListing, updateListing } from "@/lib/listings/actions";
import { labelForCategorySlug } from "@/lib/listings/categories";
import { EGYPT_GOVERNORATES_AR, isEgyptGovernorateAr } from "@/lib/listings/egypt-governorates";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024;

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export type ListingFormInitial = {
  title: string;
  category: string;
  type: ListingRow["type"];
  condition: ListingRow["condition"];
  price: number;
  price_unit: string;
  description: string;
  location: string | null;
  images: string[];
};

type ListingFormProps = {
  mode?: "create" | "edit";
  listingId?: string;
  initial?: ListingFormInitial;
  categories: CategoryOption[];
};

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "image";
}

export function ListingForm({ mode = "create", listingId, initial, categories }: ListingFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit" && Boolean(listingId && initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageList, setImageList] = useState<string[]>(() => initial?.images ?? []);

  const knownSlugs = new Set(categories.map((c) => c.slug));
  const legacyCategory =
    initial?.category && !knownSlugs.has(initial.category) ? initial.category : null;
  const legacyLocation =
    initial?.location && !isEgyptGovernorateAr(initial.location) ? initial.location : null;

  async function uploadFilesToStorage(files: File[], userId: string): Promise<string[]> {
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of files) {
      const path = `${userId}/${crypto.randomUUID()}/${safeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from("listing-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });
      if (upErr) {
        throw new Error(upErr.message);
      }
      const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);
      urls.push(pub.publicUrl);
    }
    return urls;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const location = String(fd.get("location") ?? "").trim();
    const title = String(fd.get("title") ?? "").trim();
    const category = String(fd.get("category") ?? "").trim();
    const type = String(fd.get("type") ?? "sell");
    const condition = String(fd.get("condition") ?? "used");
    const price = Number(fd.get("price"));
    const price_unit = String(fd.get("price_unit") ?? "EGP").trim() || "EGP";
    const description = String(fd.get("description") ?? "");

    const fileInput = form.querySelector<HTMLInputElement>('input[name="images"]');
    const files = fileInput?.files ? Array.from(fileInput.files) : [];

    if (files.length > MAX_FILES) {
      setLoading(false);
      setError(`يمكن رفع ${MAX_FILES} صور كحد أقصى.`);
      return;
    }

    for (const f of files) {
      if (f.size > MAX_BYTES) {
        setLoading(false);
        setError("كل صورة يجب أن تكون 5 ميجابايت أو أقل.");
        return;
      }
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      router.push(isEdit ? `/login?next=/listings/${listingId}/edit` : "/login?next=/listings/new");
      return;
    }

    let newUrls: string[] = [];
    try {
      if (files.length > 0) {
        newUrls = await uploadFilesToStorage(files, user.id);
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "فشل رفع الصور");
      return;
    }

    const mergedImages = isEdit
      ? [...imageList, ...newUrls].slice(0, MAX_FILES)
      : newUrls;

    if (isEdit && listingId) {
      const result = await updateListing(listingId, {
        title,
        category,
        type,
        condition,
        price,
        price_unit,
        description,
        location,
        images: mergedImages,
      });
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/listings/${listingId}`);
      router.refresh();
      return;
    }

    const result = await createListing({
      title,
      category,
      type,
      condition,
      price,
      price_unit,
      description,
      location,
      images: mergedImages,
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/listings/${result.id}`);
    router.refresh();
  }

  function removeImage(url: string) {
    setImageList((prev) => prev.filter((u) => u !== url));
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">العنوان</span>
        <select
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          defaultValue={
            initial?.location && isEgyptGovernorateAr(initial.location)
              ? initial.location
              : legacyLocation
                ? legacyLocation
                : ""
          }
          key={isEdit ? `${listingId}-loc` : "loc"}
          name="location"
          required
        >
          <option disabled value="">
            — اختر المحافظة —
          </option>
          {legacyLocation ? (
            <option value={legacyLocation}>{legacyLocation} (قديم)</option>
          ) : null}
          {EGYPT_GOVERNORATES_AR.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">اسم الإعلان</span>
        <input
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          defaultValue={initial?.title}
          key={isEdit ? `${listingId}-title` : "title"}
          name="title"
          required
          minLength={3}
          maxLength={200}
          type="text"
          placeholder="مثال: سقالات حديد 10 متر"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">التصنيف</span>
        {categories.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            لا توجد تصنيفات مفعّلة. يجب على الإدارة إضافة تصنيفات من لوحة الإدارة.
          </p>
        ) : (
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            defaultValue={
              initial?.category && knownSlugs.has(initial.category)
                ? initial.category
                : legacyCategory
                  ? legacyCategory
                  : categories[0]?.slug ?? ""
            }
            key={isEdit ? `${listingId}-cat` : "cat"}
            name="category"
            required
          >
            <option disabled value="">
              — اختر التصنيف —
            </option>
            {legacyCategory ? (
              <option value={legacyCategory}>
                {labelForCategorySlug(legacyCategory)} (قديم / غير في القائمة)
              </option>
            ) : null}
            {categories.map(({ slug, label_ar }) => (
              <option key={slug} value={slug}>
                {label_ar}
              </option>
            ))}
          </select>
        )}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">النوع</span>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            defaultValue={initial?.type ?? "sell"}
            key={isEdit ? `${listingId}-type` : "type"}
            name="type"
          >
            <option value="sell">بيع</option>
            <option value="rent">إيجار</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">الحالة</span>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            defaultValue={initial?.condition ?? "used"}
            key={isEdit ? `${listingId}-cond` : "cond"}
            name="condition"
          >
            <option value="new">جديد</option>
            <option value="used">مستعمل</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">السعر</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            min="0"
            defaultValue={initial?.price}
            key={isEdit ? `${listingId}-price` : "price"}
            name="price"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">العملة</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            defaultValue={initial?.price_unit ?? "EGP"}
            key={isEdit ? `${listingId}-pu` : "pu"}
            name="price_unit"
            maxLength={32}
            type="text"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">الوصف</span>
        <textarea
          className="min-h-[120px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          defaultValue={initial?.description ?? ""}
          key={isEdit ? `${listingId}-desc` : "desc"}
          maxLength={8000}
          name="description"
          rows={5}
        />
      </label>

      {isEdit && imageList.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">الصور الحالية</span>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {imageList.map((url) => (
              <li
                key={url}
                className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <Image alt="" className="object-cover" fill src={url} unoptimized />
                <button
                  className="absolute end-1 top-1 rounded bg-zinc-900/80 px-1.5 py-0.5 text-xs text-white hover:bg-zinc-900"
                  type="button"
                  onClick={() => removeImage(url)}
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500">
            أضف صوراً جديدة من الأسفل. الحد أقصى {MAX_FILES} صوراً إجمالاً.
          </p>
        </div>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">
          {isEdit ? "إضافة صور (اختياري)" : `صور (اختياري، حتى ${MAX_FILES})`}
        </span>
        <input
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="text-sm text-zinc-600 file:me-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 dark:text-zinc-400 dark:file:bg-zinc-800"
          multiple
          name="images"
          type="file"
        />
        <span className="text-xs text-zinc-500">JPEG / PNG / WebP / GIF، حتى 5 ميجابايت لكل صورة.</span>
      </label>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        disabled={loading || (!isEdit && categories.length === 0)}
        type="submit"
      >
        {loading ? (isEdit ? "جاري الحفظ…" : "جاري النشر…") : isEdit ? "حفظ التعديلات" : "نشر الإعلان"}
      </button>
    </form>
  );
}
