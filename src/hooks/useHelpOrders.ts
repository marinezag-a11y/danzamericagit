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
  status: 'pending' | 'paid' | 'sent' | 'cancelled' | 'unconfirmed';
  created_at: string;
  updated_at: string;
  // Specific to raffle
  dancer_name?: string;
  selected_numbers?: number[];
  campaign_id?: string;
  // Specific to store
  items?: HelpOrderItem[];
}

export function useHelpOrders() {
  const [orders, setOrders] = useState<HelpOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFetching, setIsFetching] = useState(false);

  const fetchOrders = async () => {
    if (!supabase || isFetching) return;
    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);

      // Auto-expire pending raffle orders older than 15 minutes
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        
        // 1. Buscar pedidos pendentes prestes a expirar que possuem ID do Mercado Pago
        const { data: expiringOrders } = await supabase
          .from('raffle_orders')
          .select('id, mp_payment_id')
          .eq('status', 'pending')
          .not('mp_payment_id', 'is', null)
          .lt('created_at', fifteenMinutesAgo);

        if (expiringOrders && expiringOrders.length > 0) {
          console.log(`[Segurança] Verificando ${expiringOrders.length} pedidos pendentes no Mercado Pago antes de expirar...`);
          // Executa a conferência para cada um em paralelo/lote para rapidez
          await Promise.all(expiringOrders.map(async (order) => {
            try {
              await supabase.functions.invoke('check-mercado-pago-payment', {
                body: { payment_id: order.mp_payment_id, order_id: order.id }
              });
            } catch (e) {
              console.error(`Erro na conferência preventiva do pedido ${order.id}:`, e);
            }
          }));
        }

        // 2. Agora expira apenas os que continuam pendentes (os que foram pagos já viraram 'paid')
        await supabase
          .from('raffle_orders')
          .update({ 
            status: 'unconfirmed', 
            reason: 'Tempo de reserva esgotado (15 minutos)' 
          })
          .eq('status', 'pending')
          .lt('created_at', fifteenMinutesAgo);
      } catch (err) {
        console.error('Error auto-expiring pending raffle orders:', err);
      }
      
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
      // Ignore AbortError / Lock broken as it's a transient browser issue
      if (err.name === 'AbortError' || err.message?.includes('Lock broken')) {
        console.warn('Silent recovery from transient lock error:', err.message);
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    fetchOrders();

    // Unified channel for all order updates
    const ordersChannel = supabase
      .channel('admin_orders_realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'help_orders' }, 
        (payload) => {
          console.log('Realtime update (Help):', payload);
          fetchOrders();
        }
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'raffle_orders' }, 
        (payload) => {
          console.log('Realtime update (Raffle):', payload);
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log('Realtime Subscription Status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime connection failed. Check if Realtime is enabled for these tables.');
        }
      });

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const addOrder = async (order: Partial<HelpOrder>) => {
    const table = order.type === 'raffle' ? 'raffle_orders' : 'help_orders';
    
    if (order.type === 'raffle' && order.status === 'paid') {
      try {
        const { data: conflictingOrders } = await supabase
          .from('raffle_orders')
          .select('id, selected_numbers')
          .eq('campaign_id', order.campaign_id)
          .in('status', ['paid', 'sent']);

        const paidNumbers = new Set(
          (conflictingOrders || []).flatMap(o => o.selected_numbers || [])
        );

        const conflictNums = (order.selected_numbers || []).filter(n => paidNumbers.has(n));

        if (conflictNums.length > 0) {
          return { 
            success: false, 
            error: `Conflito de Números: O(s) número(s) #${conflictNums.join(', #')} já foi(ram) vendido(s) em outro pedido confirmado!` 
          };
        }
      } catch (err: any) {
        console.error('Erro ao validar concorrência de números:', err);
      }
    }

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
    
    // Se for atualizar para 'paid' em uma rifa, verifica se os números já foram vendidos
    if (order.type === 'raffle' && updates.status === 'paid') {
      try {
        const { data: conflictingOrders } = await supabase
          .from('raffle_orders')
          .select('id, selected_numbers')
          .eq('campaign_id', order.campaign_id)
          .in('status', ['paid', 'sent'])
          .neq('id', id);

        const paidNumbers = new Set(
          (conflictingOrders || []).flatMap(o => o.selected_numbers || [])
        );

        const conflictNums = (order.selected_numbers || []).filter(n => paidNumbers.has(n));

        if (conflictNums.length > 0) {
          return { 
            success: false, 
            error: `Conflito de Números: O(s) número(s) #${conflictNums.join(', #')} já foi(ram) vendido(s) em outro pedido confirmado!` 
          };
        }
      } catch (err: any) {
        console.error('Erro ao validar concorrência de números:', err);
      }
    }
    
    // Optimistic Update: Update local state immediately
    const previousOrders = [...orders];
    setOrders(current => current.map(o => o.id === id ? { ...o, ...updates } : o));

    // Remove virtual fields for database update
    const { 
      type: _type, 
      product_name: _name, 
      product_price: _price, 
      raffle_campaigns: _campaigns,
      ...cleanUpdates 
    } = updates as any;

    try {
      const { data, error: updateError } = await supabase
        .from(table)
        .update(cleanUpdates)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;
      
      // Still fetch orders to ensure everything is perfectly in sync with server (e.g. updated_at)
      await fetchOrders();
      return { success: true, data };
    } catch (err: any) {
      // Rollback on error
      setOrders(previousOrders);
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
