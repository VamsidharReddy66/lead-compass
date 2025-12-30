import { useState, useEffect, useCallback } from 'react';
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

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

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
        // Send a test notification
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
          
          // Prevent duplicate notifications
          if (notifiedIds.has(activity.id)) return;
          notifiedIds.add(activity.id);

          // Limit set size
          if (notifiedIds.size > 100) {
            const first = notifiedIds.values().next().value;
            if (first) notifiedIds.delete(first);
          }

          const title = getActivityTitle(activity.activity_type);
          sendNotification(title, {
            body: activity.description,
            tag: activity.id, // Prevents duplicate system notifications
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
