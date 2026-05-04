import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface HelpOrderItem {
  id: string;
  name: string;
  price: number;
}

export interface HelpOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_id: string; // Keep for backward compatibility or single item ref
  product_name: string; // Summary of items
  product_price: number; // Total price
  items: HelpOrderItem[];
  total_price: number;
  status: 'pending' | 'paid' | 'sent' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export function useHelpOrders() {
  const [orders, setOrders] = useState<HelpOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('help_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const addOrder = async (order: Partial<HelpOrder>) => {
    try {
      const { data, error: addError } = await supabase
        .from('help_orders')
        .insert([order])
        .select();

      if (addError) throw addError;
      await fetchOrders();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateOrder = async (id: string, updates: Partial<HelpOrder>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('help_orders')
        .update(updates)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;
      await fetchOrders();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('help_orders')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchOrders();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { orders, loading, error, addOrder, updateOrder, deleteOrder, refresh: fetchOrders };
}
