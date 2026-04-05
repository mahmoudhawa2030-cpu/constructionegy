-- Manual helper to get current like count (used as fallback if trigger is broken)
CREATE OR REPLACE FUNCTION public.feed_posts_get_like_count(p_post_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(count(*), 0)::integer
  FROM public.feed_post_likes
  WHERE post_id = p_post_id;
$$;

-- Also for comments
CREATE OR REPLACE FUNCTION public.feed_posts_get_comment_count(p_post_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(count(*), 0)::integer
  FROM public.feed_post_comments
  WHERE post_id = p_post_id;
$$;
