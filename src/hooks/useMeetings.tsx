import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Meeting {
  id: string;
  lead_id: string;
  agent_id: string;
  venture_id: string | null;
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
  const { user, profile } = useAuth();
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
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching meetings:', error);
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
          agent_id: user.id,
          venture_id: profile?.venture_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      setMeetings(prev => [...prev, data as Meeting]);
      toast({
        title: 'Meeting scheduled',
        description: 'Your meeting has been scheduled successfully',
      });
      return data as Meeting;
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error creating meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule meeting',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setMeetings(prev => prev.map(m => m.id === id ? data as Meeting : m));
      toast({
        title: 'Meeting updated',
        description: 'Your meeting has been updated',
      });
      return data as Meeting;
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error updating meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update meeting',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMeetings(prev => prev.filter(m => m.id !== id));
      toast({
        title: 'Meeting deleted',
        description: 'Your meeting has been removed',
      });
      return true;
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error deleting meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete meeting',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return (
        meetingDate.getFullYear() === date.getFullYear() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getDate() === date.getDate()
      );
    });
  };

  useEffect(() => {
    fetchMeetings();
  }, [user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        () => {
          fetchMeetings();
        }
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
    updateMeeting,
    deleteMeeting,
    getMeetingsForDate,
    refetch: fetchMeetings,
  };
};
