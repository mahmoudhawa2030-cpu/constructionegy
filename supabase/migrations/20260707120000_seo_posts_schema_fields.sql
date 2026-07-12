-- Persist RankMath-style structured data (FAQ / HowTo) so it renders on the live post page.
ALTER TABLE public.seo_posts
  ADD COLUMN IF NOT EXISTS faq_schema jsonb,
  ADD COLUMN IF NOT EXISTS howto_schema jsonb,
  ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;
