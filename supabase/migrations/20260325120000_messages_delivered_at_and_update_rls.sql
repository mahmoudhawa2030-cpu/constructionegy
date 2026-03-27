-- Delivery + read receipts (WhatsApp-style ticks). Recipient sets delivered_at / read_at only.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

COMMENT ON COLUMN public.messages.delivered_at IS 'Recipient device received the message (double gray tick).';
COMMENT ON COLUMN public.messages.read_at IS 'Recipient read the message (double blue tick).';

-- Supabase Realtime: broadcast UPDATE payload for tick changes
ALTER TABLE public.messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "messages_update_read_own_chat" ON public.messages;
DROP POLICY IF EXISTS "messages_update_recipient_receipts" ON public.messages;

-- Only the *other* participant (not the sender) can update delivery/read columns
CREATE POLICY "messages_update_recipient_receipts"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  )
  WITH CHECK (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );
