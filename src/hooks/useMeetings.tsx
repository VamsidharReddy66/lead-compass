import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
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

/* ------------------------------------------------------------------
   Shared in-memory store
   Fixes: when multiple pages/components call useMeetings(), they now
   observe the same meetings list and update immediately.
-------------------------------------------------------------------*/

type MeetingsListener = () => void;

let meetingsState: Meeting[] = [];
const meetingsListeners = new Set<MeetingsListener>();

const getMeetingsState = () => meetingsState;

const setMeetingsState = (next: Meeting[] | ((prev: Meeting[]) => Meeting[])) => {
  meetingsState = typeof next === 'function' ? (next as (p: Meeting[]) => Meeting[])(meetingsState) : next;
  meetingsListeners.forEach((l) => l());
};

const subscribeMeetings = (listener: MeetingsListener) => {
  meetingsListeners.add(listener);
  return () => meetingsListeners.delete(listener);
};

const sortByScheduledAt = (list: Meeting[]) =>
  [...list].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

let meetingsChannel: any = null;
let meetingsChannelRefCount = 0;
let meetingsChannelUserId: string | null = null;

export const useMeetings = () => {
  const meetings = useSyncExternalStore(subscribeMeetings, getMeetingsState, getMeetingsState);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMeetings = useCallback(async () => {
    if (!user) {
      setMeetingsState([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setMeetingsState(sortByScheduledAt((data ?? []) as Meeting[]));
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

  const createMeeting = useCallback(
    async (input: CreateMeetingInput) => {
      if (!user) return null;

      try {
        // Check if lead already has an active scheduled meeting
        const existingMeeting = meetings.find((m) => m.lead_id === input.lead_id && m.status === 'scheduled');

        if (existingMeeting) {
          toast({
            title: 'Meeting exists',
            description:
              'This lead already has a scheduled meeting. Please complete or reschedule the existing meeting first.',
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

        setMeetingsState((prev) => sortByScheduledAt([...prev, data as Meeting]));
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
    },
    [user, meetings, toast]
  );

  const updateMeetingStatus = useCallback(
    async (meetingId: string, status: Meeting['status']) => {
      if (!user) return false;

      try {
        const { error } = await supabase.from('meetings').update({ status }).eq('id', meetingId);
        if (error) throw error;

        setMeetingsState((prev) => prev.map((m) => (m.id === meetingId ? { ...m, status } : m)));
        return true;
      } catch (error) {
        console.error('Error updating meeting status:', error);
        return false;
      }
    },
    [user]
  );

  const rescheduleMeeting = useCallback(
    async (meetingId: string, newScheduledAt: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from('meetings')
          .update({ scheduled_at: newScheduledAt, status: 'scheduled' })
          .eq('id', meetingId);

        if (error) throw error;

        setMeetingsState((prev) =>
          sortByScheduledAt(
            prev.map((m) =>
              m.id === meetingId ? { ...m, scheduled_at: newScheduledAt, status: 'scheduled' as const } : m
            )
          )
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
    },
    [user, toast]
  );

  const getMeetingsForDate = useCallback(
    (date: Date) => {
      return meetings.filter((m) => {
        const d = new Date(m.scheduled_at);
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
      });
    },
    [meetings]
  );

  useEffect(() => {
    setLoading(true);
    fetchMeetings();
  }, [fetchMeetings]);

  // Global realtime subscription (shared across all hook instances)
  useEffect(() => {
    if (!user) return;

    meetingsChannelRefCount += 1;

    const needsNewChannel = !meetingsChannel || meetingsChannelUserId !== user.id;

    if (needsNewChannel) {
      if (meetingsChannel) {
        supabase.removeChannel(meetingsChannel);
      }

      meetingsChannelUserId = user.id;
      meetingsChannel = supabase
        .channel('meetings-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meetings' }, (payload) => {
          const newMeeting = payload.new as Meeting;
          setMeetingsState((prev) => {
            if (prev.some((m) => m.id === newMeeting.id)) return prev;
            return sortByScheduledAt([...prev, newMeeting]);
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meetings' }, (payload) => {
          const updated = payload.new as Meeting;
          setMeetingsState((prev) => sortByScheduledAt(prev.map((m) => (m.id === updated.id ? updated : m))));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'meetings' }, (payload) => {
          const deleted = payload.old as { id: string };
          setMeetingsState((prev) => prev.filter((m) => m.id !== deleted.id));
        })
        .subscribe();
    }

    return () => {
      meetingsChannelRefCount -= 1;
      if (meetingsChannelRefCount <= 0 && meetingsChannel) {
        supabase.removeChannel(meetingsChannel);
        meetingsChannel = null;
        meetingsChannelUserId = null;
        meetingsChannelRefCount = 0;
      }
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
