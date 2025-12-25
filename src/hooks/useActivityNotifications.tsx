import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { Activity } from './useActivities';

const getActivityIcon = (activityType: string): string => {
  switch (activityType) {
    case 'status_change':
      return '🔄';
    case 'meeting_scheduled':
      return '📅';
    case 'meeting_completed':
      return '✅';
    case 'note_added':
      return '📝';
    case 'call':
      return '📞';
    case 'email':
      return '📧';
    case 'follow_up':
      return '⏰';
    default:
      return '📌';
  }
};

const getActivityTitle = (activityType: string): string => {
  switch (activityType) {
    case 'status_change':
      return 'Status Updated';
    case 'meeting_scheduled':
      return 'Meeting Scheduled';
    case 'meeting_completed':
      return 'Meeting Completed';
    case 'note_added':
      return 'Note Added';
    case 'call':
      return 'Call Logged';
    case 'email':
      return 'Email Sent';
    case 'follow_up':
      return 'Follow-up Set';
    default:
      return 'New Activity';
  }
};

export const useActivityNotifications = () => {
  const { user } = useAuth();
  const lastNotifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          const newActivity = payload.new as Activity;
          
          // Only notify if this is a new activity we haven't seen
          if (lastNotifiedRef.current.has(newActivity.id)) return;
          lastNotifiedRef.current.add(newActivity.id);

          // Limit the set size to prevent memory issues
          if (lastNotifiedRef.current.size > 100) {
            const iterator = lastNotifiedRef.current.values();
            lastNotifiedRef.current.delete(iterator.next().value);
          }

          const icon = getActivityIcon(newActivity.activity_type);
          const title = getActivityTitle(newActivity.activity_type);

          toast({
            title: `${icon} ${title}`,
            description: newActivity.description,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
