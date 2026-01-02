import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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
      return 'Follow-up Reminder';
    default:
      return 'New Activity';
  }
};

const getMeetingTypeLabel = (type: string): string => {
  switch (type) {
    case 'site-visit': return 'Site Visit';
    case 'follow-up': return 'Follow-up';
    case 'call': return 'Call';
    case 'meeting': return 'Meeting';
    default: return 'Meeting';
  }
};

const REMINDER_MINUTES = 15; // Notify 15 minutes before

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const notifiedMeetingsRef = useRef<Set<string>>(new Set());
  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support and current permission
  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setIsEnabled(result === 'granted');
      
      if (result === 'granted') {
        toast.success('Push notifications enabled');
        new Notification('Notifications Enabled', {
          body: 'You will now receive push notifications for important updates.',
          icon: '/favicon.ico',
        });
        return true;
      } else if (result === 'denied') {
        toast.error('Notifications blocked. Please enable in browser settings.');
        return false;
      } else {
        toast.info('Notification permission was dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  // Toggle push notifications
  const togglePushNotifications = useCallback(async (enabled: boolean) => {
    if (enabled) {
      return await requestPermission();
    } else {
      setIsEnabled(false);
      toast.success('Push notifications disabled');
      return true;
    }
  }, [requestPermission]);

  // Send a push notification
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isEnabled || permission !== 'granted') return;

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [isEnabled, permission]);

  // Check for upcoming meetings and send reminders
  const checkUpcomingMeetings = useCallback(async () => {
    if (!user || !isEnabled || permission !== 'granted') return;

    try {
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + REMINDER_MINUTES * 60 * 1000);

      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, title, meeting_type, scheduled_at, location')
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', reminderWindow.toISOString());

      if (error) {
        console.error('Error fetching upcoming meetings:', error);
        return;
      }

      meetings?.forEach((meeting) => {
        const meetingKey = `${meeting.id}-reminder`;
        
        // Skip if already notified
        if (notifiedMeetingsRef.current.has(meetingKey)) return;
        
        const scheduledTime = new Date(meeting.scheduled_at);
        const minutesUntil = Math.round((scheduledTime.getTime() - now.getTime()) / 60000);
        
        // Only notify if within reminder window
        if (minutesUntil <= REMINDER_MINUTES && minutesUntil > 0) {
          notifiedMeetingsRef.current.add(meetingKey);
          
          const typeLabel = getMeetingTypeLabel(meeting.meeting_type);
          const timeStr = scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          sendNotification(`⏰ ${typeLabel} in ${minutesUntil} min`, {
            body: `${meeting.title} at ${timeStr}${meeting.location ? ` - ${meeting.location}` : ''}`,
            tag: meetingKey,
            requireInteraction: true,
          });
        }
      });

      // Clean up old entries (keep last 50)
      if (notifiedMeetingsRef.current.size > 50) {
        const entries = Array.from(notifiedMeetingsRef.current);
        entries.slice(0, entries.length - 50).forEach(id => notifiedMeetingsRef.current.delete(id));
      }
    } catch (error) {
      console.error('Error checking upcoming meetings:', error);
    }
  }, [user, isEnabled, permission, sendNotification]);

  // Set up meeting reminder interval
  useEffect(() => {
    if (!user || !isEnabled || permission !== 'granted') {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
        reminderIntervalRef.current = null;
      }
      return;
    }

    // Check immediately on mount
    checkUpcomingMeetings();

    // Then check every minute
    reminderIntervalRef.current = setInterval(checkUpcomingMeetings, 60000);

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
        reminderIntervalRef.current = null;
      }
    };
  }, [user, isEnabled, permission, checkUpcomingMeetings]);

  // Subscribe to realtime activities and send push notifications
  useEffect(() => {
    if (!user || !isEnabled || permission !== 'granted') return;

    const notifiedIds = new Set<string>();

    const channel = supabase
      .channel('push-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          const activity = payload.new as { id: string; activity_type: string; description: string };
          
          if (notifiedIds.has(activity.id)) return;
          notifiedIds.add(activity.id);

          if (notifiedIds.size > 100) {
            const first = notifiedIds.values().next().value;
            if (first) notifiedIds.delete(first);
          }

          const title = getActivityTitle(activity.activity_type);
          sendNotification(title, {
            body: activity.description,
            tag: activity.id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isEnabled, permission, sendNotification]);

  return {
    isEnabled,
    isSupported,
    permission,
    togglePushNotifications,
    requestPermission,
    sendNotification,
  };
};
