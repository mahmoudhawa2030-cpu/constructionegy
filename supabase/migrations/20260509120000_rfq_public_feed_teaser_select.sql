-- Home feed (/): latest public RFQ teaser for guests and signed-in users.
-- Status values align with rfq_drafts_status_check and open-marketplace RLS elsewhere.

DROP POLICY IF EXISTS "rfq_drafts_select_public_feed_teaser" ON public.rfq_drafts;
CREATE POLICY "rfq_drafts_select_public_feed_teaser"
  ON public.rfq_drafts FOR SELECT
  TO anon, authenticated
  USING (status IN ('submitted', 'open_for_bids'));
