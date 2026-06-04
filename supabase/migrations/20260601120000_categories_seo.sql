-- SEO fields for category landing pages (/{category}).
-- All nullable; pages fall back to label-based defaults when empty.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS seo_title_ar text,
  ADD COLUMN IF NOT EXISTS seo_title_en text,
  ADD COLUMN IF NOT EXISTS seo_description_ar text,
  ADD COLUMN IF NOT EXISTS seo_description_en text,
  ADD COLUMN IF NOT EXISTS intro_ar text,
  ADD COLUMN IF NOT EXISTS intro_en text;
