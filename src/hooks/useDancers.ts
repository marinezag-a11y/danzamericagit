import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Dancer {
  id: string;
  name: string;
  description?: string | null;
  photo_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export function useDancers() {
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDancers = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('dancers')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setDancers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDancers();
  }, []);

  const addDancer = async (dancer: Partial<Dancer>) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado' };
    try {
      const { data, error: addError } = await supabase
        .from('dancers')
        .insert([dancer])
        .select();

      if (addError) throw addError;
      await fetchDancers();
      return { success: true, data: data[0] };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateDancer = async (id: string, updates: Partial<Dancer>) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado' };
    try {
      const { data, error: updateError } = await supabase
        .from('dancers')
        .update(updates)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;
      await fetchDancers();
      return { success: true, data: data[0] };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteDancer = async (id: string) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado' };
    try {
      const { error: deleteError } = await supabase
        .from('dancers')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchDancers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { dancers, loading, error, addDancer, updateDancer, deleteDancer, refresh: fetchDancers };
}
