-- Listing view counter: total views (deduped per browser session via app cookie on record).

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0
  CONSTRAINT listings_view_count_nonnegative CHECK (view_count >= 0);

-- Avoid bumping updated_at when only view_count changes (e.g. public views).
CREATE OR REPLACE FUNCTION public.set_listings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (
    NEW.title IS DISTINCT FROM OLD.title OR
    NEW.category IS DISTINCT FROM OLD.category OR
    NEW.type IS DISTINCT FROM OLD.type OR
    NEW.price IS DISTINCT FROM OLD.price OR
    NEW.price_unit IS DISTINCT FROM OLD.price_unit OR
    NEW.condition IS DISTINCT FROM OLD.condition OR
    NEW.description IS DISTINCT FROM OLD.description OR
    NEW.images IS DISTINCT FROM OLD.images OR
    NEW.location IS DISTINCT FROM OLD.location OR
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.user_id IS DISTINCT FROM OLD.user_id
  ) THEN
    NEW.updated_at := now();
  ELSE
    NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_updated_at ON public.listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_listings_updated_at();

-- Increment views for listings the caller is allowed to see (same idea as SELECT policies).
-- Skips the listing owner (previewing own ad should not inflate the counter).
-- Returns true when a row was incremented (caller can set a client cookie).
CREATE OR REPLACE FUNCTION public.increment_listing_view(p_listing_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.listing_status;
  v_owner_id uuid;
BEGIN
  SELECT status, user_id INTO v_status, v_owner_id
  FROM public.listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_owner_id IS NOT DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;

  IF v_status = 'active' THEN
    UPDATE public.listings
    SET view_count = view_count + 1
    WHERE id = p_listing_id;
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ) THEN
    UPDATE public.listings
    SET view_count = view_count + 1
    WHERE id = p_listing_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_listing_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_listing_view(uuid) TO anon, authenticated;
