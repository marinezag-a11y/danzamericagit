import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RankingItem {
  dancer_name: string;
  photo_url: string | null;
  ticket_count: number;
  order_count: number;
  goal: number;
}

export function usePublicRanking() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('raffle_ranking')
          .select('*')
          .order('ticket_count', { ascending: false })
          .order('order_count', { ascending: false });

        if (error) throw error;
        setRanking(data || []);
      } catch (err) {
        console.error('[Ranking] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRanking();
    
    // Subscribe to changes in raffle_orders to refresh ranking
    const subscription = supabase
      .channel('raffle_ranking_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raffle_orders' }, () => {
        fetchRanking();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { ranking, loading };
}
