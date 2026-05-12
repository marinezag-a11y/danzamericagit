import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export interface FinancialRecord {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  created_at: string;
}

export function useFinancial() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [paidOrdersTotal, setPaidOrdersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      // Só mostra o loading na PRIMEIRA vez que carrega
      setRecords(prev => {
        if (prev.length === 0) setLoading(true);
        return prev;
      });
      
      if (!supabase) return;
      
      const [recordsRes, ordersRes, rafflesRes] = await Promise.all([
        supabase
          .from('financial_records')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('help_orders')
          .select('total_price')
          .in('status', ['paid', 'sent']),
        supabase
          .from('raffle_orders')
          .select('total_price')
          .in('status', ['paid', 'sent'])
      ]);

      if (recordsRes.error) throw recordsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (rafflesRes.error) throw rafflesRes.error;

      setRecords(recordsRes.data || []);
      
      const ordersSum = (ordersRes.data || []).reduce((acc, curr) => acc + (parseFloat(curr.total_price) || 0), 0);
      const rafflesSum = (rafflesRes.data || []).reduce((acc, curr) => acc + (parseFloat(curr.total_price) || 0), 0);
      
      setPaidOrdersTotal(ordersSum + rafflesSum);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecord = async (record: Omit<FinancialRecord, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .insert([record])
        .select()
        .single();

      if (error) throw error;
      setRecords(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateRecord = async (id: string, updates: Partial<FinancialRecord>) => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecords(prev => prev.filter(r => r.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchRecords();

    if (!supabase) return;

    // Sincronização em tempo real para o financeiro
    const channel = supabase
      .channel('financial_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'financial_records' },
        () => fetchRecords()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'help_orders' },
        () => fetchRecords()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'raffle_orders' },
        () => fetchRecords()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  const totals = useMemo(() => {
    const baseTotals = (records || []).reduce((acc, curr) => {
      const amount = Number(curr.amount) || 0;
      if (curr.type === 'income') {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      return acc;
    }, { income: 0, expense: 0 });

    const totalIncome = baseTotals.income + paidOrdersTotal;

    return {
      income: totalIncome,
      expense: baseTotals.expense,
      balance: totalIncome - baseTotals.expense,
      paidOrders: paidOrdersTotal
    };
  }, [records, paidOrdersTotal]);

  const consolidatedTotals = {
    ...totals,
    percentage: totals.expense > 0 ? Math.min((totals.income / totals.expense) * 100, 100) : 0
  };

  return { 
    records, 
    loading, 
    error, 
    addRecord, 
    updateRecord, 
    deleteRecord, 
    refresh: fetchRecords,
    totals: consolidatedTotals
  };
}
