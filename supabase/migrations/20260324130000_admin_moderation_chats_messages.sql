-- Allow admins to read all chats and messages (moderation / offensive content review).
-- SELECT policies are OR'd with existing participant policies.

CREATE POLICY "chats_select_admin"
  ON public.chats FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "messages_select_admin"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
