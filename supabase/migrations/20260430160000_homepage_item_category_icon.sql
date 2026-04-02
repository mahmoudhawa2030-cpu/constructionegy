-- Homepage cards: optional link to marketplace category + structured icon key (app maps to Lucide).

ALTER TABLE public.homepage_section_items
  ADD COLUMN IF NOT EXISTS category_slug text REFERENCES public.categories (slug) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.homepage_section_items
  ADD COLUMN IF NOT EXISTS icon_key text;

COMMENT ON COLUMN public.homepage_section_items.category_slug IS 'When set, public home links to /gallery?category=<slug> (href may mirror this in admin save).';
COMMENT ON COLUMN public.homepage_section_items.icon_key IS 'Named icon from app whitelist (e.g. building); falls back to icon_emoji.';

CREATE INDEX IF NOT EXISTS homepage_section_items_category_slug_idx
  ON public.homepage_section_items (category_slug)
  WHERE category_slug IS NOT NULL;
