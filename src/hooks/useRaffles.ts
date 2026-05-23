import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface RaffleCampaign {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_per_number: number;
  total_numbers: number;
  numbers_per_order: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  is_test_mode?: boolean;
  goal_per_dancer: number;
  cost: number;
  completion_text?: string;
  created_at: string;
}


export interface RaffleOrder {
  id: string;
  campaign_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  selected_numbers: number[];
  total_price: number;
  dancer_name?: string;
  session_id?: string;
  status: 'pending' | 'paid' | 'cancelled' | 'unconfirmed';
  notification_sent?: boolean;
  created_at: string;
}

export function useRaffles() {
  const [campaigns, setCampaigns] = useState<RaffleCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('raffle_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching raffle campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('raffle_orders')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data as RaffleOrder[] };
    } catch (err: any) {
      console.error('Error fetching raffle orders:', err);
      return { success: false, error: err.message, data: [] };
    }
  };

  const createCampaign = async (campaign: Omit<RaffleCampaign, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('raffle_campaigns')
        .insert([campaign])
        .select()
        .single();

      if (error) throw error;
      setCampaigns(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateCampaign = async (id: string, updates: Partial<RaffleCampaign>) => {
    try {
      const { data, error } = await supabase
        .from('raffle_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCampaigns(prev => prev.map(c => c.id === id ? data : c));
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('raffle_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCampaigns(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateOrderStatus = async (id: string, status: RaffleOrder['status']) => {
    try {
      const { data, error } = await supabase
        .from('raffle_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('raffle_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const fetchTakenTickets = async (campaignId: string) => {
    try {
      // Usar a VIEW pública para evitar erro de RLS e proteger dados sensíveis
      const { data, error } = await supabase
        .from('raffle_occupied_numbers')
        .select('selected_numbers')
        .eq('campaign_id', campaignId);

      if (error) throw error;
      
      const taken = data.reduce((acc: number[], order) => {
        return [...acc, ...order.selected_numbers];
      }, []);

      return taken;
    } catch (err) {
      console.error('Error fetching taken tickets:', err);
      return [];
    }
  };

  const createOrder = async (order: Omit<RaffleOrder, 'created_at' | 'status'>) => {
    try {
      // 1. Chamar a função RPC segura com locks e checagem a nível de banco (transação perfeita)
      const { data, error } = await supabase.rpc('create_raffle_order_safely', {
        p_id: order.id,
        p_campaign_id: order.campaign_id,
        p_customer_name: order.customer_name,
        p_customer_email: order.customer_email,
        p_customer_phone: order.customer_phone,
        p_selected_numbers: order.selected_numbers,
        p_total_price: order.total_price,
        p_dancer_name: order.dancer_name || null,
        p_session_id: order.session_id || null
      });

      if (error) {
        // Se o erro for de redundância (números já ocupados)
        if (error.message?.includes('redundancy') || error.details?.includes('redundancy')) {
          return {
            success: false,
            error: 'redundancy: Um ou mais números selecionados já foram comprados ou reservados por outra pessoa nesse instante. Por favor, escolha outros números.'
          };
        }
        throw error;
      }

      return { success: true };
    } catch (err: any) {
      console.error('Create raffle order error:', err);
      return { success: false, error: err.message };
    }
  };


  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    refresh: fetchCampaigns,
    fetchOrders,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateOrderStatus,
    deleteOrder,
    fetchTakenTickets,
    createOrder
  };
}
