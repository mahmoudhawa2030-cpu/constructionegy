import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s.length > 0 ? s : null));

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(120),
  user_type: z.enum(["contractor", "supplier"]),
  phone_number: optionalText(32),
  whatsapp_number: optionalText(32),
  location: optionalText(200),
  avatar_url: z
    .string()
    .trim()
    .max(2000)
    .transform((s) => (s.length > 0 ? s : null))
    .refine((v) => v === null || /^https?:\/\/.+/i.test(v), {
      message: "أدخل رابط صورة صالحاً (يبدأ بـ http)",
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
