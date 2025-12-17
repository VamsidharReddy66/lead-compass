-- Create enums for lead fields
CREATE TYPE public.lead_status AS ENUM (
  'new', 'contacted', 'site-visit-scheduled', 'site-visit-completed', 
  'negotiation', 'closed', 'lost'
);

CREATE TYPE public.property_type AS ENUM ('plot', 'flat', 'villa', 'commercial');

CREATE TYPE public.lead_source AS ENUM (
  'portal', 'referral', 'walk-in', 'social-media', 'web-form', 
  'whatsapp', 'facebook', 'other'
);

CREATE TYPE public.lead_temperature AS ENUM ('hot', 'warm', 'cold');

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  property_type property_type NOT NULL DEFAULT 'flat',
  budget_min NUMERIC DEFAULT 0,
  budget_max NUMERIC DEFAULT 0,
  location_preference TEXT,
  source lead_source NOT NULL DEFAULT 'other',
  assigned_agent_id UUID NOT NULL,
  venture_id UUID REFERENCES public.ventures(id),
  status lead_status NOT NULL DEFAULT 'new',
  follow_up_date DATE,
  follow_up_time TIME,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  temperature lead_temperature NOT NULL DEFAULT 'warm',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Agents can view their own leads
CREATE POLICY "Agents can view their own leads"
ON public.leads FOR SELECT
USING (auth.uid() = assigned_agent_id);

-- Agents can create leads for themselves
CREATE POLICY "Agents can create their own leads"
ON public.leads FOR INSERT
WITH CHECK (auth.uid() = assigned_agent_id);

-- Agents can update their own leads
CREATE POLICY "Agents can update their own leads"
ON public.leads FOR UPDATE
USING (auth.uid() = assigned_agent_id);

-- Agents can delete their own leads
CREATE POLICY "Agents can delete their own leads"
ON public.leads FOR DELETE
USING (auth.uid() = assigned_agent_id);

-- Venture admins can view all venture leads
CREATE POLICY "Venture admins can view venture leads"
ON public.leads FOR SELECT
USING (venture_id = get_user_venture_id(auth.uid()));

-- Venture admins can manage venture leads
CREATE POLICY "Venture admins can manage venture leads"
ON public.leads FOR ALL
USING (venture_id = get_user_venture_id(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- Add foreign key for meetings to leads
ALTER TABLE public.meetings 
ADD CONSTRAINT meetings_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;