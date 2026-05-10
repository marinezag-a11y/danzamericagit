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
  type: 'store' | 'raffle';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_name: string; 
  product_price?: number; 
  total_price: number;
  status: 'pending' | 'paid' | 'sent' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Specific to raffle
  dancer_name?: string;
  selected_numbers?: number[];
  // Specific to store
  items?: HelpOrderItem[];
}

export function useHelpOrders() {
  const [orders, setOrders] = useState<HelpOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      
      // Fetch Store Orders
      const { data: storeOrders, error: storeError } = await supabase
        .from('help_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeError) throw storeError;

      // Fetch Raffle Orders
      const { data: raffleOrders, error: raffleError } = await supabase
        .from('raffle_orders')
        .select('*, raffle_campaigns(name)')
        .order('created_at', { ascending: false });

      if (raffleError) throw raffleError;

      const unifiedOrders: HelpOrder[] = [
        ...(storeOrders || []).map(o => ({ ...o, type: 'store' as const })),
        ...(raffleOrders || []).map(o => {
          // Handle both object and array response from Supabase relations
          const campaignData = Array.isArray(o.raffle_campaigns) 
            ? o.raffle_campaigns[0] 
            : o.raffle_campaigns;
            
          return { 
            ...o, 
            type: 'raffle' as const,
            product_name: `Rifa: ${campaignData?.name || 'Campanha'}`,
            product_price: Number(o.total_price || 0)
          };
        })
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(unifiedOrders);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchOrders();

    const helpChannel = supabase
      .channel('help_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_orders' }, () => fetchOrders())
      .subscribe();

    const raffleChannel = supabase
      .channel('raffle_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raffle_orders' }, () => fetchOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(helpChannel);
      supabase.removeChannel(raffleChannel);
    };
  }, []);

  const addOrder = async (order: Partial<HelpOrder>) => {
    const table = order.type === 'raffle' ? 'raffle_orders' : 'help_orders';
    try {
      const { error: addError } = await supabase
        .from(table)
        .insert([order]);

      if (addError) throw addError;
      await fetchOrders();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateOrder = async (id: string, updates: Partial<HelpOrder>) => {
    const order = orders.find(o => o.id === id);
    if (!order) return { success: false, error: 'Order not found' };
    
    const table = order.type === 'raffle' ? 'raffle_orders' : 'help_orders';
    
    try {
      const { data, error: updateError } = await supabase
        .from(table)
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
    const order = orders.find(o => o.id === id);
    if (!order) return { success: false, error: 'Order not found' };
    
    const table = order.type === 'raffle' ? 'raffle_orders' : 'help_orders';

    try {
      const { error: deleteError } = await supabase
        .from(table)
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
