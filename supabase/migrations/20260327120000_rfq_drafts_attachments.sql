-- RFQ drafts, line items (for future persist / confirm step), and file attachments.

CREATE TABLE IF NOT EXISTS public.rfq_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'archived')),
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rfq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES public.rfq_drafts (id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  description text NOT NULL DEFAULT '',
  quantity numeric(18, 4),
  unit text,
  notes text,
  raw jsonb,
  validation_errors jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rfq_items_draft_row_unique UNIQUE (draft_id, row_index)
);

CREATE INDEX IF NOT EXISTS rfq_items_draft_id_idx ON public.rfq_items (draft_id);

CREATE TABLE IF NOT EXISTS public.rfq_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES public.rfq_drafts (id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  content_type text,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  content_hash text,
  uploaded_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfq_attachments_draft_id_idx ON public.rfq_attachments (draft_id);
CREATE INDEX IF NOT EXISTS rfq_attachments_uploaded_by_idx ON public.rfq_attachments (uploaded_by);

DROP TRIGGER IF EXISTS rfq_drafts_set_updated_at ON public.rfq_drafts;
CREATE TRIGGER rfq_drafts_set_updated_at
  BEFORE UPDATE ON public.rfq_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS rfq_attachments_set_updated_at ON public.rfq_attachments;
CREATE TRIGGER rfq_attachments_set_updated_at
  BEFORE UPDATE ON public.rfq_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rfq_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfq_drafts_select_own" ON public.rfq_drafts;
DROP POLICY IF EXISTS "rfq_drafts_insert_own" ON public.rfq_drafts;
DROP POLICY IF EXISTS "rfq_drafts_update_own" ON public.rfq_drafts;
DROP POLICY IF EXISTS "rfq_drafts_delete_own" ON public.rfq_drafts;

CREATE POLICY "rfq_drafts_select_own"
  ON public.rfq_drafts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "rfq_drafts_insert_own"
  ON public.rfq_drafts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "rfq_drafts_update_own"
  ON public.rfq_drafts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "rfq_drafts_delete_own"
  ON public.rfq_drafts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "rfq_items_select_via_draft" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_insert_via_draft" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_update_via_draft" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_delete_via_draft" ON public.rfq_items;

CREATE POLICY "rfq_items_select_via_draft"
  ON public.rfq_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "rfq_items_insert_via_draft"
  ON public.rfq_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id AND d.user_id = auth.uid()
    )
  );

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
  );

CREATE POLICY "rfq_items_delete_via_draft"
  ON public.rfq_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "rfq_attachments_select_via_draft" ON public.rfq_attachments;
DROP POLICY IF EXISTS "rfq_attachments_insert_own" ON public.rfq_attachments;
DROP POLICY IF EXISTS "rfq_attachments_update_via_draft" ON public.rfq_attachments;
DROP POLICY IF EXISTS "rfq_attachments_delete_via_draft" ON public.rfq_attachments;

CREATE POLICY "rfq_attachments_select_via_draft"
  ON public.rfq_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "rfq_attachments_insert_own"
  ON public.rfq_attachments FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id AND d.user_id = auth.uid()
    )
  );

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
  );

CREATE POLICY "rfq_attachments_delete_via_draft"
  ON public.rfq_attachments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id AND d.user_id = auth.uid()
    )
  );

-- Private bucket; server returns signed URLs. MIME left unrestricted; app validates types.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rfq-attachments',
  'rfq-attachments',
  false,
  26214400,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "rfq_attachments_storage_select_own" ON storage.objects;
DROP POLICY IF EXISTS "rfq_attachments_storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "rfq_attachments_storage_update_own" ON storage.objects;
DROP POLICY IF EXISTS "rfq_attachments_storage_delete_own" ON storage.objects;

CREATE POLICY "rfq_attachments_storage_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "rfq_attachments_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "rfq_attachments_storage_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "rfq_attachments_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'rfq-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
