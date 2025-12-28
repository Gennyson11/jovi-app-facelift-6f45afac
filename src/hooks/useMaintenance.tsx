import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
}

export function useMaintenance() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('O site está em manutenção. Voltaremos em breve!');
  const [loading, setLoading] = useState(true);

  const fetchMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      if (error) {
        console.error('Error fetching maintenance status:', error);
        return;
      }

      if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
        const settings = data.value as unknown as MaintenanceSettings;
        setIsMaintenanceMode(settings.enabled);
        setMaintenanceMessage(settings.message || 'O site está em manutenção. Voltaremos em breve!');
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async (enabled: boolean, message?: string) => {
    try {
      const newValue = {
        enabled,
        message: message || maintenanceMessage
      };

      const { error } = await supabase
        .from('site_settings')
        .update({ value: newValue })
        .eq('key', 'maintenance_mode');

      if (error) {
        throw error;
      }

      setIsMaintenanceMode(enabled);
      if (message) setMaintenanceMessage(message);
      return { success: true };
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchMaintenanceStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('site-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.maintenance_mode'
        },
        (payload) => {
          if (payload.new && 'value' in payload.new && typeof payload.new.value === 'object' && !Array.isArray(payload.new.value)) {
            const settings = payload.new.value as unknown as MaintenanceSettings;
            setIsMaintenanceMode(settings.enabled);
            setMaintenanceMessage(settings.message || 'O site está em manutenção. Voltaremos em breve!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    isMaintenanceMode,
    maintenanceMessage,
    loading,
    toggleMaintenance,
    refetch: fetchMaintenanceStatus
  };
}
