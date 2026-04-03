-- Likes, saves (bookmarks), and comments on feed posts

CREATE TABLE public.feed_post_likes (
  post_id uuid NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.feed_post_saves (
  post_id uuid NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.feed_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feed_post_comments_body_nonempty CHECK (char_length(trim(body)) > 0),
  CONSTRAINT feed_post_comments_body_max CHECK (char_length(body) <= 2000)
);

CREATE INDEX feed_post_comments_post_created_idx
  ON public.feed_post_comments (post_id, created_at DESC);

ALTER TABLE public.feed_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_post_likes_select_all"
  ON public.feed_post_likes FOR SELECT
  USING (true);

CREATE POLICY "feed_post_likes_insert_own"
  ON public.feed_post_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "feed_post_likes_delete_own"
  ON public.feed_post_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "feed_post_saves_select_all"
  ON public.feed_post_saves FOR SELECT
  USING (true);

CREATE POLICY "feed_post_saves_insert_own"
  ON public.feed_post_saves FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "feed_post_saves_delete_own"
  ON public.feed_post_saves FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "feed_post_comments_select_published_post"
  ON public.feed_post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.feed_posts p
      WHERE p.id = feed_post_comments.post_id AND p.status = 'published'::public.feed_post_status
    )
  );

CREATE POLICY "feed_post_comments_insert_own_published"
  ON public.feed_post_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.feed_posts p
      WHERE p.id = post_id AND p.status = 'published'::public.feed_post_status
    )
  );

CREATE POLICY "feed_post_comments_delete_own"
  ON public.feed_post_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());
