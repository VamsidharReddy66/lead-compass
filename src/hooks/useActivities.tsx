import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Activity {
  id: string;
  lead_id: string;
  agent_id: string;
  activity_type: string;
  description: string;
  previous_value: string | null;
  new_value: string | null;
  meeting_id: string | null;
  created_at: string;
}

export interface CreateActivityInput {
  lead_id: string;
  activity_type: string;
  description: string;
  previous_value?: string | null;
  new_value?: string | null;
  meeting_id?: string | null;
}

export const useActivities = (leadId?: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchActivities = async () => {
    if (!user || !leadId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching activities:', error);
        }
        return;
      }

      setActivities(data || []);
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (input: CreateActivityInput) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('activities')
      .insert({
        lead_id: input.lead_id,
        agent_id: user.id,
        activity_type: input.activity_type,
        description: input.description,
        previous_value: input.previous_value || null,
        new_value: input.new_value || null,
        meeting_id: input.meeting_id || null,
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating activity:', error);
      }
      return null;
    }

    // Update local state
    setActivities((prev) => [data, ...prev]);
    return data;
  };

  useEffect(() => {
    fetchActivities();
  }, [user, leadId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !leadId) return;

    const channel = supabase
      .channel(`activities-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          const newActivity = payload.new as Activity;
          setActivities((prev) => {
            // Avoid duplicates: if activity already exists (optimistic insert), skip
            if (prev.some((a) => a.id === newActivity.id)) return prev;
            return [newActivity, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'activities',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          const updated = payload.new as Activity;
          setActivities((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'activities',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setActivities((prev) => prev.filter((a) => a.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, leadId]);

  return {
    activities,
    loading,
    createActivity,
    refetch: fetchActivities,
  };
};
