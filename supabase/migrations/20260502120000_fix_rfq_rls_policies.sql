-- Fix RLS policies after simplifying feature_usable_under_enforcement()
-- The previous migration only recreated a few SELECT policies.
-- This one recreates ALL owner + storage policies for rfq_attachments and rfq_bids
-- so that uploads no longer fail with "new row violates row-level security".

-- 1. Recreate owner policies for rfq_attachments (insert/update/delete)
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

-- 2. Recreate storage policies for rfq-attachments bucket
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

-- 3. Make sure the open read policy for storage is also up-to-date
DROP POLICY IF EXISTS "rfq_attachments_storage_select_open_rfq" ON storage.objects;
CREATE POLICY "rfq_attachments_storage_select_open_rfq"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      JOIN public.rfq_attachments ra ON ra.draft_id = d.id
      WHERE ra.storage_path = storage.objects.name
        AND d.status IN ('open_for_bids')
    )
  );

-- 4. Also refresh bid attachment policies (they can also be affected)
DROP POLICY IF EXISTS "rfq_bid_attachments_insert_supplier_draft_bid" ON public.rfq_bid_attachments;
CREATE POLICY "rfq_bid_attachments_insert_supplier_draft_bid"
  ON public.rfq_bid_attachments FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.rfq_bids b
      WHERE b.id = rfq_bid_attachments.bid_id
        AND b.supplier_user_id = auth.uid()
        AND b.status = 'draft'
    )
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
  );

COMMENT ON POLICY "rfq_attachments_insert_own" ON public.rfq_attachments IS 'Fixed after simplifying feature_usable_under_enforcement() - 2026-05-02';
COMMENT ON POLICY "rfq_attachments_storage_insert_own" ON storage.objects IS 'Fixed after simplifying feature_usable_under_enforcement() - 2026-05-02';
