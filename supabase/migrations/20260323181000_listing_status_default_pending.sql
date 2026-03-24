-- Depends on 20260323180000 (enum value added in a prior committed migration).

ALTER TABLE public.listings
  ALTER COLUMN status SET DEFAULT 'pending';
