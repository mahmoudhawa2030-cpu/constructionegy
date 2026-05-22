-- Web-home CMS extensions: extra columns on homepage_section_items + seed 6 web sections
-- Safe to run multiple times.

-- 1) Extend items table with web-specific fields
ALTER TABLE public.homepage_section_items
  ADD COLUMN IF NOT EXISTS listing_id  uuid REFERENCES public.listings (id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.profiles (id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS kicker_ar   text,
  ADD COLUMN IF NOT EXISTS kicker_en   text,
  ADD COLUMN IF NOT EXISTS cta_label_ar text,
  ADD COLUMN IF NOT EXISTS cta_label_en text,
  ADD COLUMN IF NOT EXISTS bg_color    text,
  ADD COLUMN IF NOT EXISTS fg_color    text;

CREATE INDEX IF NOT EXISTS homepage_section_items_listing_idx
  ON public.homepage_section_items (listing_id)
  WHERE listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS homepage_section_items_supplier_idx
  ON public.homepage_section_items (supplier_id)
  WHERE supplier_id IS NOT NULL;

-- 2) Seed the 6 well-known web-home sections (idempotent)
INSERT INTO public.homepage_sections (slug, section_type, sort_order, enabled, title_ar, title_en, subtitle_ar, subtitle_en)
VALUES
  ('web_hero_slider',        'carousel', 10, true,
    'البانر الرئيسي',         'Hero slider',
    'الشرائح التي تظهر أعلى الصفحة الرئيسية', 'Slides displayed at the top of the home page'),
  ('web_categories_strip',   'grid',     20, true,
    'الفئات',                 'Browse categories',
    'الفئات المعروضة أسفل السلايدر', 'Categories shown under the hero slider'),
  ('web_flash_deals',        'grid',     30, true,
    'عروض سريعة',             'Flash Deals',
    'منتجات بأسعار مخفّضة لفترة محدودة', 'Limited-time discounted listings'),
  ('web_trending',           'grid',     40, true,
    'الأكثر رواجاً',          'Trending now',
    'المنتجات الأكثر مشاهدة',  'Top-viewed listings'),
  ('web_promo_banners',      'grid',     50, true,
    'لافتات ترويجية',         'Promo banners',
    'بطاقات إعلانية ملوّنة',   'Colored promotional cards'),
  ('web_featured_suppliers', 'grid',     60, true,
    'موردون مميزون',          'Top suppliers',
    'الموردون المعتمدون',     'Verified suppliers')
ON CONFLICT (slug) DO NOTHING;

COMMENT ON COLUMN public.homepage_section_items.listing_id  IS 'Optional: pin a specific listing (used by flash_deals / trending).';
COMMENT ON COLUMN public.homepage_section_items.supplier_id IS 'Optional: pin a specific supplier profile (used by featured_suppliers).';
COMMENT ON COLUMN public.homepage_section_items.kicker_ar   IS 'Small uppercase kicker text above title (hero slides, promos).';
COMMENT ON COLUMN public.homepage_section_items.kicker_en   IS 'Small uppercase kicker text above title (hero slides, promos).';
COMMENT ON COLUMN public.homepage_section_items.cta_label_ar IS 'Call-to-action button label (hero slides, promos).';
COMMENT ON COLUMN public.homepage_section_items.cta_label_en IS 'Call-to-action button label (hero slides, promos).';
COMMENT ON COLUMN public.homepage_section_items.bg_color    IS 'Optional background color (hex, e.g. #B71C1C) for promo/category tiles.';
COMMENT ON COLUMN public.homepage_section_items.fg_color    IS 'Optional foreground/icon color (hex) paired with bg_color.';
