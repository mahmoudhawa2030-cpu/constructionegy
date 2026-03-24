-- Public catalog: visitors without login can browse active listings (OLX-style).
-- Apply in Supabase SQL Editor after the main marketplace migration.

CREATE POLICY "listings_select_active_anon"
  ON public.listings FOR SELECT TO anon
  USING (status = 'active');
