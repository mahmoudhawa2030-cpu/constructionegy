-- Owner can set listings to "paused": hidden from public catalog, still visible on own ads page.
-- No extra columns: resume always returns listing to "active" (pause is only allowed from "active").

ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'paused';

-- Remove column if an older app revision added it (not used anymore).
ALTER TABLE public.listings DROP COLUMN IF EXISTS status_before_pause;
