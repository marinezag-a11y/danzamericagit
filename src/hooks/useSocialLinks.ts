import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface SocialLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  is_pix: boolean;
  is_active: boolean;
  order: number;
}

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        // If table doesn't exist yet, just return empty array
        if (error.code === '42P01') {
           setLinks([]);
           return;
        }
        throw error;
      }
      setLinks(data || []);
    } catch (err) {
      console.error('Error fetching social links:', err);
    } finally {
      setLoading(false);
    }
  };

  const addLink = async (link: Omit<SocialLink, 'id'>) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .insert([{ ...link }]);

      if (error) throw error;
      await fetchLinks();
      return { success: true };
    } catch (err: any) {
      console.error('Error adding social link:', err);
      return { success: false, error: err.message };
    }
  };

  const updateLink = async (id: string, updates: Partial<SocialLink>) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setLinks(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      return { success: true };
    } catch (err: any) {
      console.error('Error updating social link:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLinks(prev => prev.filter(l => l.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting social link:', err);
      return { success: false, error: err.message };
    }
  };

  const reorderLinks = async (newOrderIds: string[]) => {
    try {
      // Optimistic update
      const newLinks = [...links].sort((a, b) => {
        return newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id);
      }).map((l, index) => ({ ...l, order: index }));
      
      setLinks(newLinks);

      // Perform updates
      const updates = newOrderIds.map((id, index) => ({
        id,
        order: index
      }));
      
      const { error } = await supabase
        .from('social_links')
        .upsert(updates);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Error reordering social links:', err);
      await fetchLinks(); // Revert on error
      return { success: false, error: err.message };
    }
  };

  return {
    links,
    loading,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    refresh: fetchLinks
  };
}
