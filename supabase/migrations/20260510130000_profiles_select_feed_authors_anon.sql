-- Allow guests to read profile rows for users who have at least one published feed post,
-- so home feed cards can show author name / verification (requested columns only via PostgREST).

DROP POLICY IF EXISTS "profiles_select_feed_authors_anon" ON public.profiles;
CREATE POLICY "profiles_select_feed_authors_anon"
  ON public.profiles FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.feed_posts fp
      WHERE fp.user_id = profiles.id
        AND fp.status = 'published'::public.feed_post_status
    )
  );
