import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FundraisingExpense {
  id: string;
  title: string;
  goal_amount: number;
  raised_amount: number;
  created_at: string;
}

export function useFundraising() {
  const [expenses, setExpenses] = useState<FundraisingExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fundraising_expenses')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addExpense = async (title: string, goalAmount: number, raisedAmount: number) => {
    try {
      const { data, error } = await supabase
        .from('fundraising_expenses')
        .insert([{ title, goal_amount: goalAmount, raised_amount: raisedAmount }])
        .select()
        .single();

      if (error) throw error;
      setExpenses(prev => [...prev, data]);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateExpense = async (id: string, updates: Partial<FundraisingExpense>) => {
    try {
      const { error } = await supabase
        .from('fundraising_expenses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fundraising_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const totals = expenses.reduce((acc, curr) => ({
    goal: acc.goal + Number(curr.goal_amount),
    raised: acc.raised + Number(curr.raised_amount)
  }), { goal: 0, raised: 0 });

  return { 
    expenses, 
    loading, 
    error, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    refresh: fetchExpenses,
    totals
  };
}
