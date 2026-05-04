import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface HelpItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  button_text: string;
  modal_type: string;
  order: number;
}

export function useHelpItems() {
  const [items, setItems] = useState<HelpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('help_items')
        .select('*')
        .order('order', { ascending: true });

      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addItem = async (item: Partial<HelpItem>) => {
    try {
      const { data, error: addError } = await supabase
        .from('help_items')
        .insert([item])
        .select();

      if (addError) throw addError;
      await fetchItems();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<HelpItem>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('help_items')
        .update(updates)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;
      await fetchItems();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('help_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchItems();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { items, loading, error, addItem, updateItem, deleteItem, refresh: fetchItems };
}
