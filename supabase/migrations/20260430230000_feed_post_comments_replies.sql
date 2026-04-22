-- Add parent_id to support threaded (Facebook-style) replies on feed post comments.
-- A NULL parent_id means a top-level comment; a non-NULL parent_id is a reply to that comment.

ALTER TABLE public.feed_post_comments
  ADD COLUMN parent_id uuid REFERENCES public.feed_post_comments (id) ON DELETE CASCADE;

CREATE INDEX feed_post_comments_parent_idx
  ON public.feed_post_comments (parent_id)
  WHERE parent_id IS NOT NULL;
