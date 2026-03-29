-- Business verification: commercial register, tax card, personal ID → pending → admin verified.
-- RFQ requires business_verification_status = 'verified' (see feature_usable_under_enforcement).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_verification_status text NOT NULL DEFAULT 'none'
    CONSTRAINT profiles_business_verification_status_check
      CHECK (business_verification_status IN ('none', 'pending', 'verified', 'rejected'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_verification_reviewed_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_verification_admin_notes text;

CREATE INDEX IF NOT EXISTS profiles_business_verification_status_idx
  ON public.profiles (business_verification_status)
  WHERE business_verification_status IN ('pending', 'verified');

CREATE TABLE IF NOT EXISTS public.business_verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  document_type text NOT NULL
    CONSTRAINT business_verification_documents_type_check
      CHECK (document_type IN ('commercial_register', 'tax_card', 'personal_id')),
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  content_type text,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_verification_documents_user_type_unique UNIQUE (user_id, document_type)
);

CREATE INDEX IF NOT EXISTS business_verification_documents_user_id_idx
  ON public.business_verification_documents (user_id);

DROP TRIGGER IF EXISTS business_verification_documents_set_updated_at ON public.business_verification_documents;
CREATE TRIGGER business_verification_documents_set_updated_at
  BEFORE UPDATE ON public.business_verification_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.business_verification_documents IS 'KYC uploads; 3 types required before status pending.';

-- Keep profile status in sync when documents change (runs as invoking user).
CREATE OR REPLACE FUNCTION public.sync_business_verification_pending()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  uid uuid;
  c integer;
  st text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    uid := OLD.user_id;
  ELSE
    uid := NEW.user_id;
  END IF;

  SELECT business_verification_status INTO st FROM public.profiles WHERE id = uid;
  IF st = 'verified' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  SELECT count(DISTINCT document_type)::integer INTO c
  FROM public.business_verification_documents
  WHERE user_id = uid;

  IF c >= 3 THEN
    UPDATE public.profiles
    SET business_verification_status = 'pending', updated_at = now()
    WHERE id = uid
      AND business_verification_status IN ('none', 'rejected');
  ELSIF c < 3 THEN
    UPDATE public.profiles
    SET business_verification_status = 'none', updated_at = now()
    WHERE id = uid
      AND business_verification_status = 'pending';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_verification_docs_sync_pending ON public.business_verification_documents;
CREATE TRIGGER business_verification_docs_sync_pending
  AFTER INSERT OR UPDATE OR DELETE ON public.business_verification_documents
  FOR EACH ROW EXECUTE FUNCTION public.sync_business_verification_pending();

-- Block non-admins from forging verification outcome / admin fields.
CREATE OR REPLACE FUNCTION public.profiles_guard_business_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.business_verification_status IS DISTINCT FROM OLD.business_verification_status THEN
      IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true) THEN
        NULL;
      ELSIF NOT (
        NEW.business_verification_status = 'pending'
        AND OLD.business_verification_status IN ('none', 'rejected')
      ) THEN
        RAISE EXCEPTION 'forbidden verification change' USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW.business_verification_reviewed_at IS DISTINCT FROM OLD.business_verification_reviewed_at
       OR NEW.business_verification_admin_notes IS DISTINCT FROM OLD.business_verification_admin_notes THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true) THEN
        RAISE EXCEPTION 'forbidden admin fields' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_business_verification ON public.profiles;
CREATE TRIGGER profiles_guard_business_verification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_business_verification();

-- RFQ + verification: verified business + existing subscription/free-service rules.
CREATE OR REPLACE FUNCTION public.feature_usable_under_enforcement(p_user_id uuid, p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_feature = 'rfq' THEN
      EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = p_user_id AND pr.business_verification_status = 'verified'
      )
      AND (
        NOT public.subscriptions_enforcement_enabled()
        OR NOT public.subscription_service_requires_payment('rfq')
        OR public.user_has_active_subscription(p_user_id, 'rfq')
      )
    ELSE
      NOT public.subscriptions_enforcement_enabled()
      OR NOT public.subscription_service_requires_payment(p_feature)
      OR public.user_has_active_subscription(p_user_id, p_feature)
  END;
$$;

ALTER TABLE public.business_verification_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_verification_documents_select_own_or_admin" ON public.business_verification_documents;
CREATE POLICY "business_verification_documents_select_own_or_admin"
  ON public.business_verification_documents FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "business_verification_documents_insert_own" ON public.business_verification_documents;
CREATE POLICY "business_verification_documents_insert_own"
  ON public.business_verification_documents FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.business_verification_status IN ('none', 'pending', 'rejected')
    )
  );

DROP POLICY IF EXISTS "business_verification_documents_update_own" ON public.business_verification_documents;
CREATE POLICY "business_verification_documents_update_own"
  ON public.business_verification_documents FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.business_verification_status IN ('none', 'pending', 'rejected')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.business_verification_status IN ('none', 'pending', 'rejected')
    )
  );

DROP POLICY IF EXISTS "business_verification_documents_delete_own" ON public.business_verification_documents;
CREATE POLICY "business_verification_documents_delete_own"
  ON public.business_verification_documents FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.business_verification_status IN ('none', 'pending', 'rejected')
    )
  );

DROP POLICY IF EXISTS "business_verification_documents_delete_admin" ON public.business_verification_documents;
CREATE POLICY "business_verification_documents_delete_admin"
  ON public.business_verification_documents FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-verification',
  'business-verification',
  false,
  15728640,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "business_verification_storage_select_own" ON storage.objects;
CREATE POLICY "business_verification_storage_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'business-verification'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "business_verification_storage_select_admin" ON storage.objects;
CREATE POLICY "business_verification_storage_select_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'business-verification'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "business_verification_storage_insert_own" ON storage.objects;
CREATE POLICY "business_verification_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-verification'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "business_verification_storage_update_own" ON storage.objects;
CREATE POLICY "business_verification_storage_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'business-verification'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'business-verification'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "business_verification_storage_delete_own" ON storage.objects;
CREATE POLICY "business_verification_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'business-verification'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "business_verification_storage_delete_admin" ON storage.objects;
CREATE POLICY "business_verification_storage_delete_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'business-verification'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
