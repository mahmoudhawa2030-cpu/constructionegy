-- Desktop home: optional English label + icon key per category (app whitelist).
-- When homepage_desktop_icon_key is set and the category is active, a card appears on large-screen home.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS label_en text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS homepage_desktop_icon_key text;

COMMENT ON COLUMN public.categories.label_en IS 'Optional English name; desktop home uses it when locale is en (falls back to formatted slug).';
COMMENT ON COLUMN public.categories.homepage_desktop_icon_key IS 'Named icon from app whitelist; when set with is_active, category is shown as a card on desktop home.';

ALTER TABLE public.categories
  ADD CONSTRAINT categories_label_en_len CHECK (label_en IS NULL OR char_length(trim(label_en)) <= 200);

-- Default desktop home cards for seeded categories (admin can change).
UPDATE public.categories SET homepage_desktop_icon_key = 'fence', label_en = 'Scaffolding' WHERE slug = 'scaffolding';
UPDATE public.categories SET homepage_desktop_icon_key = 'blocks', label_en = 'Formwork' WHERE slug = 'formwork';
UPDATE public.categories SET homepage_desktop_icon_key = 'wrench', label_en = 'Tools' WHERE slug = 'tools';
UPDATE public.categories SET homepage_desktop_icon_key = 'factory', label_en = 'Heavy equipment' WHERE slug = 'heavy_equipment';
UPDATE public.categories SET homepage_desktop_icon_key = 'truck', label_en = 'Vehicles' WHERE slug = 'vehicles';
UPDATE public.categories SET homepage_desktop_icon_key = 'hard_hat', label_en = 'Safety' WHERE slug = 'safety';
UPDATE public.categories SET homepage_desktop_icon_key = 'package', label_en = 'Other' WHERE slug = 'other';
