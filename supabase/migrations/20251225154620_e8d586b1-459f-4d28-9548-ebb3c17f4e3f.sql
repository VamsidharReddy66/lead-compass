-- Add email column to venture_agents for pending invitations
ALTER TABLE public.venture_agents 
ADD COLUMN email text;

-- Make agent_id nullable for pending invitations
ALTER TABLE public.venture_agents 
ALTER COLUMN agent_id DROP NOT NULL;

-- Add unique constraint for email + venture_id to prevent duplicate invitations
CREATE UNIQUE INDEX idx_venture_agents_email_venture 
ON public.venture_agents (email, venture_id) 
WHERE email IS NOT NULL;

-- Update RLS policy for venture admins to also check by email
DROP POLICY IF EXISTS "Venture admins can manage their agents" ON public.venture_agents;
CREATE POLICY "Venture admins can manage their agents" 
ON public.venture_agents 
FOR ALL 
USING (venture_id = get_user_venture_id(auth.uid()));

-- Create function to link pending invitations when agent signs up
CREATE OR REPLACE FUNCTION public.link_pending_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
BEGIN
  -- Find pending invitations for this email
  FOR _invitation IN 
    SELECT id, venture_id FROM public.venture_agents 
    WHERE email = NEW.email AND agent_id IS NULL AND status = 'pending'
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

-- Create trigger to run after profile is created
CREATE TRIGGER on_profile_created_link_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_pending_invitations();