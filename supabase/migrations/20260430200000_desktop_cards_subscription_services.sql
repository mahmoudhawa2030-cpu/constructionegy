-- Desktop home cards: link either to a listing category OR a subscription service (feature).

ALTER TABLE public.homepage_desktop_category_cards
  ADD COLUMN IF NOT EXISTS subscription_feature_key text REFERENCES public.subscription_services (feature_key) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.homepage_desktop_category_cards
  DROP CONSTRAINT IF EXISTS homepage_desktop_category_cards_slug_unique;

ALTER TABLE public.homepage_desktop_category_cards
  ALTER COLUMN category_slug DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS homepage_desktop_category_cards_category_slug_unique
  ON public.homepage_desktop_category_cards (category_slug)
  WHERE category_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS homepage_desktop_category_cards_feature_key_unique
  ON public.homepage_desktop_category_cards (subscription_feature_key)
  WHERE subscription_feature_key IS NOT NULL;

ALTER TABLE public.homepage_desktop_category_cards
  ADD CONSTRAINT homepage_desktop_cards_target_one_chk CHECK (
    (category_slug IS NOT NULL AND subscription_feature_key IS NULL)
    OR (category_slug IS NULL AND subscription_feature_key IS NOT NULL)
  );

COMMENT ON COLUMN public.homepage_desktop_category_cards.subscription_feature_key IS 'When set, card opens an app area (RFQ, map, etc.); category_slug is null.';

COMMENT ON TABLE public.homepage_desktop_category_cards IS 'Large-screen / mobile home: one card with image; target is either marketplace category or subscription service feature.';

-- Guest home must read service labels for cards (keys are not secret).
DROP POLICY IF EXISTS "subscription_services_select_anon" ON public.subscription_services;
CREATE POLICY "subscription_services_select_anon"
  ON public.subscription_services FOR SELECT TO anon
  USING (true);
