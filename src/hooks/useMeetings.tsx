import { useState, useEffect, useCallback } from 'react';
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

  const fetchMeetings = useCallback(async () => {
    if (!user) {
      setMeetings([]);
      setLoading(false);
      return;
    }

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
  }, [user, toast]);

  const createMeeting = async (input: CreateMeetingInput) => {
    if (!user) return null;

    try {
      // Check if lead already has an active scheduled meeting
      const existingMeeting = meetings.find(
        (m) => m.lead_id === input.lead_id && m.status === 'scheduled'
      );

      if (existingMeeting) {
        toast({
          title: 'Meeting exists',
          description: 'This lead already has a scheduled meeting. Please complete or reschedule the existing meeting first.',
          variant: 'destructive',
        });
        return null;
      }

      const { data, error } = await supabase
        .from('meetings')
        .insert({
          ...input,
          agent_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistically update local state
      setMeetings((prev) => [...prev, data as Meeting].sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ));
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

  const updateMeetingStatus = async (meetingId: string, status: Meeting['status']) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status })
        .eq('id', meetingId);

      if (error) throw error;

      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, status } : m))
      );
      return true;
    } catch (error) {
      console.error('Error updating meeting status:', error);
      return false;
    }
  };

  const rescheduleMeeting = async (meetingId: string, newScheduledAt: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('meetings')
        .update({ scheduled_at: newScheduledAt, status: 'scheduled' })
        .eq('id', meetingId);

      if (error) throw error;

      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId
            ? { ...m, scheduled_at: newScheduledAt, status: 'scheduled' as const }
            : m
        ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      );
      toast({
        title: 'Meeting rescheduled',
        description: 'Meeting has been rescheduled successfully',
      });
      return true;
    } catch (error) {
      console.error('Error rescheduling meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to reschedule meeting',
        variant: 'destructive',
      });
      return false;
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
  }, [fetchMeetings]);

  // Real-time subscription for meetings updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meetings' },
        (payload) => {
          const newMeeting = payload.new as Meeting;
          setMeetings((prev) => {
            if (prev.some((m) => m.id === newMeeting.id)) return prev;
            return [...prev, newMeeting].sort(
              (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            );
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meetings' },
        (payload) => {
          const updated = payload.new as Meeting;
          setMeetings((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'meetings' },
        (payload) => {
          const deleted = payload.old as { id: string };
          setMeetings((prev) => prev.filter((m) => m.id !== deleted.id));
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
    updateMeetingStatus,
    rescheduleMeeting,
    getMeetingsForDate,
    refetch: fetchMeetings,
  };
};
