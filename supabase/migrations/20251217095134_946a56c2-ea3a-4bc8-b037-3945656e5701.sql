-- Create meetings table for scheduling
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'follow-up' CHECK (meeting_type IN ('follow-up', 'site-visit', 'call', 'meeting')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Agents can view their own meetings
CREATE POLICY "Agents can view their own meetings" ON public.meetings
  FOR SELECT USING (auth.uid() = agent_id);

-- Agents can create their own meetings
CREATE POLICY "Agents can create their own meetings" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Agents can update their own meetings
CREATE POLICY "Agents can update their own meetings" ON public.meetings
  FOR UPDATE USING (auth.uid() = agent_id);

-- Agents can delete their own meetings
CREATE POLICY "Agents can delete their own meetings" ON public.meetings
  FOR DELETE USING (auth.uid() = agent_id);

-- Venture admins can view all meetings in their venture
CREATE POLICY "Venture admins can view venture meetings" ON public.meetings
  FOR SELECT USING (venture_id = public.get_user_venture_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for meetings
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;