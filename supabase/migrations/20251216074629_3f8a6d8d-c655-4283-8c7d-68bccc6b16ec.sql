-- Allow venture admins to insert roles for agents in their venture
CREATE POLICY "Venture admins can add roles for their agents" ON public.user_roles
  FOR INSERT WITH CHECK (
    venture_id = public.get_user_venture_id(auth.uid())
    AND role = 'venture_agent'
  );