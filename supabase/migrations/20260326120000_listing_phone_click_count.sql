-- Count buyer taps on seller phone (tel: link). Owners cannot increment their own listings.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS phone_click_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_listing_phone_click(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT user_id INTO v_owner FROM public.listings WHERE id = p_listing_id;
  IF v_owner IS NULL THEN
    RETURN;
  END IF;
  IF v_owner = auth.uid() THEN
    RETURN;
  END IF;

  UPDATE public.listings
  SET phone_click_count = phone_click_count + 1
  WHERE id = p_listing_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_listing_phone_click(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_listing_phone_click(uuid) TO authenticated;
