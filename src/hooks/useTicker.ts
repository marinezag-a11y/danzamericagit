import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TickerPhrase {
  id: string;
  text: string;
  display_order: number;
}

export function useTicker() {
  const [phrases, setPhrases] = useState<TickerPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhrases = async () => {
    try {
      const { data, error } = await supabase
        .from('ticker_phrases')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPhrases(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addPhrase = async (text: string) => {
    try {
      const { data, error } = await supabase
        .from('ticker_phrases')
        .insert([{ text, display_order: phrases.length + 1 }])
        .select();

      if (error) throw error;
      setPhrases([...phrases, data[0]]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updatePhrase = async (id: string, text: string) => {
    try {
      const { error } = await supabase
        .from('ticker_phrases')
        .update({ text })
        .eq('id', id);

      if (error) throw error;
      setPhrases(phrases.map(p => p.id === id ? { ...p, text } : p));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deletePhrase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ticker_phrases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPhrases(phrases.filter(p => p.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchPhrases();
  }, []);

  return { phrases, loading, error, addPhrase, updatePhrase, deletePhrase, refresh: fetchPhrases };
}
