-- New listings require admin approval before appearing in the public gallery (status = active).
-- Existing rows keep their current status (typically active).
--
-- Must be separate from the DEFAULT migration: Postgres forbids using a new enum value
-- in the same transaction it was added (55P04).

ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'pending';
