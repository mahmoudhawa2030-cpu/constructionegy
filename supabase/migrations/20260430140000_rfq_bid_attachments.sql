-- Supplier bid attachments (PDF, docs, etc.) stored in existing private bucket under supplier uid.

CREATE TABLE IF NOT EXISTS public.rfq_bid_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id uuid NOT NULL REFERENCES public.rfq_bids (id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  content_type text,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  content_hash text,
  uploaded_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfq_bid_attachments_bid_id_idx ON public.rfq_bid_attachments (bid_id);
CREATE INDEX IF NOT EXISTS rfq_bid_attachments_uploaded_by_idx ON public.rfq_bid_attachments (uploaded_by);

DROP TRIGGER IF EXISTS rfq_bid_attachments_set_updated_at ON public.rfq_bid_attachments;
CREATE TRIGGER rfq_bid_attachments_set_updated_at
  BEFORE UPDATE ON public.rfq_bid_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rfq_bid_attachments ENABLE ROW LEVEL SECURITY;

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

COMMENT ON TABLE public.rfq_bid_attachments IS 'Files a supplier attaches to their RFQ bid (offer PDFs, catalogs, etc.).';

-- Buyers who own the RFQ can read bid attachment objects in storage (path registered in table).
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

DROP POLICY IF EXISTS "rfq_bid_attachments_admin_select" ON public.rfq_bid_attachments;
CREATE POLICY "rfq_bid_attachments_admin_select"
  ON public.rfq_bid_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
