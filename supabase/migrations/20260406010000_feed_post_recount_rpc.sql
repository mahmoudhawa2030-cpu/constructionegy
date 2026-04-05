-- RPC to recount like_count and comment_count on a feed post.
-- Runs as SECURITY DEFINER so any authenticated user can trigger the recount
-- (e.g. after liking or commenting on someone else's post).

CREATE OR REPLACE FUNCTION public.feed_post_recount(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes integer;
  v_comments integer;
BEGIN
  SELECT COALESCE(count(*), 0)::integer INTO v_likes
    FROM public.feed_post_likes WHERE post_id = p_post_id;

  SELECT COALESCE(count(*), 0)::integer INTO v_comments
    FROM public.feed_post_comments WHERE post_id = p_post_id;

  UPDATE public.feed_posts
    SET like_count = v_likes, comment_count = v_comments
    WHERE id = p_post_id;
END;
$$;

REVOKE ALL ON FUNCTION public.feed_post_recount(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feed_post_recount(uuid) TO authenticated;
