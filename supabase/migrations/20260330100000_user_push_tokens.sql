-- Device tokens for FCM/APNs via Capacitor (Android/iOS). Server sends pushes on new messages.

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS user_push_tokens_user_id_idx ON public.user_push_tokens (user_id);

COMMENT ON TABLE public.user_push_tokens IS 'One row per device token; used to notify users of new chat messages.';

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_push_tokens_select_own" ON public.user_push_tokens;
DROP POLICY IF EXISTS "user_push_tokens_insert_own" ON public.user_push_tokens;
DROP POLICY IF EXISTS "user_push_tokens_update_own" ON public.user_push_tokens;
DROP POLICY IF EXISTS "user_push_tokens_delete_own" ON public.user_push_tokens;

CREATE POLICY "user_push_tokens_select_own"
  ON public.user_push_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_push_tokens_insert_own"
  ON public.user_push_tokens FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_push_tokens_update_own"
  ON public.user_push_tokens FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_push_tokens_delete_own"
  ON public.user_push_tokens FOR DELETE TO authenticated
  USING (user_id = auth.uid());
