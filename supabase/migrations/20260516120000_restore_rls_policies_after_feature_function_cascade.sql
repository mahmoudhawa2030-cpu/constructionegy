-- Restore RLS policies that were dropped when `feature_usable_under_enforcement` was
-- recreated with `DROP FUNCTION ... CASCADE` (20260501120000, 20260502140000).
-- Those migrations recreated rfq_attachments / storage policies but not rfq_drafts owner
-- policies, so INSERT into rfq_drafts failed with:
--   new row violates row-level security policy for table "rfq_drafts"

-- ---- rfq_drafts (owner mutations + read others' published RFQs) ----

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

DROP POLICY IF EXISTS "rfq_drafts_select_open_to_others" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_select_open_to_others"
  ON public.rfq_drafts FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND status IN ('open_for_bids')
    AND user_id <> auth.uid()
  );

-- ---- rfq_items (mutations + open read for suppliers) ----

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

DROP POLICY IF EXISTS "rfq_items_select_open_rfq" ON public.rfq_items;
CREATE POLICY "rfq_items_select_open_rfq"
  ON public.rfq_items FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id
        AND d.status IN ('open_for_bids')
    )
  );

-- ---- rfq_bids ----

DROP POLICY IF EXISTS "rfq_bids_insert_supplier_when_open" ON public.rfq_bids;
CREATE POLICY "rfq_bids_insert_supplier_when_open"
  ON public.rfq_bids FOR INSERT TO authenticated
  WITH CHECK (
    supplier_user_id = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_bids.draft_id
        AND d.user_id <> auth.uid()
        AND d.status IN ('submitted', 'open_for_bids')
    )
  );

DROP POLICY IF EXISTS "rfq_bids_update_own_draft_bid" ON public.rfq_bids;
CREATE POLICY "rfq_bids_update_own_draft_bid"
  ON public.rfq_bids FOR UPDATE TO authenticated
  USING (
    supplier_user_id = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  )
  WITH CHECK (
    supplier_user_id = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

DROP POLICY IF EXISTS "rfq_bids_delete_own_draft_bid" ON public.rfq_bids;
CREATE POLICY "rfq_bids_delete_own_draft_bid"
  ON public.rfq_bids FOR DELETE TO authenticated
  USING (
    supplier_user_id = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

-- ---- rfq_bid_attachments + buyer storage read ----

DROP POLICY IF EXISTS "rfq_bid_attachments_select_supplier_or_buyer" ON public.rfq_bid_attachments;
CREATE POLICY "rfq_bid_attachments_select_supplier_or_buyer"
  ON public.rfq_bid_attachments FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND (
      EXISTS (
        SELECT 1 FROM public.rfq_bids b
        WHERE b.id = rfq_bid_attachments.bid_id
          AND b.supplier_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.rfq_bids b
        JOIN public.rfq_drafts d ON d.id = b.draft_id
        WHERE b.id = rfq_bid_attachments.bid_id
          AND d.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "rfq_bid_attachments_insert_supplier_draft_bid" ON public.rfq_bid_attachments;
CREATE POLICY "rfq_bid_attachments_insert_supplier_draft_bid"
  ON public.rfq_bid_attachments FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1 FROM public.rfq_bids b
      WHERE b.id = rfq_bid_attachments.bid_id
        AND b.supplier_user_id = auth.uid()
        AND b.status = 'draft'
    )
  );

DROP POLICY IF EXISTS "rfq_bid_attachments_storage_select_buyer" ON storage.objects;
CREATE POLICY "rfq_bid_attachments_storage_select_buyer"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1
      FROM public.rfq_bid_attachments rba
      JOIN public.rfq_bids b ON b.id = rba.bid_id
      JOIN public.rfq_drafts d ON d.id = b.draft_id
      WHERE rba.storage_path = storage.objects.name
        AND d.user_id = auth.uid()
    )
  );

-- ---- live map (writes gated by feature) ----

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

-- ---- listings (premium category gate) ----

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

COMMENT ON POLICY "rfq_drafts_insert_own" ON public.rfq_drafts IS 'Restored after DROP FUNCTION feature_usable_under_enforcement CASCADE (2026-05-16).';
