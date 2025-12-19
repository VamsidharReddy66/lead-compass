-- Create activities table for lead activity tracking
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'note',
  description TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activities
CREATE POLICY "Agents can view activities for their leads"
ON public.activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = activities.lead_id
    AND leads.assigned_agent_id = auth.uid()
  )
);

CREATE POLICY "Agents can create activities for their leads"
ON public.activities
FOR INSERT
WITH CHECK (
  auth.uid() = agent_id AND
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = activities.lead_id
    AND leads.assigned_agent_id = auth.uid()
  )
);

CREATE POLICY "Venture admins can view activities for venture leads"
ON public.activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = activities.lead_id
    AND leads.venture_id = get_user_venture_id(auth.uid())
  )
);

-- Create index for faster queries
CREATE INDEX idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);

-- Enable realtime for activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;