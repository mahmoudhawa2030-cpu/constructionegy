-- Rank Math–style social / Open Graph overrides (optional per post).
ALTER TABLE public.seo_posts
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image text;
