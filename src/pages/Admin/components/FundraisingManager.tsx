import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Settings, 
  Plus, 
  X, 
  TrendingUp, 
  Save, 
  Trash2,
  CheckCircle2,
  CalendarDays,
  ArrowRight
} from 'lucide-react';
import { useFundraising, FundraisingExpense } from '../../../hooks/useFundraising';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { maskBRL, parseBRL } from '../../../lib/utils';
import { OptimizedImageUploader } from './OptimizedImageUploader';

interface FundraisingManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function FundraisingManager({ onAlert }: FundraisingManagerProps) {
  const { expenses, loading, addExpense, updateExpense, deleteExpense, totals } = useFundraising();
  const { settings, updateSetting } = useSiteSettings();
  const [newTitle, setNewTitle] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newRaised, setNewRaised] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Sync totals with site_settings for frontend use
  const syncTotals = async (goal: number, raised: number) => {
    await updateSetting('target_amount', goal.toString());
    await updateSetting('current_amount', raised.toString());
  };

  const handleAdd = async () => {
    if (!newTitle) return;
    const goal = parseFloat(newGoal) || 0;
    const raised = parseFloat(newRaised) || 0;
    const result = await addExpense(newTitle, goal, raised);
    if (result.success) {
      setNewTitle('');
      setNewGoal('');
      setNewRaised('');
      setIsAdding(false);
      await syncTotals(totals.goal + goal, totals.raised + raised);
      onAlert('Sucesso', 'Item adicionado à planilha.', 'info');
    } else {
      onAlert('Erro', result.error || 'Erro ao adicionar item.', 'danger');
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    setSaving(id);
    const result = await updateExpense(id, updates);
    if (result.success) {
      const currentExpense = expenses.find(e => e.id === id);
      if (currentExpense) {
        const newGoal = totals.goal - Number(currentExpense.goal_amount) + (updates.goal_amount ?? Number(currentExpense.goal_amount));
        const newRaised = totals.raised - Number(currentExpense.raised_amount) + (updates.raised_amount ?? Number(currentExpense.raised_amount));
        await syncTotals(newGoal, newRaised);
      }
    } else {
      onAlert('Erro na Atualização', 'Não foi possível salvar a despesa.', 'danger');
    }
    setSaving(null);
  };

  const handleDelete = async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    const result = await deleteExpense(id);
    if (result.success) {
      await syncTotals(totals.goal - Number(expense.goal_amount), totals.raised - Number(expense.raised_amount));
      onAlert('Excluído', 'Item removido da planilha.', 'info');
    }
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-12">
      {/* Global Challenge Stats Section */}
      <div className="bg-white/5 border border-white/10 p-8 rounded-sm shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-brand-orange/10 rounded-full">
            <Settings className="w-4 h-4 text-brand-orange" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Configurações Gerais do Desafio</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Título do Desafio</label>
            <div className="relative">
              <input 
                type="text"
                className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange transition-all text-white"
                defaultValue={settings['desafio_title']?.value || ''}
                onBlur={async (e) => {
                  setSaving('desafio_title');
                  await updateSetting('desafio_title', e.target.value);
                  setSaving(null);
                }}
              />
              {saving === 'desafio_title' && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-brand-orange" />}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Descrição Curta</label>
            <div className="relative">
              <textarea 
                rows={1}
                className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange transition-all text-white"
                defaultValue={settings['desafio_description']?.value || ''}
                onBlur={async (e) => {
                  setSaving('desafio_description');
                  await updateSetting('desafio_description', e.target.value);
                  setSaving(null);
                }}
              />
              {saving === 'desafio_description' && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-brand-orange" />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Número de Apoiadores</label>
            <div className="relative">
              <input 
                type="number"
                className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange transition-all text-white"
                defaultValue={settings['supporters_count']?.value || ''}
                onBlur={async (e) => {
                  setSaving('supporters_count');
                  await updateSetting('supporters_count', e.target.value);
                  setSaving(null);
                }}
              />
              {saving === 'supporters_count' && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-brand-orange" />}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Número de Bailarinos</label>
            <div className="relative">
              <input 
                type="number"
                className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange transition-all text-white"
                defaultValue={settings['dancers_count']?.value || ''}
                onBlur={async (e) => {
                  setSaving('dancers_count');
                  await updateSetting('dancers_count', e.target.value);
                  setSaving(null);
                }}
              />
              {saving === 'dancers_count' && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-brand-orange" />}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Data do Evento (YYYY-MM-DD)</label>
            <div className="relative">
              <input 
                type="text"
                className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange transition-all text-white"
                defaultValue={settings['event_date']?.value || ''}
                onBlur={async (e) => {
                  setSaving('event_date');
                  await updateSetting('event_date', e.target.value);
                  setSaving(null);
                }}
                placeholder="2026-09-24"
              />
              {saving === 'event_date' && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-brand-orange" />}
            </div>
          </div>
        </div>

        {/* Challenge Image Section */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold mb-4 block">Imagem de Fundo do Desafio</label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            <div className="aspect-video bg-black/50 border border-white/10 overflow-hidden md:col-span-1">
              {settings['desafio_image']?.value ? (
                <img src={settings['desafio_image']?.value} alt="Desafio" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10 italic text-xs">Sem imagem</div>
              )}
            </div>
            <div className="md:col-span-3">
              <OptimizedImageUploader 
                onUploadSuccess={async (url) => {
                  setSaving('desafio_image');
                  await updateSetting('desafio_image', url);
                  setSaving(null);
                }}
                onAlert={onAlert}
                label="Alterar Imagem do Desafio"
                folder="challenge"
              />
              <p className="text-[10px] text-white/20 mt-3 italic">Dica: Use uma imagem impactante do grupo ou do local do evento.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange">Detalhamento de Custos (Planilha)</h4>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2 border transition-all text-xs uppercase tracking-wider font-bold ${isAdding ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-brand-orange border-brand-orange/20 text-white hover:bg-white hover:text-brand-dark'}`}
        >
          {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isAdding ? 'Cancelar' : 'Nova Despesa'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-6 items-end rounded-sm shadow-2xl">
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-brand-orange font-bold">Título da Despesa</label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-3 text-sm outline-none focus:border-brand-orange transition-all text-white placeholder:text-white/10"
                  placeholder="Ex: Aéreo e hospedagem"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-brand-orange font-bold">Meta (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/20 font-bold">R$</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full bg-black/50 border border-white/10 p-3 pl-10 text-sm outline-none focus:border-brand-orange transition-all text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-brand-orange font-bold">Arrecadado (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/20 font-bold">R$</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={newRaised}
                    onChange={(e) => setNewRaised(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full bg-black/50 border border-white/10 p-3 pl-10 text-sm outline-none focus:border-brand-orange transition-all text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button 
                onClick={handleAdd}
                className="w-full py-4 bg-brand-orange text-white text-xs uppercase tracking-wider font-bold hover:bg-white hover:text-brand-dark transition-all shadow-lg"
              >
                Adicionar Item
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border border-white/10 overflow-x-auto rounded-sm bg-black/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="p-4 text-xs uppercase tracking-wider text-white/40 font-bold">Item</th>
              <th className="p-4 text-xs uppercase tracking-wider text-white/40 font-bold">Meta Estimada</th>
              <th className="p-4 text-xs uppercase tracking-wider text-white/40 font-bold">Já Arrecadado</th>
              <th className="p-4 text-xs uppercase tracking-wider text-white/40 font-bold text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <FundraisingRow 
                key={expense.id} 
                expense={expense} 
                onUpdate={(updates) => handleUpdate(expense.id, updates)}
                onDelete={() => handleDelete(expense.id)}
                isSaving={saving === expense.id}
              />
            ))}
            <tr className="bg-brand-orange/5 font-bold border-t border-brand-orange/20">
              <td className="p-6 text-xs uppercase tracking-wider text-brand-orange">Totais Consolidados</td>
              <td className="p-6 text-xl text-white font-bold">
                <span className="text-xs text-brand-orange mr-2">R$</span>
                {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(totals.goal)}
              </td>
              <td className="p-6 text-xl text-white font-bold">
                <span className="text-xs text-brand-orange mr-2">R$</span>
                {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(totals.raised)}
              </td>
              <td className="p-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {Math.round((totals.raised / totals.goal) * 100) || 0}%
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pt-12 mt-12 border-t border-white/10">
        <h4 className="text-sm font-bold uppercase tracking-widest text-brand-orange mb-8">Prévia Visual (Exclusivo Admin)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((expense) => {
            const expPercentage = Math.min((expense.raised_amount / (expense.goal_amount || 1)) * 100, 100);
            return (
              <div 
                key={expense.id}
                className="bg-white/5 p-6 border border-white/5 group hover:border-brand-orange/30 transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-white/80 text-sm font-sans group-hover:text-white transition-colors">{expense.title}</h4>
                  <span className="text-brand-orange text-xs font-display">{expPercentage.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-end mb-3">
                  <p className="text-white text-lg font-sans">R$ {expense.raised_amount.toLocaleString()}</p>
                  <p className="text-white/20 text-[10px] font-display">Meta: R$ {expense.goal_amount.toLocaleString()}</p>
                </div>
                <div className="h-[1px] w-full bg-white/5 relative">
                  <div 
                    style={{ width: `${expPercentage}%` }}
                    className="absolute top-0 left-0 h-full bg-brand-orange/50 group-hover:bg-brand-orange transition-all duration-1000"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FundraisingRow({ expense, onUpdate, onDelete, isSaving }: { expense: FundraisingExpense, onUpdate: (updates: any) => Promise<void>, onDelete: () => void, isSaving: boolean }) {
  const [localTitle, setLocalTitle] = useState(expense.title);
  const [localGoal, setLocalGoal] = useState<number>(expense.goal_amount);
  const [localRaised, setLocalRaised] = useState<number>(expense.raised_amount);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const hasChanges = localTitle !== expense.title || localGoal !== expense.goal_amount || localRaised !== expense.raised_amount;

  useEffect(() => {
    setLocalTitle(expense.title);
    setLocalGoal(expense.goal_amount);
    setLocalRaised(expense.raised_amount);
  }, [expense]);

  const handleConfirmSave = () => {
    onUpdate({ 
      title: localTitle, 
      goal_amount: localGoal, 
      raised_amount: localRaised 
    });
    setShowConfirm(false);
  };

  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
        <td className="p-4">
          <input 
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            className="bg-transparent border-b border-transparent focus:border-brand-orange outline-none text-sm w-full transition-all"
          />
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-3 py-1 rounded-sm focus-within:border-brand-orange transition-all">
            <input 
              type="text"
              value={maskBRL(localGoal)}
              onChange={(e) => setLocalGoal(parseBRL(e.target.value))}
              className="bg-transparent border-none outline-none text-sm w-full text-white font-mono"
            />
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-3 py-1 rounded-sm focus-within:border-brand-orange transition-all">
            <input 
              type="text"
              value={maskBRL(localRaised)}
              onChange={(e) => setLocalRaised(parseBRL(e.target.value))}
              className="bg-transparent border-none outline-none text-sm w-full text-white font-mono"
            />
          </div>
        </td>
        <td className="p-4 flex items-center justify-center gap-3">
          <button 
            onClick={() => setShowConfirm(true)}
            disabled={!hasChanges || isSaving}
            className={`p-2 rounded-full transition-all ${hasChanges ? 'bg-brand-orange text-white shadow-lg scale-110' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
            title="Salvar Alterações"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          </button>
          <button 
            onClick={onDelete}
            className="p-2 text-white/20 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-full"
            title="Excluir"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </td>
      </tr>

      {showConfirm && (
        <ConfirmSaveModal 
          oldData={expense}
          newData={{ title: localTitle, goal_amount: localGoal, raised_amount: localRaised }}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

function ConfirmSaveModal({ oldData, newData, onConfirm, onCancel }: { oldData: FundraisingExpense, newData: any, onConfirm: () => void, onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-dark border border-white/10 p-8 max-w-lg w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6 text-brand-orange">
          <Save className="w-6 h-6" />
          <h3 className="text-xl font-serif italic">Confirmar Alterações</h3>
        </div>

        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest font-bold text-white/20 border-b border-white/5 pb-2">
            <span>Campo</span>
            <div className="grid grid-cols-2 gap-2">
              <span>Anterior</span>
              <span>Novo</span>
            </div>
          </div>
          
          {oldData.title !== newData.title && (
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-white/5">
              <span className="text-white/40">Título</span>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-red-400/60 line-through truncate">{oldData.title}</span>
                <span className="text-green-400 truncate">{newData.title}</span>
              </div>
            </div>
          )}

          {oldData.goal_amount !== newData.goal_amount && (
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-white/5">
              <span className="text-white/40">Meta</span>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-red-400/60 line-through">{maskBRL(oldData.goal_amount)}</span>
                <span className="text-green-400">{maskBRL(newData.goal_amount)}</span>
              </div>
            </div>
          )}

          {oldData.raised_amount !== newData.raised_amount && (
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-white/5">
              <span className="text-white/40">Arrecadado</span>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-red-400/60 line-through">{maskBRL(oldData.raised_amount)}</span>
                <span className="text-green-400">{maskBRL(newData.raised_amount)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all shadow-lg"
          >
            Confirmar e Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
