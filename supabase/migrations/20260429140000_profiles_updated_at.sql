-- profiles.updated_at: required by business verification sync triggers and admin updates.
-- Original marketplace schema only had created_at on profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.profiles
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.profiles
  ALTER COLUMN updated_at SET NOT NULL;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON COLUMN public.profiles.updated_at IS 'Row last update; maintained by set_updated_at trigger.';
