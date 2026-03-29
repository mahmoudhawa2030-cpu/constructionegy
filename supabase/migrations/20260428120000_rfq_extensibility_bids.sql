-- RFQ extensibility: draft metadata JSON, richer lifecycle statuses, supplier bids scaffold + RLS.
-- Add columns/policies in one migration so new features (invites, line-level quotes, awards) can build on stable shapes.

-- 1) Draft metadata for app-specific keys without schema churn (deadlines, site_id, external refs, etc.)
ALTER TABLE public.rfq_drafts
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.rfq_drafts.metadata IS 'Extensible JSON for RFQ-specific fields; keep structured columns for query-heavy paths.';

-- 2) Widen lifecycle without breaking existing rows (draft / submitted / archived already in use)
ALTER TABLE public.rfq_drafts DROP CONSTRAINT IF EXISTS rfq_drafts_status_check;
ALTER TABLE public.rfq_drafts ADD CONSTRAINT rfq_drafts_status_check CHECK (
  status IN (
    'draft',
    'submitted',
    'archived',
    'open_for_bids',
    'closed',
    'awarded'
  )
);

-- 3) Supplier bids (one row per supplier per RFQ draft); extend via metadata + new columns later
CREATE TABLE IF NOT EXISTS public.rfq_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES public.rfq_drafts (id) ON DELETE CASCADE,
  supplier_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'withdrawn', 'accepted', 'rejected')),
  total_amount numeric(18, 4),
  currency text NOT NULL DEFAULT 'EGP',
  supplier_notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rfq_bids_draft_supplier_unique UNIQUE (draft_id, supplier_user_id)
);

CREATE INDEX IF NOT EXISTS rfq_bids_draft_id_idx ON public.rfq_bids (draft_id);
CREATE INDEX IF NOT EXISTS rfq_bids_supplier_user_id_idx ON public.rfq_bids (supplier_user_id);

COMMENT ON TABLE public.rfq_bids IS 'Supplier responses to an RFQ; line-item pricing can move to rfq_bid_lines later.';
COMMENT ON COLUMN public.rfq_bids.metadata IS 'Future: breakdown, attachments refs, validity dates, etc.';

DROP TRIGGER IF EXISTS rfq_bids_set_updated_at ON public.rfq_bids;
CREATE TRIGGER rfq_bids_set_updated_at
  BEFORE UPDATE ON public.rfq_bids
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rfq_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfq_bids_select_bidder_or_buyer" ON public.rfq_bids;
CREATE POLICY "rfq_bids_select_bidder_or_buyer"
  ON public.rfq_bids FOR SELECT TO authenticated
  USING (
    supplier_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_bids.draft_id AND d.user_id = auth.uid()
    )
  );

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
