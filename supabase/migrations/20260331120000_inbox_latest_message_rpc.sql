-- Latest row per chat for inbox ordering (incoming + outgoing), one round-trip from the app.

CREATE OR REPLACE FUNCTION public.inbox_latest_message_rows(p_chat_ids uuid[])
RETURNS TABLE (chat_id uuid, content text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT ON (m.chat_id) m.chat_id, m.content, m.created_at
  FROM public.messages m
  WHERE m.chat_id = ANY(p_chat_ids)
  ORDER BY m.chat_id, m.created_at DESC;
$$;

COMMENT ON FUNCTION public.inbox_latest_message_rows IS 'Used by Next.js inbox: last activity per chat (any sender), WhatsApp-style sort.';

GRANT EXECUTE ON FUNCTION public.inbox_latest_message_rows(uuid[]) TO authenticated;
