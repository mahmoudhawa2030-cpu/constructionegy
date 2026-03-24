-- Admin flag on profiles + RLS so admins can read all listings and update any listing (moderation).
-- Promote your first admin in SQL Editor, e.g.:
--   UPDATE public.profiles SET is_admin = true WHERE id = '<your-auth-user-uuid>';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles (is_admin) WHERE is_admin = true;

CREATE POLICY "listings_select_admin"
  ON public.listings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "listings_update_admin"
  ON public.listings FOR UPDATE TO authenticated
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
