import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RankingItem {
  dancer_name: string;
  photo_url: string | null;
  ticket_count: number;
  order_count: number;
  goal: number;
}

export function usePublicRanking(campaignId?: string) {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      if (!supabase) return;
      try {
        setLoading(true);
        if (!campaignId) {
          // Global ranking from raffle_ranking view
          const { data, error } = await supabase
            .from('raffle_ranking')
            .select('*')
            .order('ticket_count', { ascending: false })
            .order('order_count', { ascending: false });

          if (error) throw error;
          setRanking(data || []);
        } else {
          // Specific campaign ranking calculated in clientside
          // 1. Fetch campaign goal
          let goal = 50;
          try {
            const { data: campaign } = await supabase
              .from('raffle_campaigns')
              .select('goal_per_dancer')
              .eq('id', campaignId)
              .maybeSingle();
            
            if (campaign) {
              goal = campaign.goal_per_dancer || 50;
            }
          } catch (e) {
            console.error('[Ranking] Error fetching campaign goal:', e);
          }

          // 2. Fetch orders for this campaign (excluding cancelled and unconfirmed)
          const { data: orders, error: ordersError } = await supabase
            .from('raffle_orders')
            .select('dancer_name, selected_numbers')
            .eq('campaign_id', campaignId)
            .neq('status', 'cancelled')
            .neq('status', 'unconfirmed');

          if (ordersError) throw ordersError;

          // 3. Fetch dancers to get their photos
          const { data: dancers } = await supabase
            .from('dancers')
            .select('name, photo_url');

          const dancersMap = new Map<string, string | null>();
          if (dancers) {
            dancers.forEach(d => {
              if (d.name) {
                dancersMap.set(d.name.toLowerCase().trim(), d.photo_url);
              }
            });
          }

          // 4. Group and aggregate orders by dancer_name
          const countsMap = new Map<string, { ticket_count: number, order_count: number }>();
          
          orders?.forEach(order => {
            const rawName = order.dancer_name || 'Geral';
            const name = rawName.trim();
            const tickets = order.selected_numbers?.length || 0;
            
            const existing = countsMap.get(name) || { ticket_count: 0, order_count: 0 };
            countsMap.set(name, {
              ticket_count: existing.ticket_count + tickets,
              order_count: existing.order_count + 1
            });
          });

          // Convert map to RankingItem array
          const aggregatedRanking: RankingItem[] = [];
          countsMap.forEach((stats, name) => {
            const normalizedName = name.toLowerCase().trim();
            const photo_url = dancersMap.get(normalizedName) || null;
            
            aggregatedRanking.push({
              dancer_name: name,
              photo_url,
              ticket_count: stats.ticket_count,
              order_count: stats.order_count,
              goal
            });
          });

          // Sort by ticket_count desc, then order_count desc
          aggregatedRanking.sort((a, b) => {
            if (b.ticket_count !== a.ticket_count) return b.ticket_count - a.ticket_count;
            return b.order_count - a.order_count;
          });

          setRanking(aggregatedRanking);
        }
      } catch (err) {
        console.error('[Ranking] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRanking();
    
    // Subscribe to changes in raffle_orders to refresh ranking in real-time
    const subscription = supabase
      .channel(`raffle_ranking_changes_${campaignId || 'global'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raffle_orders' }, () => {
        fetchRanking();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [campaignId]);

  return { ranking, loading };
}

