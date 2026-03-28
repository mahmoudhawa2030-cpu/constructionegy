-- Subscription enforcement switch (DB) + RLS gates for rfq, live_map_pins, listings insert, RFQ storage.
-- Default: enforce_subscriptions = false → same behavior as before migration.
-- Set app_settings.value = 'true' for key enforce_subscriptions OR rely on ENFORCE_SUBSCRIPTIONS on the app (server only for env path).

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (key, value) VALUES ('enforce_subscriptions', 'false')
ON CONFLICT (key) DO NOTHING;

DROP TRIGGER IF EXISTS app_settings_set_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_set_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_admin_all" ON public.app_settings;
CREATE POLICY "app_settings_admin_all"
  ON public.app_settings FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

COMMENT ON TABLE public.app_settings IS 'Key/value flags; enforce_subscriptions=true gates paid features in RLS.';

-- Readable by anyone logged in via SECURITY DEFINER RPCs below (no direct SELECT for non-admins needed).

CREATE OR REPLACE FUNCTION public.subscriptions_enforcement_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT value = 'true' FROM public.app_settings WHERE key = 'enforce_subscriptions'),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.subscriptions_enforcement_enabled() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscriptions_enforcement_enabled() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.user_has_active_subscription(p_user_id uuid, p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND (s.feature::text = p_feature OR s.feature::text = 'all')
      AND (s.valid_until IS NULL OR s.valid_until > now())
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_active_subscription(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_active_subscription(uuid, text) TO authenticated;

-- ---- RFQ: gate mutations when enforcement is on ----

DROP POLICY IF EXISTS "rfq_drafts_insert_own" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_insert_own"
  ON public.rfq_drafts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
  );

DROP POLICY IF EXISTS "rfq_drafts_update_own" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_update_own"
  ON public.rfq_drafts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
  );

DROP POLICY IF EXISTS "rfq_drafts_delete_own" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_delete_own"
  ON public.rfq_drafts FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
  );

DROP POLICY IF EXISTS "rfq_items_insert_via_draft" ON public.rfq_items;
CREATE POLICY "rfq_items_insert_via_draft"
  ON public.rfq_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id AND d.user_id = auth.uid()
    )
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
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
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
  );

DROP POLICY IF EXISTS "rfq_items_delete_via_draft" ON public.rfq_items;
CREATE POLICY "rfq_items_delete_via_draft"
  ON public.rfq_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id AND d.user_id = auth.uid()
    )
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
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
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
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
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
  );

DROP POLICY IF EXISTS "rfq_attachments_delete_via_draft" ON public.rfq_attachments;
CREATE POLICY "rfq_attachments_delete_via_draft"
  ON public.rfq_attachments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id AND d.user_id = auth.uid()
    )
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
  );

DROP POLICY IF EXISTS "rfq_attachments_storage_insert_own" ON storage.objects;
CREATE POLICY "rfq_attachments_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
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
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
  );

DROP POLICY IF EXISTS "rfq_attachments_storage_delete_own" ON storage.objects;
CREATE POLICY "rfq_attachments_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'rfq')
    )
  );

-- ---- Live map: gate pin write when enforcement is on (view/select unchanged) ----

DROP POLICY IF EXISTS "live_map_pins_insert_own" ON public.live_map_pins;
CREATE POLICY "live_map_pins_insert_own"
  ON public.live_map_pins FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'live_map')
    )
  );

DROP POLICY IF EXISTS "live_map_pins_update_own" ON public.live_map_pins;
CREATE POLICY "live_map_pins_update_own"
  ON public.live_map_pins FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'live_map')
    )
  );

DROP POLICY IF EXISTS "live_map_pins_delete_own" ON public.live_map_pins;
CREATE POLICY "live_map_pins_delete_own"
  ON public.live_map_pins FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---- New listings: premium_listings feature ----

DROP POLICY IF EXISTS "listings_insert_own" ON public.listings;
CREATE POLICY "listings_insert_own"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT public.subscriptions_enforcement_enabled()
      OR public.user_has_active_subscription(auth.uid(), 'premium_listings')
    )
  );
