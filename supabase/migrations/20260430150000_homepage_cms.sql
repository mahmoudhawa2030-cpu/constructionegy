-- CMS-driven mobile-first guest homepage: sections (carousel / grid) and items (cards / slides).

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  section_type text NOT NULL CHECK (section_type IN ('carousel', 'grid')),
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  title_ar text,
  title_en text,
  subtitle_ar text,
  subtitle_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS homepage_sections_sort_idx ON public.homepage_sections (sort_order, id);

CREATE TABLE IF NOT EXISTS public.homepage_section_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.homepage_sections (id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_ar text,
  description_en text,
  href text NOT NULL DEFAULT '/',
  icon_emoji text,
  image_url text,
  badge_count integer CHECK (badge_count IS NULL OR badge_count >= 0),
  badge_label_ar text,
  badge_label_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS homepage_section_items_section_sort_idx
  ON public.homepage_section_items (section_id, sort_order, id);

DROP TRIGGER IF EXISTS homepage_sections_set_updated_at ON public.homepage_sections;
CREATE TRIGGER homepage_sections_set_updated_at
  BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS homepage_section_items_set_updated_at ON public.homepage_section_items;
CREATE TRIGGER homepage_section_items_set_updated_at
  BEFORE UPDATE ON public.homepage_section_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_section_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homepage_sections_select" ON public.homepage_sections;
CREATE POLICY "homepage_sections_select"
  ON public.homepage_sections FOR SELECT
  TO anon, authenticated
  USING (
    enabled = true
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

DROP POLICY IF EXISTS "homepage_sections_insert_admin" ON public.homepage_sections;
CREATE POLICY "homepage_sections_insert_admin"
  ON public.homepage_sections FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "homepage_sections_update_admin" ON public.homepage_sections;
CREATE POLICY "homepage_sections_update_admin"
  ON public.homepage_sections FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "homepage_sections_delete_admin" ON public.homepage_sections;
CREATE POLICY "homepage_sections_delete_admin"
  ON public.homepage_sections FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "homepage_section_items_select" ON public.homepage_section_items;
CREATE POLICY "homepage_section_items_select"
  ON public.homepage_section_items FOR SELECT
  TO anon, authenticated
  USING (
    (
      enabled = true
      AND EXISTS (
        SELECT 1 FROM public.homepage_sections s
        WHERE s.id = homepage_section_items.section_id AND s.enabled = true
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

DROP POLICY IF EXISTS "homepage_section_items_insert_admin" ON public.homepage_section_items;
CREATE POLICY "homepage_section_items_insert_admin"
  ON public.homepage_section_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "homepage_section_items_update_admin" ON public.homepage_section_items;
CREATE POLICY "homepage_section_items_update_admin"
  ON public.homepage_section_items FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "homepage_section_items_delete_admin" ON public.homepage_section_items;
CREATE POLICY "homepage_section_items_delete_admin"
  ON public.homepage_section_items FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

COMMENT ON TABLE public.homepage_sections IS 'Ordered homepage blocks (carousel or service grid) for the guest /tabs landing page.';
COMMENT ON TABLE public.homepage_section_items IS 'Slides (carousel) or cards (grid): bilingual labels, link, optional emoji icon, badge, image.';
