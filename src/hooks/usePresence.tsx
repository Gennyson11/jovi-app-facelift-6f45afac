import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

const PRESENCE_CHANNEL_NAME = 'jovitools-online-users';

interface OnlineUser {
  user_id: string;
  user_email: string;
  user_name: string;
  online_at: string;
}

export function usePresence(userId: string | undefined, userEmail: string | undefined, userName: string | null | undefined) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSetupRef = useRef(false);
  const userIdRef = useRef(userId);

  // Update ref when userId changes
  userIdRef.current = userId;

  useEffect(() => {
    if (!userId || !userEmail) return;
    
    // Prevent multiple setups for the same user
    if (isSetupRef.current && channelRef.current) return;
    isSetupRef.current = true;

    console.log('Setting up presence for user:', userId, userEmail);

    const presenceChannel = supabase.channel(PRESENCE_CHANNEL_NAME, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced for user:', userIdRef.current);
      })
      .subscribe(async (status) => {
        console.log('Presence channel status:', status);
        if (status === 'SUBSCRIBED') {
          const trackResult = await presenceChannel.track({
            user_id: userId,
            user_email: userEmail,
            user_name: userName || userEmail.split('@')[0],
            online_at: new Date().toISOString(),
          });
          console.log('Track result:', trackResult);
        }
      });

    channelRef.current = presenceChannel;

    return () => {
      console.log('Unsubscribing presence for user:', userIdRef.current);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      isSetupRef.current = false;
    };
  }, [userId, userEmail, userName]);

  return channelRef.current;
}

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSetupRef = useRef(false);

  const parsePresenceState = useCallback((state: Record<string, unknown[]>) => {
    const users: OnlineUser[] = [];
    
    Object.keys(state).forEach((key) => {
      const presences = state[key] as unknown as OnlineUser[];
      if (presences && presences.length > 0) {
        // Filter out listener entries (admin observer)
        const userPresence = presences[0];
        if (userPresence.user_id && !key.startsWith('admin-listener')) {
          users.push(userPresence);
        }
      }
    });

    return users;
  }, []);

  useEffect(() => {
    // Prevent multiple setups
    if (isSetupRef.current && channelRef.current) return;
    isSetupRef.current = true;

    console.log('Setting up admin presence listener');

    // Admin listener needs to join the same channel to see presence
    const presenceChannel = supabase.channel(PRESENCE_CHANNEL_NAME, {
      config: {
        presence: {
          key: `admin-listener-${Date.now()}`,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('Admin received presence state:', state);
        
        const users = parsePresenceState(state);
        console.log('Parsed online users:', users);
        
        setOnlineUsers(users);
        setOnlineCount(users.length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        console.log('Admin presence channel status:', status);
        if (status === 'SUBSCRIBED') {
          // Track as listener to properly join the presence channel
          await presenceChannel.track({
            is_listener: true,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = presenceChannel;

    return () => {
      console.log('Unsubscribing admin presence listener');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      isSetupRef.current = false;
    };
  }, [parsePresenceState]);

  return { onlineUsers, onlineCount };
}
