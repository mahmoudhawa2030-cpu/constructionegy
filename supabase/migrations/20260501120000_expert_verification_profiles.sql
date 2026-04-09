-- Industry expert verification (separate from business_verification_*).
-- Users apply (pending + credentials); admins approve/reject.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expert_verification_status text NOT NULL DEFAULT 'none'
    CONSTRAINT profiles_expert_verification_status_check
      CHECK (expert_verification_status IN ('none', 'pending', 'verified', 'rejected'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expert_verification_reviewed_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expert_verification_admin_notes text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expert_credentials_summary text;

COMMENT ON COLUMN public.profiles.expert_credentials_summary IS 'User-submitted credentials / expertise summary for admin review.';
COMMENT ON COLUMN public.profiles.expert_verification_admin_notes IS 'Rejection or internal admin notes; visible to user on reject.';

CREATE INDEX IF NOT EXISTS profiles_expert_verification_pending_idx
  ON public.profiles (updated_at DESC)
  WHERE expert_verification_status = 'pending';

CREATE OR REPLACE FUNCTION public.profiles_guard_expert_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  adm boolean;
BEGIN
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  ) INTO adm;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.expert_verification_status IS DISTINCT FROM OLD.expert_verification_status THEN
      IF adm THEN
        NULL;
      ELSIF NOT (
        NEW.expert_verification_status = 'pending'
        AND OLD.expert_verification_status IN ('none', 'rejected')
      ) THEN
        RAISE EXCEPTION 'forbidden expert verification change' USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW.expert_verification_reviewed_at IS DISTINCT FROM OLD.expert_verification_reviewed_at
       OR NEW.expert_verification_admin_notes IS DISTINCT FROM OLD.expert_verification_admin_notes THEN
      IF NOT adm THEN
        RAISE EXCEPTION 'forbidden expert admin fields' USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW.expert_credentials_summary IS DISTINCT FROM OLD.expert_credentials_summary THEN
      IF NOT adm THEN
        IF OLD.expert_verification_status NOT IN ('none', 'rejected') THEN
          RAISE EXCEPTION 'forbidden expert credentials change' USING ERRCODE = '42501';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_expert_verification ON public.profiles;
CREATE TRIGGER profiles_guard_expert_verification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_expert_verification();
