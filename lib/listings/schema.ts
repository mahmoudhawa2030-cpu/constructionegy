import { z } from "zod";

import { EGYPT_GOVERNORATES_AR } from "@/lib/listings/egypt-governorates";

const categoryField = z
  .string()
  .trim()
  .min(1, "اختر تصنيفاً")
  .max(120)
  .regex(/^[a-z][a-z0-9_]*$/, "تنسيق التصنيف غير صالح");

export const createListingSchema = z.object({
  title: z.string().trim().min(3, "اسم الإعلان قصير جداً").max(200),
  category: categoryField,
  type: z.enum(["rent", "sell"]),
  condition: z.enum(["new", "used"]),
  price: z.coerce.number().positive("السعر يجب أن يكون أكبر من صفر").max(999_999_999),
  price_unit: z.string().trim().min(1).max(32).default("EGP"),
  description: z.string().max(8000).default(""),
  location: z.enum(EGYPT_GOVERNORATES_AR, { message: "اختر المحافظة" }),
  images: z.array(z.string().url()).max(10).optional().default([]),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

/** Allows legacy location strings when updating older rows. */
export const updateListingSchema = createListingSchema.extend({
  location: z.union([
    z.enum(EGYPT_GOVERNORATES_AR),
    z.string().trim().min(1).max(120),
  ]),
});
