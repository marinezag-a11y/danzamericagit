import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SponsorBrand {
  id: string;
  name: string;
  logo_url: string;
  link_url: string;
  is_active: boolean;
  created_at: string;
}

export function useSponsorBrands() {
  const [brands, setBrands] = useState<SponsorBrand[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_brands')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching sponsor brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return { brands, loading, refetch: fetchBrands };
}
