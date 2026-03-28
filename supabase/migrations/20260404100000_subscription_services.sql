-- Registry of subscription "services" (RFQ, live map, premium listings, all, + future keys).
-- Admin sets requires_subscription: when false and enforcement is on, the feature stays free without a subscription row.

CREATE TABLE IF NOT EXISTS public.subscription_services (
  feature_key text PRIMARY KEY,
  requires_subscription boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_services_feature_key_format CHECK (feature_key ~ '^[a-z][a-z0-9_]*$')
);

CREATE INDEX IF NOT EXISTS subscription_services_sort_idx ON public.subscription_services (sort_order, feature_key);

DROP TRIGGER IF EXISTS subscription_services_set_updated_at ON public.subscription_services;
CREATE TRIGGER subscription_services_set_updated_at
  BEFORE UPDATE ON public.subscription_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.subscription_services (feature_key, requires_subscription, sort_order, label_ar, label_en) VALUES
  ('rfq', true, 10, 'طلبات العروض (RFQ)', 'Request for Quotes (RFQ)'),
  ('live_map', true, 20, 'الخريطة المباشرة', 'Live Map'),
  ('premium_listings', true, 30, 'الإعلانات المميزة', 'Premium Listings'),
  ('all', true, 5, 'جميع الميزات', 'All Features')
ON CONFLICT (feature_key) DO NOTHING;

ALTER TABLE public.subscription_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_services_select_authenticated" ON public.subscription_services;
CREATE POLICY "subscription_services_select_authenticated"
  ON public.subscription_services FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "subscription_services_admin_all" ON public.subscription_services;
CREATE POLICY "subscription_services_admin_all"
  ON public.subscription_services FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

COMMENT ON TABLE public.subscription_services IS 'Feature keys for subscriptions + free/paid when enforcement is on.';

-- FK from subscriptions.feature → registry (replace any CHECK on feature).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.subscriptions'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%feature%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_feature_fkey'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_feature_fkey
      FOREIGN KEY (feature) REFERENCES public.subscription_services (feature_key)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END $$;

-- True = users need a subscription row when enforcement is on (unless service is marked free below).
CREATE OR REPLACE FUNCTION public.subscription_service_requires_payment(p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ss.requires_subscription FROM public.subscription_services ss WHERE ss.feature_key = p_feature),
    true
  );
$$;

REVOKE ALL ON FUNCTION public.subscription_service_requires_payment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscription_service_requires_payment(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.feature_usable_under_enforcement(p_user_id uuid, p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT public.subscriptions_enforcement_enabled()
    OR NOT public.subscription_service_requires_payment(p_feature)
    OR public.user_has_active_subscription(p_user_id, p_feature);
$$;

REVOKE ALL ON FUNCTION public.feature_usable_under_enforcement(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feature_usable_under_enforcement(uuid, text) TO authenticated;

-- ---- RFQ: respect free/paid per service ----

DROP POLICY IF EXISTS "rfq_drafts_insert_own" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_insert_own"
  ON public.rfq_drafts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_drafts_update_own" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_update_own"
  ON public.rfq_drafts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_drafts_delete_own" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_delete_own"
  ON public.rfq_drafts FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_items_insert_via_draft" ON public.rfq_items;
CREATE POLICY "rfq_items_insert_via_draft"
  ON public.rfq_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id AND d.user_id = auth.uid()
    )
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_items_update_via_draft" ON public.rfq_items;
CREATE POLICY "rfq_items_update_via_draft"
  ON public.rfq_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id AND d.user_id = auth.uid()
    )
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_items_delete_via_draft" ON public.rfq_items;
CREATE POLICY "rfq_items_delete_via_draft"
  ON public.rfq_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id AND d.user_id = auth.uid()
    )
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_attachments_insert_own" ON public.rfq_attachments;
CREATE POLICY "rfq_attachments_insert_own"
  ON public.rfq_attachments FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id AND d.user_id = auth.uid()
    )
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_attachments_update_via_draft" ON public.rfq_attachments;
CREATE POLICY "rfq_attachments_update_via_draft"
  ON public.rfq_attachments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id AND d.user_id = auth.uid()
    )
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_attachments_delete_via_draft" ON public.rfq_attachments;
CREATE POLICY "rfq_attachments_delete_via_draft"
  ON public.rfq_attachments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id AND d.user_id = auth.uid()
    )
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_attachments_storage_insert_own" ON storage.objects;
CREATE POLICY "rfq_attachments_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_attachments_storage_update_own" ON storage.objects;
CREATE POLICY "rfq_attachments_storage_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_attachments_storage_delete_own" ON storage.objects;
CREATE POLICY "rfq_attachments_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

-- ---- Live map ----

DROP POLICY IF EXISTS "live_map_pins_insert_own" ON public.live_map_pins;
CREATE POLICY "live_map_pins_insert_own"
  ON public.live_map_pins FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'live_map')
  );

DROP POLICY IF EXISTS "live_map_pins_update_own" ON public.live_map_pins;
CREATE POLICY "live_map_pins_update_own"
  ON public.live_map_pins FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'live_map')
  );

-- ---- Listings (category + premium_listings service) ----

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
      OR public.feature_usable_under_enforcement(auth.uid(), 'premium_listings')
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
      OR public.feature_usable_under_enforcement(auth.uid(), 'premium_listings')
      OR public.listing_category_unchanged_for_owner(id, category)
    )
  );
