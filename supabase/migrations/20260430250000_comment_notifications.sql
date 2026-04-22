-- Comment & reply notifications table
CREATE TABLE public.comment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  actor_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('comment_on_post', 'reply_to_comment')),
  post_id uuid NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES public.feed_post_comments (id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comment_notifications_recipient_idx
  ON public.comment_notifications (recipient_user_id, read, created_at DESC);

ALTER TABLE public.comment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_notifications_select_own"
  ON public.comment_notifications FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY "comment_notifications_update_own"
  ON public.comment_notifications FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY "comment_notifications_insert_authenticated"
  ON public.comment_notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "comment_notifications_delete_own"
  ON public.comment_notifications FOR DELETE TO authenticated
  USING (recipient_user_id = auth.uid());

-- Enable Realtime for live bell updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_notifications;
