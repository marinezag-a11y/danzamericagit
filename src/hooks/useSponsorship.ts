import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SponsorshipTier {
  id: string;
  name: string;
  price: string;
  benefits: string[];
  highlight: boolean;
  display_order: number;
}

export function useSponsorship() {
  const [tiers, setTiers] = useState<SponsorshipTier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTiers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sponsorship_tiers')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setTiers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const updateTier = async (id: string, updates: Partial<SponsorshipTier>) => {
    const { error } = await supabase
      .from('sponsorship_tiers')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setTiers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      return { success: true };
    }
    return { success: false, error };
  };

  const addTier = async (tier: Omit<SponsorshipTier, 'id'>) => {
    const { data, error } = await supabase
      .from('sponsorship_tiers')
      .insert([tier])
      .select();

    if (!error && data) {
      setTiers(prev => [...prev, data[0]]);
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  const deleteTier = async (id: string) => {
    const { error } = await supabase
      .from('sponsorship_tiers')
      .delete()
      .eq('id', id);

    if (!error) {
      setTiers(prev => prev.filter(t => t.id !== id));
      return { success: true };
    }
    return { success: false, error };
  };

  return { tiers, loading, updateTier, addTier, deleteTier, refreshTiers: fetchTiers };
}
