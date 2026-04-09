-- Non-admins could not set is_veterans_corner, but the previous trigger forced it to false
-- on every UPDATE, stripping admin-curated Veterans Corner when the author edited body/media.
-- Preserve OLD.is_veterans_corner for non-admin updates; still force false on INSERT for non-admins.

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
    IF TG_OP = 'INSERT' THEN
      NEW.is_veterans_corner := false;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.is_veterans_corner := OLD.is_veterans_corner;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
