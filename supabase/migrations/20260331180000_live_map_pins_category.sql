-- Service/category while “Available now”; map can filter pins by category (matches listings.categories).

ALTER TABLE public.live_map_pins
  ADD COLUMN IF NOT EXISTS category_slug text REFERENCES public.categories (slug) ON UPDATE CASCADE ON DELETE RESTRICT;

COMMENT ON COLUMN public.live_map_pins.category_slug IS 'Active category the user is offering on the live map; must match an existing categories.slug when set.';

CREATE INDEX IF NOT EXISTS live_map_pins_category_until_idx
  ON public.live_map_pins (category_slug, available_until);
