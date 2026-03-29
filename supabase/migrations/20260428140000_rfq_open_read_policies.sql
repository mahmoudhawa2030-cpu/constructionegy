-- Allow authenticated users with RFQ access to read others' published RFQs (items, attachments, storage)
-- so suppliers can quote. Buyer-only edit/upload remains enforced in app + existing INSERT/UPDATE policies.

DROP POLICY IF EXISTS "rfq_drafts_select_open_to_others" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_select_open_to_others"
  ON public.rfq_drafts FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND status IN ('submitted', 'open_for_bids')
    AND user_id <> auth.uid()
  );

DROP POLICY IF EXISTS "rfq_items_select_open_rfq" ON public.rfq_items;
CREATE POLICY "rfq_items_select_open_rfq"
  ON public.rfq_items FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id
        AND d.status IN ('submitted', 'open_for_bids')
        AND d.user_id <> auth.uid()
    )
  );

DROP POLICY IF EXISTS "rfq_attachments_select_open_rfq" ON public.rfq_attachments;
CREATE POLICY "rfq_attachments_select_open_rfq"
  ON public.rfq_attachments FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id
        AND d.status IN ('submitted', 'open_for_bids')
        AND d.user_id <> auth.uid()
    )
  );

DROP POLICY IF EXISTS "rfq_attachments_storage_select_open_rfq" ON storage.objects;
CREATE POLICY "rfq_attachments_storage_select_open_rfq"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1
      FROM public.rfq_attachments ra
      JOIN public.rfq_drafts d ON d.id = ra.draft_id
      WHERE ra.storage_path = storage.objects.name
        AND d.status IN ('submitted', 'open_for_bids')
        AND d.user_id <> auth.uid()
    )
  );
