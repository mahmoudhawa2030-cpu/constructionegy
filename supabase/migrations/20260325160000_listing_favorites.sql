-- Saved listings (favorites) per user.

CREATE TABLE public.listing_favorites (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX listing_favorites_user_created_idx ON public.listing_favorites (user_id, created_at DESC);
CREATE INDEX listing_favorites_listing_id_idx ON public.listing_favorites (listing_id);

ALTER TABLE public.listing_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_favorites_select_own"
  ON public.listing_favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "listing_favorites_insert_own"
  ON public.listing_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "listing_favorites_delete_own"
  ON public.listing_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());
