import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface DancerPerformance {
  name: string;
  totalSales: number;
  orderCount: number;
  ticketCount: number;
  goal: number;
}

export interface CampaignProgress {
  id: string;
  name: string;
  totalArrecadado: number;
  ticketsVendidos: number;
  metaTickets: number;
  pricePerNumber: number;
  cost: number;
}

export interface RaffleStats {
  totalRevenue: number;
  totalTickets: number;
  avgTicketPrice: number;
  topDancers: DancerPerformance[];
  campaignsProgress: CampaignProgress[];
  allOrders: any[]; // Adicionado para permitir filtros customizados no componente
}

export function useRaffleAnalytics() {
  const [stats, setStats] = useState<RaffleStats>({
    totalRevenue: 0,
    totalTickets: 0,
    avgTicketPrice: 0,
    topDancers: [],
    campaignsProgress: [],
    allOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaffleAnalytics = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("Cliente Supabase não inicializado.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all raffle orders (excluding cancelled and unconfirmed)
      const [ordersRes, dancersRes] = await Promise.all([
        supabase
          .from('raffle_orders')
          .select('*, raffle_campaigns(id, name, total_numbers, goal_per_dancer, price_per_number, cost)')
          .neq('status', 'cancelled')
          .neq('status', 'unconfirmed'),
        supabase
          .from('dancers')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      const orders = ordersRes.data;
      const dancersCount = dancersRes.count || 17;

      // 2. Process Stats
      const dancerMap: Record<string, DancerPerformance> = {};
      const campaignMap: Record<string, CampaignProgress> = {};
      let totalRevenue = 0;
      let totalTickets = 0;

      (orders || []).forEach(order => {
        const isCounted = order.status !== 'cancelled' && order.status !== 'unconfirmed';
        const price = Number(order.total_price || 0);
        const tickets = (order.selected_numbers || []).length;
        const dancer = order.dancer_name || 'Geral';
        const campaignId = order.campaign_id;
        const campaignData = Array.isArray(order.raffle_campaigns)
          ? order.raffle_campaigns[0]
          : order.raffle_campaigns;
        const campaignName = campaignData?.name || 'Campanha s/ Nome';

        if (isCounted) {
          totalRevenue += price;
          totalTickets += tickets;
        }

        // Dancer Stats (Aggregated for now, we'll filter in the component)
        if (!dancerMap[dancer]) {
          dancerMap[dancer] = { 
            name: dancer, 
            totalSales: 0, 
            orderCount: 0, 
            ticketCount: 0,
            goal: campaignData?.total_numbers ? Math.ceil(campaignData.total_numbers / Math.max(1, dancersCount)) : 0
          };
        }
        
        if (isCounted) {
          dancerMap[dancer].totalSales += price;
          dancerMap[dancer].orderCount += 1;
          dancerMap[dancer].ticketCount += tickets;
        }

        // Campaign Stats
        if (campaignId) {
          if (!campaignMap[campaignId]) {
            campaignMap[campaignId] = { 
              id: campaignId, 
              name: campaignName, 
              totalArrecadado: 0, 
              ticketsVendidos: 0, 
              metaTickets: campaignData?.total_numbers || 1000,
              pricePerNumber: campaignData?.price_per_number || 0,
              cost: campaignData?.cost || 0
            };
          }
          if (isCounted) {
            campaignMap[campaignId].totalArrecadado += price;
            campaignMap[campaignId].ticketsVendidos += tickets;
          }
        }
      });

      const topDancers = Object.values(dancerMap)
        .sort((a, b) => b.totalSales - a.totalSales);

      const campaignsProgress = Object.values(campaignMap);

      setStats({
        totalRevenue,
        totalTickets,
        avgTicketPrice: totalTickets > 0 ? totalRevenue / totalTickets : 0,
        topDancers,
        campaignsProgress,
        allOrders: orders || [],
      });

    } catch (err: any) {
      console.error('[Raffle Analytics] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRaffleAnalytics();

    if (!supabase) return;

    // Sincronização em tempo real para estatísticas
    const channel = supabase
      .channel('raffle_analytics_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'raffle_orders' },
        () => fetchRaffleAnalytics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'raffle_campaigns' },
        () => fetchRaffleAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRaffleAnalytics]);

  return { stats, loading, error, refresh: fetchRaffleAnalytics };
}
