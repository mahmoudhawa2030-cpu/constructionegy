-- Desktop home category cards: image per category, managed under homepage admin (not on categories rows).

CREATE TABLE public.homepage_desktop_category_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL REFERENCES public.categories (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  image_storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT homepage_desktop_category_cards_slug_unique UNIQUE (category_slug),
  CONSTRAINT homepage_desktop_category_cards_path_nonempty CHECK (char_length(trim(image_storage_path)) > 0)
);

CREATE INDEX homepage_desktop_category_cards_sort_idx
  ON public.homepage_desktop_category_cards (enabled, sort_order, category_slug);

COMMENT ON TABLE public.homepage_desktop_category_cards IS 'Large-screen home: one card per category with uploaded icon; links to gallery filter.';

COMMENT ON COLUMN public.homepage_desktop_category_cards.image_storage_path IS 'Path within bucket homepage-desktop-category-icons.';

CREATE TRIGGER homepage_desktop_category_cards_updated_at
  BEFORE UPDATE ON public.homepage_desktop_category_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.homepage_desktop_category_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homepage_desktop_category_cards_select_guest"
  ON public.homepage_desktop_category_cards FOR SELECT TO anon
  USING (enabled = true);

CREATE POLICY "homepage_desktop_category_cards_select_guest_auth"
  ON public.homepage_desktop_category_cards FOR SELECT TO authenticated
  USING (enabled = true);

CREATE POLICY "homepage_desktop_category_cards_select_admin"
  ON public.homepage_desktop_category_cards FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "homepage_desktop_category_cards_insert_admin"
  ON public.homepage_desktop_category_cards FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "homepage_desktop_category_cards_update_admin"
  ON public.homepage_desktop_category_cards FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "homepage_desktop_category_cards_delete_admin"
  ON public.homepage_desktop_category_cards FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Public read for Next/Image on desktop home; admin-only writes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homepage-desktop-category-icons',
  'homepage-desktop-category-icons',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

CREATE POLICY "homepage_desktop_cat_icons_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homepage-desktop-category-icons');

CREATE POLICY "homepage_desktop_cat_icons_storage_insert_admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'homepage-desktop-category-icons'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "homepage_desktop_cat_icons_storage_update_admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'homepage-desktop-category-icons'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    bucket_id = 'homepage-desktop-category-icons'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "homepage_desktop_cat_icons_storage_delete_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'homepage-desktop-category-icons'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Preset icon keys no longer stored on categories.
ALTER TABLE public.categories DROP COLUMN IF EXISTS homepage_desktop_icon_key;
