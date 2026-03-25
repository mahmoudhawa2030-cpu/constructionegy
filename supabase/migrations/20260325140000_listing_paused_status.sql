-- Owner can "pause" listings: hidden from public catalog but still visible on own ads page.

ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'paused';

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS status_before_pause public.listing_status;

COMMENT ON COLUMN public.listings.status_before_pause IS
  'When status = paused, stores the previous status so resume can restore (active or pending).';
