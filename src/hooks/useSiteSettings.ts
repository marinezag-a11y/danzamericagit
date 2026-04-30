import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSetting {
  key: string;
  value: string;
  label: string;
  category: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      const settingsMap = (data || []).reduce((acc, curr) => ({
        ...acc,
        [curr.key]: curr
      }), {});

      setSettings(settingsMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: { ...prev[key], value }
      }));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, error, updateSetting, refresh: fetchSettings };
}
