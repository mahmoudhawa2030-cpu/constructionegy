-- Final fix for RFQ upload RLS error: "new row violates row-level security policy"
-- This migration drops and recreates ALL relevant policies for rfq_attachments and storage.
-- It uses the simplified feature_usable_under_enforcement() that only checks subscription.

-- 1. Recreate the function safely with CASCADE
DROP FUNCTION IF EXISTS public.feature_usable_under_enforcement(uuid, text) CASCADE;

CREATE OR REPLACE FUNCTION public.feature_usable_under_enforcement(p_user_id uuid, p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    NOT public.subscriptions_enforcement_enabled()
    OR NOT COALESCE(public.subscription_service_requires_payment(p_feature), true)
    OR public.user_has_active_subscription(p_user_id, p_feature);
$$;

COMMENT ON FUNCTION public.feature_usable_under_enforcement(uuid, text) IS 'Final simplified version - subscription only. Updated 2026-05-02 to fix upload RLS.';

-- 2. Recreate table policies for rfq_attachments
DROP POLICY IF EXISTS "rfq_attachments_insert_own" ON public.rfq_attachments;
CREATE POLICY "rfq_attachments_insert_own"
  ON public.rfq_attachments FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id 
        AND d.user_id = auth.uid()
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

-- 3. Recreate storage policies for rfq-attachments bucket
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

-- 4. Ensure open read policy for storage is correct
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

-- 5. Also update the main open read policy for the table (for consistency)
DROP POLICY IF EXISTS "rfq_attachments_select_open_rfq" ON public.rfq_attachments;
CREATE POLICY "rfq_attachments_select_open_rfq"
  ON public.rfq_attachments FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id
        AND d.status IN ('open_for_bids')
    )
  );

COMMENT ON POLICY "rfq_attachments_insert_own" ON public.rfq_attachments IS 'FINAL FIX - allows upload for subscribed users only. 2026-05-02';
COMMENT ON POLICY "rfq_attachments_storage_insert_own" ON storage.objects IS 'FINAL FIX - allows upload for subscribed users only. 2026-05-02';
