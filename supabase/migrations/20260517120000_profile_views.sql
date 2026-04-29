-- profile_views: track who viewed whose public profile.
-- One row per viewer+subject pair; repeated views update viewed_at.

CREATE TABLE IF NOT EXISTS public.profile_views (
  id            bigserial PRIMARY KEY,
  subject_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_views_subject_viewer_unique UNIQUE (subject_id, viewer_id),
  CONSTRAINT profile_views_no_self_view CHECK (subject_id <> viewer_id)
);

CREATE INDEX IF NOT EXISTS profile_views_subject_id_idx ON public.profile_views (subject_id, viewed_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Only the subject can read their own profile views.
CREATE POLICY "subject reads own profile views"
  ON public.profile_views FOR SELECT
  TO authenticated
  USING (subject_id = auth.uid());

-- Authenticated viewers can insert / upsert their own view row.
CREATE POLICY "viewer can insert own view"
  ON public.profile_views FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = auth.uid() AND subject_id <> auth.uid());

-- Viewers can update the viewed_at timestamp on their own row.
CREATE POLICY "viewer can update own view"
  ON public.profile_views FOR UPDATE
  TO authenticated
  USING (viewer_id = auth.uid())
  WITH CHECK (viewer_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: record_profile_view(p_subject_id)
--   Upserts a view row for the current user. Returns false if not logged in,
--   or if the subject is the caller themselves.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_profile_view(p_subject_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer uuid := auth.uid();
BEGIN
  IF v_viewer IS NULL THEN
    RETURN false;
  END IF;

  IF v_viewer = p_subject_id THEN
    RETURN false;
  END IF;

  -- Subject profile must exist.
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_subject_id) THEN
    RETURN false;
  END IF;

  INSERT INTO public.profile_views (subject_id, viewer_id, viewed_at)
  VALUES (p_subject_id, v_viewer, now())
  ON CONFLICT (subject_id, viewer_id)
  DO UPDATE SET viewed_at = now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_profile_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_profile_view(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: get_profile_viewers(p_limit, p_offset)
--   Returns the viewers of the calling user's profile, most-recent first,
--   joined with public profile data (name, avatar, user_type, verification).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_profile_viewers(
  p_limit  int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  viewer_id                    uuid,
  viewed_at                    timestamptz,
  full_name                    text,
  avatar_url                   text,
  user_type                    text,
  business_verification_status text,
  expert_verification_status   text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subject uuid := auth.uid();
BEGIN
  IF v_subject IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pv.viewer_id,
    pv.viewed_at,
    p.full_name::text,
    p.avatar_url::text,
    p.user_type::text,
    p.business_verification_status::text,
    p.expert_verification_status::text
  FROM public.profile_views pv
  JOIN public.profiles p ON p.id = pv.viewer_id
  WHERE pv.subject_id = v_subject
  ORDER BY pv.viewed_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_profile_viewers(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_viewers(int, int) TO authenticated;
