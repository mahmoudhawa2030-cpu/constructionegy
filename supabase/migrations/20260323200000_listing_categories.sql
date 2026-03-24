-- Dynamic listing categories (admin-managed). `listings.category` stores slug (FK).

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  label_ar text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT categories_slug_unique UNIQUE (slug),
  CONSTRAINT categories_label_nonempty CHECK (char_length(trim(label_ar)) > 0)
);

CREATE INDEX categories_sort_active_idx ON public.categories (is_active, sort_order, slug);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.categories (slug, label_ar, sort_order, is_active) VALUES
  ('scaffolding', 'سقالات', 10, true),
  ('formwork', 'شدات (قوالب)', 20, true),
  ('tools', 'أدوات ومعدات يدوية', 30, true),
  ('heavy_equipment', 'معدات ثقيلة', 40, true),
  ('vehicles', 'مركبات ونقل', 50, true),
  ('safety', 'سلامة ووقاية', 60, true),
  ('other', 'أخرى', 100, true);

-- Map any legacy/unknown category values before FK (keeps rows valid).
UPDATE public.listings
SET category = 'other'
WHERE category IS NULL
   OR trim(category) = ''
   OR category NOT IN (SELECT slug FROM public.categories);

ALTER TABLE public.listings
  ADD CONSTRAINT listings_category_fkey
  FOREIGN KEY (category) REFERENCES public.categories (slug)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_authenticated"
  ON public.categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "categories_select_anon_active"
  ON public.categories FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "categories_insert_admin"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "categories_update_admin"
  ON public.categories FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
