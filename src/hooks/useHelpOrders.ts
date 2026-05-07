import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface HelpOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
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

    // Subscribe to realtime changes
    const channel = supabase
      .channel('help_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'help_orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addOrder = async (order: Partial<HelpOrder>) => {
    try {
      // 1. Inserir sem .select() para evitar erro de RLS (anônimos não podem ler)
      const { error: addError } = await supabase
        .from('help_orders')
        .insert([order]);

      if (addError) throw addError;

      // 2. Tentar atualizar a lista local (se for admin, funciona. Se for público, falha silenciosamente)
      try {
        await fetchOrders();
      } catch (e) {
        // Silencioso para não quebrar a UI de sucesso do cliente
      }

      return { success: true };
    } catch (err: any) {
      console.error('Add order error:', err);
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
