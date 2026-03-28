-- Per-category paid listings: when subscription enforcement is on, categories with
-- requires_subscription = true require an active premium_listings (or 'all') row.
-- New categories default to free (false).

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS requires_subscription boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.categories.requires_subscription IS
  'When subscriptions_enforcement_enabled() is true, INSERT/UPDATE listings in this category requires user_has_active_subscription(..., premium_listings).';

-- Allow owners to update non-category fields on an existing paid-category listing even if their subscription lapsed.
CREATE OR REPLACE FUNCTION public.listing_category_unchanged_for_owner(p_listing_id uuid, p_category text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = p_listing_id
      AND l.user_id = (SELECT auth.uid())
      AND l.category IS NOT DISTINCT FROM p_category
  );
$$;

REVOKE ALL ON FUNCTION public.listing_category_unchanged_for_owner(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listing_category_unchanged_for_owner(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "listings_insert_own" ON public.listings;
CREATE POLICY "listings_insert_own"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR NOT EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.slug = category AND c.requires_subscription IS TRUE
      )
      OR public.user_has_active_subscription(auth.uid(), 'premium_listings')
    )
  );

DROP POLICY IF EXISTS "listings_update_own" ON public.listings;
CREATE POLICY "listings_update_own"
  ON public.listings FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR NOT EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.slug = category AND c.requires_subscription IS TRUE
      )
      OR public.user_has_active_subscription(auth.uid(), 'premium_listings')
      OR public.listing_category_unchanged_for_owner(id, category)
    )
  );
