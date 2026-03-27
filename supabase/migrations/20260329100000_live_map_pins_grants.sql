-- Ensure the browser client (authenticated role) can read/write pins.
-- Fixes "permission denied" / save failures if default grants were missing.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_map_pins TO authenticated;
GRANT ALL ON public.live_map_pins TO service_role;
