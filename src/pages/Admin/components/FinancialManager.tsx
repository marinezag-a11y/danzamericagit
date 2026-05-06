import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown,
  Save, 
  Trash2,
  Filter,
  Search,
  Calendar,
  DollarSign,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { useFinancial, FinancialRecord } from '../../../hooks/useFinancial';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { maskBRL, parseBRL } from '../../../lib/utils';

interface FinancialManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function FinancialManager({ onAlert }: FinancialManagerProps) {
  const { records, loading, addRecord, updateRecord, deleteRecord, totals, refresh } = useFinancial();
  const { settings, updateSetting } = useSiteSettings();
  
  // UI State
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  
  // Form State
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('Geral');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // Sync totals with site_settings for frontend use
  const syncTotals = async (income: number, expense: number) => {
    // Current Raised = Total Income
    // Target Amount = Total Expense
    await updateSetting('target_amount', expense.toString());
    await updateSetting('current_amount', income.toString());
  };

  const handleAdd = async () => {
    if (!newDesc) return;
    const amount = parseBRL(newAmount);
    const result = await addRecord({
      description: newDesc,
      amount,
      type: newType,
      category: newCategory,
      date: newDate
    });

    if (result.success) {
      setNewDesc('');
      setNewAmount('');
      setNewCategory('Geral');
      setIsAdding(false);
      
      const newIncome = totals.income + (newType === 'income' ? amount : 0);
      const newExpense = totals.expense + (newType === 'expense' ? amount : 0);
      await syncTotals(newIncome, newExpense);
      
      onAlert('Sucesso', 'Registro financeiro adicionado.', 'info');
    } else {
      onAlert('Erro', result.error || 'Erro ao adicionar registro.', 'danger');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<FinancialRecord>) => {
    setSaving(id);
    const result = await updateRecord(id, updates);
    if (result.success) {
      const record = records.find(r => r.id === id);
      if (record) {
        let newIncome = totals.income;
        let newExpense = totals.expense;

        // If amount changed
        if (updates.amount !== undefined) {
          const diff = updates.amount - record.amount;
          if (record.type === 'income') newIncome += diff;
          else newExpense += diff;
        }
        
        // If type changed (unlikely to happen in simple UI but good to handle)
        if (updates.type !== undefined && updates.type !== record.type) {
            if (updates.type === 'income') {
                newIncome += (updates.amount ?? record.amount);
                newExpense -= record.amount;
            } else {
                newExpense += (updates.amount ?? record.amount);
                newIncome -= record.amount;
            }
        }

        await syncTotals(newIncome, newExpense);
      }
    } else {
      onAlert('Erro', 'Não foi possível atualizar o registro.', 'danger');
    }
    setSaving(null);
  };

  const handleDelete = async (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;
    
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    const result = await deleteRecord(id);
    if (result.success) {
      const newIncome = totals.income - (record.type === 'income' ? record.amount : 0);
      const newExpense = totals.expense - (record.type === 'expense' ? record.amount : 0);
      await syncTotals(newIncome, newExpense);
      onAlert('Excluído', 'Registro removido com sucesso.', 'info');
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [records, searchTerm, typeFilter]);

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-12">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-4">Total Entradas</p>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="p-2 bg-emerald-500/10 rounded-full shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl md:text-2xl font-display text-white break-all">
              {totals.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-4">Total Saídas</p>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="p-2 bg-red-500/10 rounded-full shrink-0">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xl md:text-2xl font-display text-white break-all">
              {totals.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-4">Saldo Atual</p>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="p-2 bg-brand-orange/10 rounded-full shrink-0">
              <DollarSign className="w-4 h-4 text-brand-orange" />
            </div>
            <p className={`text-xl md:text-2xl font-display break-all ${totals.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
              {totals.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-sm group hover:border-emerald-500/50 transition-all">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-4">Pedidos Pagos</p>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="p-2 bg-emerald-500/10 rounded-full shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:text-white transition-all" />
            </div>
            <p className="text-xl md:text-2xl font-display text-white break-all">
              {totals.paidOrders.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="bg-brand-orange p-6 md:p-8 rounded-sm shadow-2xl relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-4 relative z-10">Progresso da Meta</p>
          <div className="flex items-center justify-between relative z-10">
            <p className="text-3xl md:text-4xl font-display text-white font-light">{totals.percentage.toFixed(0)}%</p>
            <div className="h-10 w-10 md:h-12 md:w-12 border-2 border-white/20 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded-full animate-pulse" />
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm"
            />
          </div>
          
          <div className="flex bg-white/5 border border-white/10 rounded-sm p-1">
            <button 
              onClick={() => setTypeFilter('all')}
              className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${typeFilter === 'all' ? 'bg-brand-orange text-white' : 'text-white/40 hover:text-white'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setTypeFilter('income')}
              className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${typeFilter === 'income' ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}
            >
              Entradas
            </button>
            <button 
              onClick={() => setTypeFilter('expense')}
              className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${typeFilter === 'expense' ? 'bg-red-500 text-white' : 'text-white/40 hover:text-white'}`}
            >
              Saídas
            </button>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-8 py-4 border transition-all text-[10px] uppercase tracking-widest font-bold ${isAdding ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-brand-orange border-brand-orange/20 text-white shadow-xl'}`}
        >
          {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isAdding ? 'Cancelar' : 'Novo Lançamento'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-white/5 border border-white/10 rounded-sm shadow-2xl"
          >
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDesc) {
                  onAlert('Campo Obrigatório', 'Por favor, insira uma descrição para o lançamento.', 'warning');
                  return;
                }
                if (!newAmount) {
                  onAlert('Valor Necessário', 'Por favor, insira o valor do lançamento.', 'warning');
                  return;
                }
                handleAdd();
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-8 items-end">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Descrição</label>
                  <input 
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm"
                    placeholder="Ex: Patrocínio Ouro"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Categoria</label>
                  <input 
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm"
                    placeholder="Ex: Alimentação"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Valor (R$)</label>
                  <input 
                    type="text"
                    value={maskBRL(newAmount)}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm font-mono"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Tipo</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'income' | 'expense')}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm outline-none focus:border-brand-orange transition-all text-white appearance-none rounded-sm"
                  >
                    <option value="expense">Saída (Despesa)</option>
                    <option value="income">Entrada (Receita)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Data</label>
                  <input 
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={!!saving}
                className="mt-8 w-full py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50"
              >
                Confirmar Lançamento
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-brand-dark border border-white/10 rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold">Editar Registro</h4>
                  <p className="text-white/40 text-xs mt-1">Altere os detalhes do lançamento abaixo</p>
                </div>
                <button 
                  onClick={() => setEditingRecord(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Descrição</label>
                    <input 
                      type="text"
                      defaultValue={editingRecord.description}
                      id="edit-desc"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Categoria</label>
                    <input 
                      type="text"
                      defaultValue={editingRecord.category}
                      id="edit-cat"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Valor (R$)</label>
                    <input 
                      type="text"
                      value={maskBRL(editingRecord.amount)}
                      onChange={(e) => setEditingRecord({...editingRecord, amount: parseBRL(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm font-mono"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Data</label>
                    <input 
                      type="date"
                      defaultValue={editingRecord.date}
                      id="edit-date"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Tipo</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setEditingRecord({...editingRecord, type: 'income'})}
                        className={`flex-1 p-4 border text-[10px] uppercase tracking-widest font-bold transition-all ${editingRecord.type === 'income' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                      >
                        Entrada
                      </button>
                      <button 
                        onClick={() => setEditingRecord({...editingRecord, type: 'expense'})}
                        className={`flex-1 p-4 border text-[10px] uppercase tracking-widest font-bold transition-all ${editingRecord.type === 'expense' ? 'bg-red-500 border-red-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                      >
                        Saída
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingRecord(null)}
                    className="flex-1 py-4 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      const desc = (document.getElementById('edit-desc') as HTMLInputElement).value;
                      const cat = (document.getElementById('edit-cat') as HTMLInputElement).value;
                      const date = (document.getElementById('edit-date') as HTMLInputElement).value;
                      
                      await handleUpdate(editingRecord.id, {
                        description: desc,
                        category: cat,
                        amount: editingRecord.amount,
                        date: date,
                        type: editingRecord.type
                      });
                      setEditingRecord(null);
                      onAlert('Sucesso', 'Registro atualizado.', 'info');
                    }}
                    className="flex-2 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all px-12"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="border border-white/10 overflow-x-auto rounded-sm bg-black/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="p-6 text-[10px] uppercase tracking-widest text-white/40 font-bold min-w-[120px]">Data</th>
              <th className="p-6 text-[10px] uppercase tracking-widest text-white/40 font-bold min-w-[200px]">Descrição</th>
              <th className="p-6 text-[10px] uppercase tracking-widest text-white/40 font-bold min-w-[150px]">Valor</th>
              <th className="p-6 text-[10px] uppercase tracking-widest text-white/40 font-bold min-w-[100px]">Tipo</th>
              <th className="p-6 text-[10px] uppercase tracking-widest text-white/40 font-bold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {/* Aggregate Paid Orders Summary Row */}
            {(typeFilter === 'all' || typeFilter === 'income') && (
              <tr className="bg-emerald-500/5 border-b border-emerald-500/10 group">
                <td className="p-6">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Automático</span>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-white font-serif italic">Total Aglutinado de Pedidos Pagos</span>
                  </div>
                </td>
                <td className="p-6">
                  <p className="text-sm text-emerald-500 font-mono font-bold">
                    {totals.paidOrders.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold bg-emerald-500/10 text-emerald-500">
                    Entrada
                  </span>
                </td>
                <td className="p-6 text-center">
                  <span className="text-[10px] text-white/20 italic">Sincronizado</span>
                </td>
              </tr>
            )}

            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <FinancialRow 
                  key={record.id} 
                  record={record} 
                  onEdit={() => setEditingRecord(record)}
                  onDelete={() => handleDelete(record.id)}
                />
              ))
            ) : (
              !totals.paidOrders && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-white/20 italic text-sm">
                    Nenhum registro encontrado com os filtros atuais.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinancialRow({ record, onEdit, onDelete }: { record: FinancialRecord, onEdit: () => void, onDelete: () => void }) {
  return (
    <tr className="hover:bg-white/[0.02] transition-all group">
      <td className="p-6">
        <span className="text-xs text-white/60">{record.date}</span>
      </td>
      <td className="p-6">
        <div className="space-y-1">
          <p className="text-sm text-white font-serif italic">{record.description}</p>
          <p className="text-[10px] text-white/20 uppercase tracking-widest">{record.category || 'Geral'}</p>
        </div>
      </td>
      <td className="p-6">
        <p className="text-sm text-white font-mono">
          {record.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </td>
      <td className="p-6">
        <span className={`text-[10px] uppercase tracking-widest font-bold ${record.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
          {record.type === 'income' ? 'Entrada' : 'Saída'}
        </span>
      </td>
      <td className="p-6">
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={onEdit}
            className="p-2 text-white/10 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all"
            title="Editar Registro"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
            title="Excluir Registro"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
