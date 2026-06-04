-- SEO blog posts (RankMath-style). Posts live at /{category_slug}/{slug}.

CREATE TABLE public.seo_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL REFERENCES public.categories (slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  seed_keyword text NOT NULL DEFAULT '',
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL DEFAULT '',
  meta_title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  cover_image text,
  cover_image_alt text,
  seo_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  publish_at timestamptz,
  author_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seo_posts_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT seo_posts_status_check CHECK (status IN ('draft', 'published')),
  CONSTRAINT seo_posts_category_slug_unique UNIQUE (category_slug, slug)
);

CREATE INDEX seo_posts_published_idx
  ON public.seo_posts (status, publish_at DESC);
CREATE INDEX seo_posts_category_idx
  ON public.seo_posts (category_slug, status);

CREATE TRIGGER seo_posts_updated_at
  BEFORE UPDATE ON public.seo_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.seo_posts ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can read only live published posts.
CREATE POLICY "seo_posts_select_public"
  ON public.seo_posts FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND (publish_at IS NULL OR publish_at <= now())
  );

-- Admins can read everything (drafts/scheduled).
CREATE POLICY "seo_posts_select_admin"
  ON public.seo_posts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "seo_posts_insert_admin"
  ON public.seo_posts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "seo_posts_update_admin"
  ON public.seo_posts FOR UPDATE TO authenticated
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

CREATE POLICY "seo_posts_delete_admin"
  ON public.seo_posts FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
