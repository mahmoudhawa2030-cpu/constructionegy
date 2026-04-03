import { z } from "zod";

export const createFeedPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "titleRequired" })
    .max(200, { message: "titleTooLong" }),
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
