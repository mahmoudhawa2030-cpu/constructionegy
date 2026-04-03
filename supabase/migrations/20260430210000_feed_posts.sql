-- Social feed posts (not marketplace listings). Veterans Corner posts are flagged by admins only.

CREATE TYPE public.feed_post_status AS ENUM ('published', 'hidden');

CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}',
  location text,
  is_veterans_corner boolean NOT NULL DEFAULT false,
  status public.feed_post_status NOT NULL DEFAULT 'published',
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feed_posts_title_nonempty CHECK (char_length(trim(title)) > 0)
);

CREATE INDEX feed_posts_published_feed_idx
  ON public.feed_posts (status, created_at DESC)
  WHERE is_veterans_corner = false AND status = 'published';

CREATE INDEX feed_posts_veterans_latest_idx
  ON public.feed_posts (status, created_at DESC)
  WHERE is_veterans_corner = true AND status = 'published';

COMMENT ON TABLE public.feed_posts IS 'Mobile home social feed: user posts; is_veterans_corner managed by admins only.';

CREATE TRIGGER feed_posts_set_updated_at
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Non-admins cannot set is_veterans_corner (homepage Veterans Corner slot).
CREATE OR REPLACE FUNCTION public.feed_posts_veterans_only_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  adm boolean;
BEGIN
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  ) INTO adm;
  IF NOT adm THEN
    NEW.is_veterans_corner := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER feed_posts_veterans_only_admin
  BEFORE INSERT OR UPDATE ON public.feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.feed_posts_veterans_only_admin();

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_posts_select_anon"
  ON public.feed_posts FOR SELECT TO anon
  USING (status = 'published'::public.feed_post_status);

CREATE POLICY "feed_posts_select_authenticated"
  ON public.feed_posts FOR SELECT TO authenticated
  USING (status = 'published'::public.feed_post_status);

CREATE POLICY "feed_posts_select_admin"
  ON public.feed_posts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "feed_posts_insert_own"
  ON public.feed_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "feed_posts_update_own"
  ON public.feed_posts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "feed_posts_delete_own"
  ON public.feed_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "feed_posts_update_admin"
  ON public.feed_posts FOR UPDATE TO authenticated
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

CREATE POLICY "feed_posts_delete_admin"
  ON public.feed_posts FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
