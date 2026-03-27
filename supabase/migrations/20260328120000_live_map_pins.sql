-- Opt-in live map: GPS pin visible to other signed-in users only while session is active.

CREATE TABLE public.live_map_pins (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  lat double precision NOT NULL CHECK (lat >= -90 AND lat <= 90),
  lng double precision NOT NULL CHECK (lng >= -180 AND lng <= 180),
  available_until timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX live_map_pins_available_until_idx ON public.live_map_pins (available_until);

ALTER TABLE public.live_map_pins ENABLE ROW LEVEL SECURITY;

-- Others see only non-expired pins; you can always read your own row (e.g. to clean up).
CREATE POLICY "live_map_pins_select_visible_or_own"
  ON public.live_map_pins FOR SELECT TO authenticated
  USING (available_until > now() OR user_id = auth.uid());

CREATE POLICY "live_map_pins_insert_own"
  ON public.live_map_pins FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "live_map_pins_update_own"
  ON public.live_map_pins FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "live_map_pins_delete_own"
  ON public.live_map_pins FOR DELETE TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.live_map_pins IS 'Ephemeral GPS for optional “available now” map visibility.';
