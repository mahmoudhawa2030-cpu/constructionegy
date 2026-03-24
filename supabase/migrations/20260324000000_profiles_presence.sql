-- Presence / activity timestamps for Option A (heartbeat + admin filters).
-- last_seen_at: updated on heartbeat while the app is open (online detection).
-- last_active_at: same updates for now (filters: day, week, month, etc.).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

COMMENT ON COLUMN public.profiles.last_seen_at IS 'Last client heartbeat (tab open, logged in).';
COMMENT ON COLUMN public.profiles.last_active_at IS 'Last activity ping; used for admin "active in period" filters.';

CREATE INDEX IF NOT EXISTS profiles_last_seen_at_idx
  ON public.profiles (last_seen_at DESC)
  WHERE last_seen_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_last_active_at_idx
  ON public.profiles (last_active_at DESC)
  WHERE last_active_at IS NOT NULL;
