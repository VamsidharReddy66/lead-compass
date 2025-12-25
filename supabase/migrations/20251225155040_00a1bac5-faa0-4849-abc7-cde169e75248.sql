-- Add phone column to venture_agents for invitations by phone
ALTER TABLE public.venture_agents 
ADD COLUMN IF NOT EXISTS phone text;

-- Add unique constraint for phone + venture_id to prevent duplicate invitations
CREATE UNIQUE INDEX IF NOT EXISTS idx_venture_agents_phone_venture 
ON public.venture_agents (phone, venture_id) 
WHERE phone IS NOT NULL;

-- Update the link_pending_invitations function to also check by phone
CREATE OR REPLACE FUNCTION public.link_pending_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
BEGIN
  -- Find pending invitations for this email or phone
  FOR _invitation IN 
    SELECT id, venture_id FROM public.venture_agents 
    WHERE agent_id IS NULL 
      AND status = 'pending'
      AND (
        (email IS NOT NULL AND email = NEW.email) 
        OR (phone IS NOT NULL AND phone = NEW.phone)
      )
  LOOP
    -- Update the invitation with the new user's id
    UPDATE public.venture_agents 
    SET agent_id = NEW.id, 
        status = 'active', 
        joined_at = now()
    WHERE id = _invitation.id;
    
    -- Create venture_agent role for this user
    INSERT INTO public.user_roles (user_id, role, venture_id)
    VALUES (NEW.id, 'venture_agent', _invitation.venture_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;