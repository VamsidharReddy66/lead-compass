import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Meeting {
  id: string;
  lead_id: string;
  agent_id: string;
  title: string;
  description: string | null;
  meeting_type: 'follow-up' | 'site-visit' | 'call' | 'meeting';
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingInput {
  lead_id: string;
  title: string;
  description?: string;
  meeting_type: 'follow-up' | 'site-visit' | 'call' | 'meeting';
  scheduled_at: string;
  duration_minutes?: number;
  location?: string;
}

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMeetings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setMeetings(data as Meeting[]);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load meetings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (input: CreateMeetingInput) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          ...input,
          agent_id: user.id, // ✅ ONLY VALID EXTRA FIELD
        })
        .select()
        .single();

      if (error) throw error;

      setMeetings((prev) => [...prev, data as Meeting]);
      toast({
        title: 'Meeting scheduled',
        description: 'Meeting scheduled successfully',
      });

      return data as Meeting;
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule meeting',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter((m) => {
      const d = new Date(m.scheduled_at);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
  };

  useEffect(() => {
    fetchMeetings();
  }, [user]);

  // Real-time subscription for meetings updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        fetchMeetings
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    meetings,
    loading,
    createMeeting,
    getMeetingsForDate,
    refetch: fetchMeetings,
  };
};
