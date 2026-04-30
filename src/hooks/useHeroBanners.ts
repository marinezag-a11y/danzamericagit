import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface HeroBanner {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  order_index: number;
}

export function useHeroBanners() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching hero banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();

    // Realtime subscription
    const channel = supabase
      .channel('hero_banners_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_banners' }, () => {
        fetchBanners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateBanner = async (id: string, updates: Partial<HeroBanner>) => {
    try {
      const { error } = await supabase
        .from('hero_banners')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchBanners(); // Force update
      return { success: true };
    } catch (error) {
      console.error('Error updating banner:', error);
      return { success: false, error };
    }
  };

  const addBanner = async (banner: Omit<HeroBanner, 'id'>) => {
     try {
       const { error } = await supabase
         .from('hero_banners')
         .insert([banner]);
       
       if (error) throw error;
       await fetchBanners(); // Force update
       return { success: true };
     } catch (error) {
       return { success: false, error };
     }
  };

  const deleteBanner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hero_banners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchBanners(); // Force update
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return { banners, loading, updateBanner, addBanner, deleteBanner, refresh: fetchBanners };
}
