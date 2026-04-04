import { z } from "zod";

/** Storage public URLs; avoid z.string().url() strictness that can reject valid Supabase URLs in Zod 4. */
const storagePublicUrl = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(12)
      .refine(
        (s) => {
          try {
            const u = new URL(s);
            return u.protocol === "https:" || u.protocol === "http:";
          } catch {
            return false;
          }
        },
        { message: "invalidUrl" },
      ),
  );

export const feedPostImageUrlsSchema = z.array(storagePublicUrl).max(9);

export const createFeedPostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { message: "bodyRequired" })
    .max(8000, { message: "bodyTooLong" }),
  location: z
    .string()
    .trim()
    .max(120, { message: "locationTooLong" })
    .transform((s) => (s.length === 0 ? null : s)),
});

export type CreateFeedPostInput = z.infer<typeof createFeedPostSchema>;
