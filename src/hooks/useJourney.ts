import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface JourneyItem {
  id: string;
  label: string;
  title: string;
  description: string;
  order: number;
}

export function useJourney() {
  const [items, setItems] = useState<JourneyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('journey_items')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching journey items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchItems();
  }, []);

  const addItem = async (item: Omit<JourneyItem, 'id'>) => {
    const { data, error } = await supabase
      .from('journey_items')
      .insert([item])
      .select();
    if (error) throw error;
    setItems([...items, data[0]]);
    return data[0];
  };

  const updateItem = async (id: string, updates: Partial<JourneyItem>) => {
    try {
      const { error } = await supabase
        .from('journey_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journey_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return { items, loading, addItem, updateItem, deleteItem, refresh: fetchItems };
}
