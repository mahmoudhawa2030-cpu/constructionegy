-- Simplify RFQ module per requirements: dedicated fields instead of metadata/spreadsheet items.
-- Only subscription required (remove business verification gate from feature_usable_under_enforcement).
-- Add structured columns for title/description/location/closing_date (metadata remains for extensibility).
-- Update policies/comments. Run `npm run gen:types` after to refresh types.

-- Add new columns to rfq_drafts
ALTER TABLE public.rfq_drafts
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS closing_date timestamptz;

COMMENT ON COLUMN public.rfq_drafts.description IS 'Main RFQ description (up to ~3000 words / 15k chars). Replaces complex rfq_items/spreadsheet for simplified creation.';
COMMENT ON COLUMN public.rfq_drafts.location IS 'Project/location for the RFQ (e.g. Cairo, Alexandria).';
COMMENT ON COLUMN public.rfq_drafts.closing_date IS 'Deadline for bids. Creator can reopen after close.';

CREATE INDEX IF NOT EXISTS idx_rfq_drafts_closing_date ON public.rfq_drafts (closing_date);
CREATE INDEX IF NOT EXISTS idx_rfq_drafts_status_location ON public.rfq_drafts (status, location);

-- Update function: now purely subscription-based for ALL features (RFQ is subscription-only).
-- Use CASCADE because many RLS policies (rfq_*, listings, live_map_pins, storage, etc.) depend on it.
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

COMMENT ON FUNCTION public.feature_usable_under_enforcement(uuid, text) IS 'Returns true if user can use the feature under current enforcement rules. RFQ now subscription-only (no business verification). Updated 2026-05-01.';

-- Ensure RLS policies for rfq_drafts use the updated function (re-create key ones for safety).
-- Open read policy for others
DROP POLICY IF EXISTS "rfq_drafts_select_open_to_others" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_select_open_to_others"
  ON public.rfq_drafts FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND status IN ('open_for_bids')
    AND user_id <> auth.uid()
  );

-- Owner policies already use the function via earlier migrations; they will pick up the change.

-- Note: rfq_items table is deprecated for new simplified UI (no more spreadsheet line items).
-- Existing data preserved; new RFQs will use description field instead.
-- Future cleanup migration can drop rfq_items if no longer needed.

-- Update any open read policies for items/attachments to use status = 'open_for_bids' (align with reopen).
DROP POLICY IF EXISTS "rfq_items_select_open_rfq" ON public.rfq_items;
CREATE POLICY "rfq_items_select_open_rfq" ON public.rfq_items FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_items.draft_id
        AND d.status IN ('open_for_bids')
    )
  );

-- Similar for attachments (keep for backward compat)
DROP POLICY IF EXISTS "rfq_attachments_select_open_rfq" ON public.rfq_attachments;
CREATE POLICY "rfq_attachments_select_open_rfq" ON public.rfq_attachments FOR SELECT TO authenticated
  USING (
    public.feature_usable_under_enforcement(auth.uid(), 'rfq')
    AND EXISTS (
      SELECT 1 FROM public.rfq_drafts d
      WHERE d.id = rfq_attachments.draft_id
        AND d.status IN ('open_for_bids')
    )
  );
