-- Allow Arabic (and other Unicode) in seo_posts.slug for Arabic SEO URLs.
-- Previous check only allowed [a-z0-9-], which blocked slugs like ايجار-سقالات.
-- Postgres POSIX regex: avoid \p{L}; allow any non-space path segment with hyphens.

ALTER TABLE public.seo_posts
  DROP CONSTRAINT IF EXISTS seo_posts_slug_format;

ALTER TABLE public.seo_posts
  ADD CONSTRAINT seo_posts_slug_format CHECK (
    char_length(slug) BETWEEN 1 AND 120
    AND slug = btrim(slug)
    AND position(' ' IN slug) = 0
    AND position('/' IN slug) = 0
    AND position('?' IN slug) = 0
    AND position('#' IN slug) = 0
    AND slug !~ '^-'
    AND slug !~ '-$'
    AND slug !~ '--'
  );
