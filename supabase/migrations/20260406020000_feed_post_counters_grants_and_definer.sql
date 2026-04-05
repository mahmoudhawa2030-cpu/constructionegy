-- 1) Supabase/PostgREST: without EXECUTE for authenticated, rpc("feed_post_recount") fails silently in the app.
REVOKE ALL ON FUNCTION public.feed_post_recount(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feed_post_recount(uuid) TO authenticated;

-- 2) Counter triggers UPDATE feed_posts. RLS only allows the post owner (or admin) to update that row,
-- so when another user likes or comments the trigger ran as them and the UPDATE was blocked.
-- SECURITY DEFINER runs the trigger body with the function owner's privileges so counts stay correct.

CREATE OR REPLACE FUNCTION public.feed_posts_apply_like_delta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;

  UPDATE public.feed_posts
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.feed_posts_apply_comment_delta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;

  UPDATE public.feed_posts
  SET comment_count = GREATEST(0, comment_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;
