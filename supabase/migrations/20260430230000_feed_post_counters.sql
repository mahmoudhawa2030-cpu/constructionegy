-- Denormalized counters for faster feed rendering.

ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0 CHECK (comment_count >= 0);

UPDATE public.feed_posts p
SET
  like_count = COALESCE(src.like_count, 0),
  comment_count = COALESCE(src.comment_count, 0)
FROM (
  SELECT
    fp.id,
    COALESCE(l.like_count, 0) AS like_count,
    COALESCE(c.comment_count, 0) AS comment_count
  FROM public.feed_posts fp
  LEFT JOIN (
    SELECT post_id, count(*)::integer AS like_count
    FROM public.feed_post_likes
    GROUP BY post_id
  ) l ON l.post_id = fp.id
  LEFT JOIN (
    SELECT post_id, count(*)::integer AS comment_count
    FROM public.feed_post_comments
    GROUP BY post_id
  ) c ON c.post_id = fp.id
) AS src
WHERE src.id = p.id;

CREATE OR REPLACE FUNCTION public.feed_posts_apply_like_delta()
RETURNS trigger
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS feed_posts_like_counter_insert ON public.feed_post_likes;
CREATE TRIGGER feed_posts_like_counter_insert
  AFTER INSERT ON public.feed_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.feed_posts_apply_like_delta();

DROP TRIGGER IF EXISTS feed_posts_like_counter_delete ON public.feed_post_likes;
CREATE TRIGGER feed_posts_like_counter_delete
  AFTER DELETE ON public.feed_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.feed_posts_apply_like_delta();

DROP TRIGGER IF EXISTS feed_posts_comment_counter_insert ON public.feed_post_comments;
CREATE TRIGGER feed_posts_comment_counter_insert
  AFTER INSERT ON public.feed_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.feed_posts_apply_comment_delta();

DROP TRIGGER IF EXISTS feed_posts_comment_counter_delete ON public.feed_post_comments;
CREATE TRIGGER feed_posts_comment_counter_delete
  AFTER DELETE ON public.feed_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.feed_posts_apply_comment_delta();
