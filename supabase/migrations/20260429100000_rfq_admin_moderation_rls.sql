-- Admins: read all RFQ data, update drafts (moderation) and bids (award/reject), read RFQ storage objects.

DROP POLICY IF EXISTS "rfq_drafts_admin_select" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_admin_select"
  ON public.rfq_drafts FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "rfq_drafts_admin_update" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_admin_update"
  ON public.rfq_drafts FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "rfq_items_admin_select" ON public.rfq_items;
CREATE POLICY "rfq_items_admin_select"
  ON public.rfq_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "rfq_attachments_admin_select" ON public.rfq_attachments;
CREATE POLICY "rfq_attachments_admin_select"
  ON public.rfq_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "rfq_bids_admin_select" ON public.rfq_bids;
CREATE POLICY "rfq_bids_admin_select"
  ON public.rfq_bids FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "rfq_bids_admin_update" ON public.rfq_bids;
CREATE POLICY "rfq_bids_admin_update"
  ON public.rfq_bids FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "rfq_attachments_storage_select_admin" ON storage.objects;
CREATE POLICY "rfq_attachments_storage_select_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
