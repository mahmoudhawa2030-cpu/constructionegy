-- RankMath-style Redirection Manager + 404 Monitor.

CREATE TABLE public.redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path text NOT NULL,
  destination_path text NOT NULL,
  status_code integer NOT NULL DEFAULT 301,
  is_active boolean NOT NULL DEFAULT true,
  hit_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT redirects_source_path_unique UNIQUE (source_path),
  CONSTRAINT redirects_status_code_check CHECK (status_code IN (301, 302, 307, 308)),
  CONSTRAINT redirects_source_path_format CHECK (source_path ~ '^/')
);

CREATE INDEX redirects_active_idx ON public.redirects (source_path) WHERE is_active = true;

CREATE TRIGGER redirects_updated_at
  BEFORE UPDATE ON public.redirects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "redirects_select_admin"
  ON public.redirects FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "redirects_insert_admin"
  ON public.redirects FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "redirects_update_admin"
  ON public.redirects FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "redirects_delete_admin"
  ON public.redirects FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Resolve + hit-count an active redirect for a given path. Runs as anon from proxy.ts,
-- so it must be SECURITY DEFINER to bypass RLS (table itself is admin-only for direct access).
CREATE OR REPLACE FUNCTION public.resolve_redirect(p_path text)
RETURNS TABLE (destination_path text, status_code integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.redirects r
  SET hit_count = r.hit_count + 1
  WHERE r.source_path = p_path AND r.is_active = true
  RETURNING r.destination_path, r.status_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_redirect(text) TO anon, authenticated;

-- 404 monitor: aggregated hit log, keyed by path.
CREATE TABLE public.not_found_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  hit_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ignored boolean NOT NULL DEFAULT false,
  CONSTRAINT not_found_log_path_unique UNIQUE (path)
);

CREATE INDEX not_found_log_last_seen_idx ON public.not_found_log (last_seen_at DESC);

ALTER TABLE public.not_found_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "not_found_log_select_admin"
  ON public.not_found_log FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "not_found_log_update_admin"
  ON public.not_found_log FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "not_found_log_delete_admin"
  ON public.not_found_log FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Log (or bump) a 404 hit. SECURITY DEFINER so anon visitors can log misses
-- without any direct table grants.
CREATE OR REPLACE FUNCTION public.log_not_found(p_path text, p_referrer text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.not_found_log (path, referrer, hit_count, last_seen_at)
  VALUES (p_path, p_referrer, 1, now())
  ON CONFLICT (path) DO UPDATE
    SET hit_count = public.not_found_log.hit_count + 1,
        last_seen_at = now(),
        referrer = COALESCE(EXCLUDED.referrer, public.not_found_log.referrer);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_not_found(text, text) TO anon, authenticated;
