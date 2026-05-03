import React, { useEffect, useState, useRef, useId } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  Settings, 
  Images, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  CheckCircle2,
  Globe,
  LogOut,
  ImageIcon,
  Upload,
  Trophy,
  X,
  Heart,
  Pencil,
  Check,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Eye,
  Users,
  Clock,
  MousePointerClick,
  Monitor,
  Smartphone,
  Share2,
  CalendarDays,
  FileText,
  Printer,
  Menu,
  MessageCircle,
  Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useGallery } from '../../hooks/useGallery';
import { useSponsorship, SponsorshipTier } from '../../hooks/useSponsorship';
import { useHeroBanners, HeroBanner } from '../../hooks/useHeroBanners';
import { useTicker, TickerPhrase } from '../../hooks/useTicker';
import { useJourney, JourneyItem } from '../../hooks/useJourney';
import { useFundraising, FundraisingExpense } from '../../hooks/useFundraising';
import { useAnalytics, AnalyticsPeriod } from '../../hooks/useAnalytics';
import { uploadImage } from '../../lib/upload';

// Global Image Optimization Utility
const optimizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1600;
        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH / width) * height;
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

interface OptimizedImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  className?: string;
  folder?: string;
}

function OptimizedImageUploader({ onUploadSuccess, label = "Subir Imagem (Otimizada)", className = "", folder = "content" }: OptimizedImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const uploadId = useId();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const optimizedBlob = await optimizeImage(file);
      const optimizedFile = new File([optimizedBlob], file.name, { type: 'image/jpeg' });
      const result = await uploadImage(optimizedFile, folder);
      if (result.success && result.url) {
        onUploadSuccess(result.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  return (
    <div className={className}>
      <input 
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id={uploadId}
        disabled={uploading}
      />
      <label 
        htmlFor={uploadId}
        className={`flex items-center justify-center gap-2 w-full py-3 px-4 border border-white/10 bg-white/5 hover:bg-brand-orange text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {uploading ? 'Otimizando...' : label}
      </label>
    </div>
  );
}

function ConfirmSaveModal({ 
  onConfirm, 
  onCancel, 
  oldData, 
  newData 
}: { 
  onConfirm: () => void, 
  onCancel: () => void, 
  oldData: any, 
  newData: any 
}) {
  const formatValue = (val: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-brand-dark border border-white/10 p-6 md:p-8 shadow-2xl rounded-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-orange/10 rounded-full">
            <Save className="w-5 h-5 text-brand-orange" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-widest">Confirmar Alterações</h3>
        </div>
        
        <p className="text-xs text-white/60 mb-8 leading-relaxed">
          Você está prestes a atualizar os valores desta despesa. Verifique as mudanças abaixo antes de confirmar:
        </p>

        <div className="space-y-6">
          {oldData.title !== newData.title && (
            <div className="space-y-2 p-3 bg-white/5 border border-white/5 rounded-sm">
              <p className="text-xs uppercase tracking-wider text-brand-orange font-bold">Título do Item</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30 line-through truncate max-w-[120px]">{oldData.title}</span>
                <ArrowRight className="w-3 h-3 text-brand-orange flex-shrink-0" />
                <span className="text-xs text-white font-bold">{newData.title}</span>
              </div>
            </div>
          )}

          {Number(oldData.goal_amount) !== Number(newData.goal_amount) && (
            <div className="space-y-2 p-3 bg-white/5 border border-white/5 rounded-sm">
              <p className="text-xs uppercase tracking-wider text-brand-orange font-bold">Meta Estimada</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30 line-through">{formatValue(oldData.goal_amount)}</span>
                <ArrowRight className="w-3 h-3 text-brand-orange flex-shrink-0" />
                <span className="text-xs text-white font-bold">{formatValue(newData.goal_amount)}</span>
              </div>
            </div>
          )}

          {Number(oldData.raised_amount) !== Number(newData.raised_amount) && (
            <div className="space-y-2 p-3 bg-white/5 border border-white/5 rounded-sm">
              <p className="text-xs uppercase tracking-wider text-brand-orange font-bold">Valor Arrecadado</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30 line-through">{formatValue(oldData.raised_amount)}</span>
                <ArrowRight className="w-3 h-3 text-brand-orange flex-shrink-0" />
                <span className="text-xs text-white font-bold">{formatValue(newData.raised_amount)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-10">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 border border-white/10 text-xs uppercase tracking-wider font-bold hover:bg-white/5 transition-all text-white/40 hover:text-white"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-4 bg-brand-orange text-white text-xs uppercase tracking-wider font-bold hover:bg-white hover:text-brand-dark transition-all shadow-lg"
          >
            Confirmar e Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FundraisingRow({ expense, onUpdate, onDelete, isSaving }: { expense: FundraisingExpense, onUpdate: (updates: any) => Promise<void>, onDelete: () => void, isSaving: boolean }) {
  const [localTitle, setLocalTitle] = useState(expense.title);
  const [localGoal, setLocalGoal] = useState(expense.goal_amount.toString());
  const [localRaised, setLocalRaised] = useState(expense.raised_amount.toString());
  const [showConfirm, setShowConfirm] = useState(false);
  
  const hasChanges = localTitle !== expense.title || localGoal !== expense.goal_amount.toString() || localRaised !== expense.raised_amount.toString();

  useEffect(() => {
    setLocalTitle(expense.title);
    setLocalGoal(expense.goal_amount.toString());
    setLocalRaised(expense.raised_amount.toString());
  }, [expense]);

  const handleConfirmSave = () => {
    onUpdate({ 
      title: localTitle, 
      goal_amount: parseFloat(localGoal) || 0, 
      raised_amount: parseFloat(localRaised) || 0 
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
            <span className="text-xs text-brand-orange font-bold">R$</span>
            <input 
              type="text"
              inputMode="decimal"
              value={localGoal}
              onChange={(e) => setLocalGoal(e.target.value.replace(/[^0-9.]/g, ''))}
              className="bg-transparent border-none outline-none text-sm w-full text-white"
            />
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-3 py-1 rounded-sm focus-within:border-brand-orange transition-all">
            <span className="text-xs text-brand-orange font-bold">R$</span>
            <input 
              type="text"
              inputMode="decimal"
              value={localRaised}
              onChange={(e) => setLocalRaised(e.target.value.replace(/[^0-9.]/g, ''))}
              className="bg-transparent border-none outline-none text-sm w-full text-white"
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

function FundraisingManager() {
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
    }
    setSaving(null);
  };

  const handleDelete = async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    const result = await deleteExpense(id);
    if (result.success) {
      await syncTotals(totals.goal - Number(expense.goal_amount), totals.raised - Number(expense.raised_amount));
    }
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin mx-auto" />;

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

function AnalyticsDashboard() {
  const { data, loading, period, setPeriod, refresh } = useAnalytics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const periodLabels: Record<AnalyticsPeriod, string> = {
    today: 'Hoje',
    '7d': '7 Dias',
    '30d': '30 Dias',
    all: 'Total',
  };

  const maxDailyViews = Math.max(...data.dailyViews.map(d => d.count), 1);
  const totalDevices = data.deviceBreakdown.desktop + data.deviceBreakdown.mobile || 1;
  const totalTraffic = data.trafficSources.reduce((sum, s) => sum + s.count, 0) || 1;

  const trafficIcons: Record<string, React.ReactNode> = {
    'Direto': <MousePointerClick className="w-3 h-3" />,
    'Busca': <Globe className="w-3 h-3" />,
    'Redes Sociais': <Share2 className="w-3 h-3" />,
    'Referência': <ArrowRight className="w-3 h-3" />,
  };

  const trafficColors: Record<string, string> = {
    'Direto': 'bg-brand-orange',
    'Busca': 'bg-blue-500',
    'Redes Sociais': 'bg-purple-500',
    'Referência': 'bg-emerald-500',
  };

  const handlePrintReport = () => {
    if (!reportRef.current) return;
    const printContent = reportRef.current.innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>
      @page{size:A4 portrait;margin:15mm 18mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#1a1a1a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:12px;line-height:1.5}
      .rpt-header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #BE3144;padding-bottom:12px;margin-bottom:20px}
      .rpt-header h1{font-size:22px;font-weight:800;letter-spacing:-0.5px}
      .rpt-header .subtitle{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-top:2px}
      .rpt-header .meta{text-align:right;font-size:10px;color:#999;line-height:1.6}
      .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
      .kpi-card{border:1px solid #e5e5e5;padding:14px 16px;border-radius:4px;background:#fafafa}
      .kpi-card .label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#999;font-weight:700;margin-bottom:6px}
      .kpi-card .value{font-size:26px;font-weight:800;color:#1a1a1a;line-height:1.1}
      .kpi-card .desc{font-size:9px;color:#bbb;margin-top:4px}
      .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#BE3144;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0}
      .two-col{display:grid;grid-template-columns:1.4fr 1fr;gap:16px;margin-bottom:16px}
      .two-col-equal{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700;text-align:left;padding:6px 10px;border-bottom:2px solid #e5e5e5}
      th.right{text-align:right}
      td{padding:6px 10px;font-size:11px;border-bottom:1px solid #eee}
      .rpt-footer{margin-top:20px;padding-top:10px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center}
      .rpt-footer p{font-size:9px;color:#bbb}
      .rpt-footer .brand{font-weight:800;color:#BE3144;font-size:10px;letter-spacing:1px}
      .bar-bg{background:#f0f0f0;border-radius:3px;height:14px;position:relative}
      .bar-fill{background:#BE3144;height:100%;border-radius:3px;min-width:2px}
      .device-bar{display:flex;height:18px;border-radius:4px;overflow:hidden;margin:8px 0 6px}
      .device-legend{display:flex;gap:16px;margin-top:4px}
      .device-legend span{font-size:10px;color:#666;display:flex;align-items:center;gap:4px}
      .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
    </style></head><body>${printContent}</body></html>`);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  const now = new Date();
  const reportDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const reportTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const desktopPct = Math.round((data.deviceBreakdown.desktop / totalDevices) * 100);
  const mobilePct = Math.round((data.deviceBreakdown.mobile / totalDevices) * 100);

  if (loading && data.totalViews === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-white/30 font-bold">Carregando analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Period Filter & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(Object.keys(periodLabels) as AnalyticsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border ${
                period === p
                  ? 'bg-brand-orange border-brand-orange text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-brand-orange bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
          >
            <Printer className="w-3 h-3" />
            Gerar Relatório
          </button>
        </div>
      </div>

      {/* SEO & Search Status - NEW */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-orange/5 border border-brand-orange/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6 rounded-sm"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-orange/20 rounded-full">
            <Globe className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Status de SEO & Google</h4>
            <p className="text-xs text-white/60">Propriedade verificada e Sitemap enviado com sucesso.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Indexado</span>
          </div>
          <a 
            href="https://search.google.com/search-console" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-brand-orange font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            Ver no Google <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
        >
          <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Total de visualizações de todas as páginas</p>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-brand-orange/10 rounded-full group-hover:bg-brand-orange/20 transition-all">
              <Eye className="w-5 h-5 text-brand-orange" />
            </div>
            <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Visualizações</span>
          </div>
          <p className="text-4xl font-sans text-white mb-1">
            {data.totalViews.toLocaleString('pt-BR')}
          </p>
        </motion.div>

        {/* Unique Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
        >
          <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mb-4">Pessoas únicas que acessaram o site</p>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-all">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Visitantes</span>
          </div>
          <p className="text-4xl font-sans text-white mb-1">
            {data.uniqueVisitors.toLocaleString('pt-BR')}
          </p>
        </motion.div>

        {/* Avg Duration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
        >
          <p className="text-[9px] uppercase tracking-widest text-blue-500 font-bold mb-4">Quanto tempo as pessoas ficam no site</p>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-all">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Permanência</span>
          </div>
          <p className="text-4xl font-sans text-white mb-1">
            {formatDuration(data.avgDuration)}
          </p>
        </motion.div>

        {/* Bounce Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
        >
          <p className="text-[9px] uppercase tracking-widest text-purple-500 font-bold mb-4">Pessoas que saíram sem clicar em nada</p>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-all">
              <MousePointerClick className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Rejeição</span>
          </div>
          <p className="text-4xl font-sans text-white mb-1">
            {data.bounceRate}%
          </p>
        </motion.div>
      </div>

      {/* Chart + Top Pages Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Views Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 p-8"
        >
          <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Volume de visitas ao longo da semana</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <CalendarDays className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Acessos por Dia (últimos 7 dias)</h4>
          </div>

          <div className="flex items-end gap-3 h-48">
            {data.dailyViews.map((day, idx) => {
              const barHeight = maxDailyViews > 0 ? (day.count / maxDailyViews) * 100 : 0;
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] text-white/40 font-bold lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                    {day.count}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(barHeight, 2)}%` }}
                    transition={{ delay: 0.3 + idx * 0.05, duration: 0.6, ease: 'easeOut' }}
                    className="w-full bg-brand-orange/30 group-hover:bg-brand-orange transition-all duration-300 rounded-t-sm relative min-h-[2px]"
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-brand-orange rounded-t-sm transition-all duration-500"
                      style={{ height: `${Math.min(barHeight * 1.5, 100)}%` }}
                    />
                  </motion.div>
                  <span className="text-[9px] text-white/30 uppercase tracking-wider font-bold">{dayLabel}</span>
                </div>
              );
            })}
          </div>

          {data.totalViews === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-xs uppercase tracking-widest font-bold">Nenhum dado disponível</p>
              <p className="text-[10px] mt-2 opacity-50">Os acessos começarão a aparecer aqui automaticamente.</p>
            </div>
          )}
        </motion.div>

        {/* Top Actions (Clicks) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-white/5 border border-white/10 p-8"
        >
          <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Onde as pessoas estão clicando</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <MousePointerClick className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Links mais Clicados</h4>
          </div>

          {data.topEvents.length > 0 ? (
            <div className="space-y-5">
              {data.topEvents.map((event, idx) => {
                const totalEvents = data.topEvents.reduce((sum, e) => sum + e.count, 0) || 1;
                const eventPercentage = (event.count / totalEvents) * 100;
                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white/60 font-sans truncate max-w-[160px] group-hover:text-white transition-colors">
                        {event.name}
                      </span>
                      <span className="text-[10px] text-brand-orange font-bold">{event.count}</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${eventPercentage}%` }}
                        transition={{ delay: 0.4 + idx * 0.05, duration: 0.6 }}
                        className="absolute top-0 left-0 h-full bg-brand-orange/60 group-hover:bg-brand-orange transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <MousePointerClick className="w-8 h-8 mb-4 opacity-10" />
              <p className="text-[10px] uppercase tracking-widest font-bold">Sem cliques registrados</p>
            </div>
          )}
        </motion.div>

        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 border border-white/10 p-8"
        >
          <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Partes do site que geram mais interesse</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <Globe className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Páginas Mais Visitadas</h4>
          </div>

          {data.topPages.length > 0 ? (
            <div className="space-y-5">
              {data.topPages.map((page, idx) => {
                const pagePercentage = data.totalViews > 0 ? (page.views / data.totalViews) * 100 : 0;
                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white/60 font-sans truncate max-w-[160px] group-hover:text-white transition-colors">
                        {page.path === '/' ? 'Página Inicial' : page.path}
                      </span>
                      <span className="text-[10px] text-brand-orange font-bold">{page.views}</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pagePercentage}%` }}
                        transition={{ delay: 0.4 + idx * 0.05, duration: 0.6 }}
                        className="absolute top-0 left-0 h-full bg-brand-orange/60 group-hover:bg-brand-orange transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-white/20 italic text-center py-8">Sem dados de páginas ainda.</p>
          )}
        </motion.div>
      </div>

      {/* Device Breakdown + Traffic Sources Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 p-8"
        >
          <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Acesso via Computador ou Celular</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <Monitor className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Dispositivos</h4>
          </div>

          <div className="space-y-6">
            {/* Desktop */}
            <div className="group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/60 font-sans group-hover:text-white transition-colors">Desktop</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30 font-bold">{data.deviceBreakdown.desktop}</span>
                  <span className="text-xs text-brand-orange font-bold">{Math.round((data.deviceBreakdown.desktop / totalDevices) * 100)}%</span>
                </div>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.deviceBreakdown.desktop / totalDevices) * 100}%` }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="h-full bg-blue-400/60 rounded-full"
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white/60 font-sans group-hover:text-white transition-colors">Mobile</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30 font-bold">{data.deviceBreakdown.mobile}</span>
                  <span className="text-xs text-brand-orange font-bold">{Math.round((data.deviceBreakdown.mobile / totalDevices) * 100)}%</span>
                </div>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.deviceBreakdown.mobile / totalDevices) * 100}%` }}
                  transition={{ delay: 0.45, duration: 0.8 }}
                  className="h-full bg-emerald-400/60 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/5 border border-white/10 p-8"
        >
          <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">De onde os visitantes estão vindo</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <Share2 className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Fontes de Tráfego</h4>
          </div>

          {data.trafficSources.length > 0 ? (
            <div className="space-y-5">
              {data.trafficSources.map((source, idx) => {
                const sourcePercentage = (source.count / totalTraffic) * 100;
                return (
                  <div key={idx} className="group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-white/30 group-hover:text-white/60 transition-colors">
                          {trafficIcons[source.source] || <ArrowRight className="w-3 h-3" />}
                        </span>
                        <span className="text-sm text-white/60 font-sans group-hover:text-white transition-colors">{source.source}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/30 font-bold">{source.count}</span>
                        <span className="text-xs text-brand-orange font-bold">{Math.round(sourcePercentage)}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sourcePercentage}%` }}
                        transition={{ delay: 0.5 + idx * 0.05, duration: 0.6 }}
                        className={`h-full rounded-full ${trafficColors[source.source] || 'bg-white/20'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-white/20 italic text-center py-8">Sem dados de tráfego ainda.</p>
          )}
        </motion.div>
      </div>

      {/* Conversion Funnel / Key Clicks - NEW */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 border border-white/10 p-8"
      >
        <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mb-4">Ações importantes realizadas pelos usuários</p>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-emerald-500/10 rounded-full">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Funil de Conversão (Ações Críticas)</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              label: 'Interesse em Patrocínio', 
              event: 'click_solicitar_proposta', 
              color: 'text-brand-orange',
              desc: 'Cliques no botão de proposta'
            },
            { 
              label: 'Apoio via WhatsApp', 
              event: 'click_whatsapp_contact', 
              color: 'text-green-500',
              desc: 'Início de conversa direta'
            },
            { 
              label: 'Doações Iniciadas', 
              event: 'click_vakinha_external', 
              color: 'text-blue-500',
              desc: 'Redirecionamentos para Vakinha'
            }
          ].map((item, idx) => {
            const count = data.topEvents.find(e => e.name === item.event)?.count || 0;
            const conversionRate = data.uniqueVisitors > 0 ? ((count / data.uniqueVisitors) * 100).toFixed(1) : 0;
            
            return (
              <div key={idx} className="p-6 bg-black/20 border border-white/5 rounded-sm group hover:border-white/10 transition-all">
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-4">{item.label}</p>
                <div className="flex items-end justify-between mb-4">
                  <p className={`text-3xl font-sans ${item.color}`}>{count}</p>
                  <p className="text-[10px] text-white/20 font-bold">{conversionRate}% conv.</p>
                </div>
                <p className="text-[10px] text-white/40 italic">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Info Note */}
      <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-sm">
        <BarChart3 className="w-4 h-4 text-white/20 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">Sobre os dados</p>
          <p className="text-[10px] text-white/15 leading-relaxed">
            Os dados são capturados automaticamente a cada visita ao site público. O tempo de permanência é atualizado a cada 15 segundos. 
            Sessões com apenas 1 visualização contam como rejeição. Os dados refletem o período selecionado no filtro acima.
          </p>
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/85 backdrop-blur-sm overflow-y-auto py-8 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-[210mm] bg-white text-[#1a1a1a] shadow-2xl relative"
              style={{ minHeight: '297mm' }}
            >
              {/* Modal Action Buttons */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Prévia do Relatório</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrintReport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#BE3144] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#a02838] transition-all"
                  >
                    <Printer className="w-3 h-3" />
                    Imprimir / PDF
                  </button>
                  <button
                    onClick={() => setShowReport(false)}
                    className="p-2.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Report Content */}
              <div ref={reportRef} className="p-10" style={{ fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif", fontSize: '12px', lineHeight: 1.5 }}>
                {/* Header */}
                <div className="rpt-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid #BE3144', paddingBottom: '12px', marginBottom: '20px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a1a' }}>Relatório de Analytics</h1>
                    <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '2px' }}>Danzamerica — Painel de Gestão</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '10px', color: '#999', lineHeight: 1.6 }}>
                    <p><strong>Período:</strong> {periodLabels[period]}</p>
                    <p><strong>Gerado em:</strong> {reportDate} às {reportTime}</p>
                  </div>
                </div>

                {/* KPIs */}
                <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Visualizações', value: data.totalViews.toLocaleString('pt-BR'), desc: 'Total de page views' },
                    { label: 'Visitantes Únicos', value: data.uniqueVisitors.toLocaleString('pt-BR'), desc: 'Sessões distintas' },
                    { label: 'Permanência', value: formatDuration(data.avgDuration), desc: 'Tempo médio na página' },
                    { label: 'Taxa de Rejeição', value: `${data.bounceRate}%`, desc: 'Sessões com 1 visualização' },
                  ].map((kpi, i) => (
                    <div key={i} className="kpi-card" style={{ border: '1px solid #e5e5e5', padding: '14px 16px', borderRadius: '4px', background: '#fafafa' }}>
                      <p className="label" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#999', fontWeight: 700, marginBottom: '6px' }}>{kpi.label}</p>
                      <p className="value" style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1 }}>{kpi.value}</p>
                      <p className="desc" style={{ fontSize: '9px', color: '#bbb', marginTop: '4px' }}>{kpi.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Two columns: Daily + Top Pages */}
                <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p className="section-title" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#BE3144', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f0f0f0' }}>Acessos por Dia (últimos 7 dias)</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>Dia</th>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>Gráfico</th>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'right', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>Acessos</th>
                      </tr></thead>
                      <tbody>
                        {data.dailyViews.map((d, i) => {
                          const barW = maxDailyViews > 0 ? Math.max((d.count / maxDailyViews) * 100, 2) : 2;
                          const dayName = new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
                          return (
                            <tr key={i}>
                              <td style={{ padding: '6px 10px', fontSize: '11px', color: '#555', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{dayName}</td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid #eee', width: '100%' }}>
                                <div className="bar-bg" style={{ background: '#f0f0f0', borderRadius: '3px', height: '14px' }}>
                                  <div className="bar-fill" style={{ background: '#BE3144', height: '100%', width: `${barW}%`, borderRadius: '3px', minWidth: '2px' }} />
                                </div>
                              </td>
                              <td style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 700, color: '#1a1a1a', borderBottom: '1px solid #eee', textAlign: 'right' }}>{d.count}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="section-title" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#BE3144', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f0f0f0' }}>Páginas Mais Visitadas</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>#</th>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>Caminho</th>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'right', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>Views</th>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'right', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>%</th>
                      </tr></thead>
                      <tbody>
                        {data.topPages.length > 0 ? data.topPages.map((p, i) => (
                          <tr key={i}>
                            <td style={{ padding: '6px 10px', fontSize: '12px', color: '#555', borderBottom: '1px solid #eee' }}>{i + 1}</td>
                            <td style={{ padding: '6px 10px', fontSize: '12px', color: '#1a1a1a', borderBottom: '1px solid #eee' }}>{p.path === '/' ? 'Página Inicial' : p.path}</td>
                            <td style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 700, borderBottom: '1px solid #eee', textAlign: 'right' }}>{p.views}</td>
                            <td style={{ padding: '6px 10px', fontSize: '11px', color: '#BE3144', fontWeight: 600, borderBottom: '1px solid #eee', textAlign: 'right' }}>{data.totalViews > 0 ? ((p.views / data.totalViews) * 100).toFixed(1) : 0}%</td>
                          </tr>
                        )) : <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#aaa', fontStyle: 'italic', fontSize: '11px' }}>Sem dados</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Two columns: Devices + Traffic */}
                <div className="two-col-equal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p className="section-title" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#BE3144', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f0f0f0' }}>Dispositivos</p>
                    <div className="device-bar" style={{ display: 'flex', height: '18px', borderRadius: '4px', overflow: 'hidden', margin: '8px 0 6px' }}>
                      <div style={{ width: `${desktopPct}%`, background: '#3b82f6' }} />
                      <div style={{ width: `${mobilePct}%`, background: '#10b981' }} />
                    </div>
                    <div className="device-legend" style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                        Desktop — {data.deviceBreakdown.desktop} ({desktopPct}%)
                      </span>
                      <span style={{ fontSize: '10px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                        Mobile — {data.deviceBreakdown.mobile} ({mobilePct}%)
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="section-title" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#BE3144', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f0f0f0' }}>Fontes de Tráfego</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>Fonte</th>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'right', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>Visitas</th>
                        <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'right', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>%</th>
                      </tr></thead>
                      <tbody>
                        {data.trafficSources.length > 0 ? data.trafficSources.map((s, i) => (
                          <tr key={i}>
                            <td style={{ padding: '6px 10px', fontSize: '12px', color: '#1a1a1a', borderBottom: '1px solid #eee' }}>{s.source}</td>
                            <td style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 700, borderBottom: '1px solid #eee', textAlign: 'right' }}>{s.count}</td>
                            <td style={{ padding: '6px 10px', fontSize: '11px', color: '#BE3144', fontWeight: 600, borderBottom: '1px solid #eee', textAlign: 'right' }}>{((s.count / totalTraffic) * 100).toFixed(1)}%</td>
                          </tr>
                        )) : <tr><td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#aaa', fontStyle: 'italic', fontSize: '11px' }}>Sem dados</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Conversion Funnel Table - NEW */}
                <div style={{ marginBottom: '16px' }}>
                  <p className="section-title" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#BE3144', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f0f0f0' }}>Funil de Conversão (Ações Críticas)</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>Ação do Usuário</th>
                      <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'right', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>Eventos</th>
                      <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: 700, textAlign: 'right', padding: '6px 10px', borderBottom: '2px solid #e5e5e5' }}>% de Conversão</th>
                    </tr></thead>
                    <tbody>
                      {[
                        { label: 'Interesse em Patrocínio', event: 'click_solicitar_proposta' },
                        { label: 'Apoio via WhatsApp', event: 'click_whatsapp_contact' },
                        { label: 'Doações Iniciadas', event: 'click_vakinha_external' }
                      ].map((item, i) => {
                        const count = data.topEvents.find(e => e.name === item.event)?.count || 0;
                        const rate = data.uniqueVisitors > 0 ? ((count / data.uniqueVisitors) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={i}>
                            <td style={{ padding: '6px 10px', fontSize: '12px', color: '#1a1a1a', borderBottom: '1px solid #eee' }}>{item.label}</td>
                            <td style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 700, borderBottom: '1px solid #eee', textAlign: 'right' }}>{count}</td>
                            <td style={{ padding: '6px 10px', fontSize: '11px', color: '#10b981', fontWeight: 600, borderBottom: '1px solid #eee', textAlign: 'right' }}>{rate}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="rpt-footer" style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '9px', color: '#bbb' }}>Relatório gerado automaticamente pelo sistema de analytics do site.</p>
                  <p style={{ fontWeight: 800, color: '#BE3144', fontSize: '10px', letterSpacing: '1px' }}>DANZAMERICA</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'banners' | 'content' | 'gallery' | 'help' | 'sponsorship' | 'fundraising' | 'ticker'>('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { images, loading: galleryLoading } = useGallery();

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    window.location.href = '/admin';
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) window.location.href = '/admin';
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto mt-20" />;

  return (
    <div className="min-h-screen bg-brand-dark text-white flex font-sans relative">
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-6 right-6 z-[60]">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 bg-brand-orange text-white shadow-2xl rounded-sm hover:scale-110 active:scale-95 transition-all"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 bg-black border-r border-white/5 p-8 flex flex-col z-50 
        transition-transform duration-500 ease-in-out overflow-y-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="mb-12 flex-shrink-0">
          <img src="/logo_branca.png" alt="Logo" className="h-16 w-auto object-contain mb-8" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-brand-orange font-bold">Painel de Gestão</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-sans transition-all ${activeTab === 'analytics' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button 
            onClick={() => { setActiveTab('banners'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-sans transition-all ${activeTab === 'banners' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Banners do Hero
          </button>
          <button 
            onClick={() => { setActiveTab('content'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-sans transition-all ${activeTab === 'content' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Conteúdo Geral
          </button>
          <button 
            onClick={() => { setActiveTab('fundraising'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-sans transition-all ${activeTab === 'fundraising' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <TrendingUp className="w-4 h-4" />
            Planilha de Custos
          </button>
          <button 
            onClick={() => { setActiveTab('ticker'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-sans transition-all ${activeTab === 'ticker' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <Settings className="w-4 h-4" />
            Frases da Barra
          </button>
          <button 
            onClick={() => { setActiveTab('gallery'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-sans transition-all ${activeTab === 'gallery' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <Images className="w-4 h-4" />
            Galeria de Fotos
          </button>
          <button 
            onClick={() => { setActiveTab('help'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-sans transition-all ${activeTab === 'help' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <Heart className="w-4 h-4" />
            Como Ajudar
          </button>
          <button 
            onClick={() => { setActiveTab('sponsorship'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-sans transition-all ${activeTab === 'sponsorship' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <Trophy className="w-4 h-4" />
            Cotas de Patrocínio
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="px-4 py-2">
            <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">Logado como</p>
            <p className="text-xs truncate opacity-60 font-sans">{user?.email}</p>
          </div>
          <a 
            href="/" 
            target="_blank"
            className="flex items-center gap-4 px-4 py-3 text-sm text-white/40 hover:text-white transition-all font-sans"
          >
            <Globe className="w-4 h-4" />
            Ver Site Público
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-sm text-brand-orange hover:bg-brand-orange/10 transition-all font-sans"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
        {/* Developer Credit */}
        <div className="mt-auto pt-8 border-t border-white/5">
          <a 
            href="https://wa.me/5531984211900?text=Quero%20fazer%20meu%20site"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center group-hover:bg-brand-orange/20 transition-all">
              <MessageCircle className="w-4 h-4 text-brand-orange" />
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/20 font-bold mb-0.5">Desenvolvedor</p>
              <p className="text-[10px] text-white/60 group-hover:text-brand-orange transition-colors font-sans">Farizo — (31) 98421-1900</p>
            </div>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        <header className="mb-8 md:mb-12 pt-12 lg:pt-0">
          <h2 className="text-2xl md:text-4xl font-sans italic mb-2 capitalize">
            {activeTab === 'analytics' ? 'Analytics — Acessos ao Site' :
             activeTab === 'content' ? 'Conteúdo Geral' : 
             activeTab === 'gallery' ? 'Galeria de Fotos' :
             activeTab === 'sponsorship' ? 'Cotas de Patrocínio' :
             activeTab === 'banners' ? 'Banners do Hero' :
             activeTab === 'ticker' ? 'Frases da Barra Rotativa' :
             activeTab === 'fundraising' ? 'Planilha de Custos (Desafio)' :
             'Como Ajudar'}
          </h2>
          <div className="w-12 h-1 bg-brand-orange"></div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-7xl"
            >
              <AnalyticsDashboard />
            </motion.div>
          )}
          {activeTab === 'content' && (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl"
            >
              <ContentEditor />
            </motion.div>
          )}
          {activeTab === 'fundraising' && (
            <motion.div 
              key="fundraising"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl"
            >
              <FundraisingManager />
            </motion.div>
          )}
          {activeTab === 'ticker' && (
            <motion.div 
              key="ticker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl"
            >
              <TickerManager />
            </motion.div>
          )}
          {activeTab === 'gallery' && (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl"
            >
              <GalleryManager />
            </motion.div>
          )}
          {activeTab === 'sponsorship' && (
            <motion.div 
              key="sponsorship"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl"
            >
              <SponsorshipManager />
            </motion.div>
          )}
          {activeTab === 'banners' && (
            <motion.div 
              key="banners"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl"
            >
              <BannerManager />
            </motion.div>
          )}
          {activeTab === 'help' && (
            <motion.div 
              key="help"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl"
            >
              <HelpSectionManager />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ContentEditor() {
  const { settings, loading, updateSetting } = useSiteSettings();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0 && Object.keys(localValues).length === 0) {
      const vals = Object.keys(settings).reduce((acc, key) => ({
        ...acc,
        [key]: settings[key]?.value || ''
      }), {});
      setLocalValues(vals);
    }
  }, [settings, localValues]);

  const handleSaveSection = async (sectionTitle: string, keys: string[]) => {
    setSaving(sectionTitle);
    try {
      const results = await Promise.all(keys.map(key => updateSetting(key, localValues[key])));
      if (results.every(r => r.success)) {
        setSuccess(sectionTitle);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving section:', err);
    }
    setSaving(null);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  const sections = [
    {
      title: '01. Seção: Nossa Essência',
      keys: ['essencia_title', 'essencia_text', 'essencia_image']
    },
    {
      title: '02. Seção: A Jornada',
      keys: ['jornada_title', 'jornada_image']
    },
    {
      title: '03. Seção: O Desafio',
      keys: []
    },
    {
      title: '04. Configurações Globais',
      keys: ['pix_key', 'vakinha_url']
    }
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {sections.map(section => (
        <div key={section.title} className="bg-white/5 border border-white/10 p-8 space-y-6 flex flex-col">
          <h3 className="text-xl font-sans italic mb-4">{section.title}</h3>
          
          <div className="space-y-6 flex-1">
            {section.keys.map(key => (
              <div key={key}>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
                  {settings[key]?.label || key}
                </label>
                {key.includes('image') ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <OptimizedImageUploader 
                        onUploadSuccess={async (url) => {
                          setLocalValues(prev => ({ ...prev, [key]: url }));
                          await updateSetting(key, url);
                          setSuccess(section.title);
                          setTimeout(() => setSuccess(null), 3000);
                        }}
                        className="flex-1"
                      />
                      {localValues[key] && (
                        <div className="w-12 h-12 border border-white/10 overflow-hidden">
                          <img src={localValues[key]} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : key.includes('subtitle') || key.includes('description') || key.includes('text') ? (
                  <textarea 
                    rows={3} 
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-sans focus:border-brand-orange focus:outline-none transition-all"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                ) : (
                  <input 
                    type={key.includes('amount') || key.includes('count') ? 'number' : 'text'}
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-sans focus:border-brand-orange focus:outline-none transition-all"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

           <div className="pt-6 mt-6 border-t border-white/5">
             <button 
               onClick={() => handleSaveSection(section.title, section.keys)}
               disabled={saving === section.title}
               className={`w-full py-4 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
                 success === section.title ? 'bg-green-500' : 'bg-brand-orange hover:bg-white hover:text-brand-dark'
               } disabled:opacity-50`}
             >
               {saving === section.title ? <Loader2 className="w-3 h-3 animate-spin" /> : success === section.title ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
               {saving === section.title ? 'Salvando...' : success === section.title ? 'Salvo com Sucesso' : 'Salvar Alterações'}
             </button>
           </div>

           {/* Add Journey Manager for Section 02 */}
           {section.title === '02. Seção: A Jornada' && (
             <div className="mt-12 pt-12 border-t border-white/10">
               <JourneyManager />
             </div>
           )}

           {section.title === '03. Seção: O Desafio' && (
             <div className="mt-12 pt-12 border-t border-white/10">
               <FundraisingManager />
             </div>
           )}

           {section.title === '04. Configurações Globais' && (
             <div className="mt-16 pt-16 border-t border-white/10">
               <h3 className="text-2xl font-sans italic mb-8">Gerenciador de Frases (Barra de Links)</h3>
               <TickerManager />
             </div>
           )}
        </div>
      ))}
      </div>
    </div>
  );
}

function GalleryManager() {
  const { images, loading, addImage, deleteImage } = useGallery();
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [adding, setAdding] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const handleAdd = async () => {
    if (!newUrl) return;
    setAdding(true);
    setStatus({ type: 'info', message: 'Salvando na galeria...' });
    const result = await addImage(newUrl, newCaption);
    if (result.success) {
      setNewUrl('');
      setNewCaption('');
      setStatus({ type: 'success', message: 'Foto adicionada com sucesso!' });
      setTimeout(() => setStatus(null), 3000);
    } else {
      setStatus({ type: 'error', message: 'Erro ao salvar: ' + result.error });
    }
    setAdding(false);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  return (
    <div className="space-y-12">
      <div className="bg-white/5 border border-white/10 p-8">
        <h3 className="text-xl font-sans italic mb-8">Adicionar Nova Foto</h3>
        
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 border border-white/5 bg-white/5 space-y-4">
                <OptimizedImageUploader 
                  onUploadSuccess={(url) => setNewUrl(url)}
                  label="Selecionar do Computador"
                  folder="gallery"
                />
              </div>

              <div className="p-6 border border-white/5 bg-white/5 space-y-4">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Ou Link Externo</label>
                <input 
                  type="text"
                  className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-8 flex flex-col">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Legenda da Foto</label>
                <input 
                  type="text"
                  className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                  placeholder="Ex: Danzamerica 2026 - Noite de Gala"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                />
              </div>

              {newUrl && (
                <div className="aspect-video border border-white/10 overflow-hidden bg-black/50">
                   <img src={newUrl} className="w-full h-full object-contain" alt="Preview" />
                </div>
              )}

              <div className="mt-auto pt-6">
                <button 
                  onClick={handleAdd}
                  disabled={adding || !newUrl}
                  className="w-full py-5 bg-brand-orange text-white text-[12px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-3"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Finalizar e Adicionar à Galeria
                </button>
              </div>
            </div>
          </div>
          {status && (
            <div className={`p-4 text-xs font-bold uppercase tracking-widest rounded-sm ${
              status.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/20' :
              status.type === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500/20' :
              'bg-blue-500/20 text-blue-500 border border-blue-500/20'
            }`}>
              {status.message}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images?.map((image) => (
          <div key={image.id} className="group relative aspect-square bg-white/5 border border-white/10 overflow-hidden">
            <img src={image.url} alt={image.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 lg:bg-black/60 lg:opacity-0 lg:group-hover:opacity-100 transition-all flex items-center justify-center">
              <button 
                onClick={() => setImageToDelete(image.id)}
                className="p-3 bg-red-500 text-white rounded-full hover:bg-white hover:text-red-500 transition-all transform lg:translate-y-4 lg:group-hover:translate-y-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {imageToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-brand-dark border border-white/10 p-12 max-w-lg w-full text-center"
            >
              <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-8" />
              <h3 className="text-3xl font-sans italic mb-4">Excluir Foto?</h3>
              <p className="text-white/40 mb-12 font-sans">Esta ação não pode ser desfeita. A imagem será removida permanentemente da galeria.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setImageToDelete(null)}
                  className="flex-1 py-4 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    await deleteImage(imageToDelete);
                    setImageToDelete(null);
                  }}
                  className="flex-1 py-4 bg-red-500 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-red-500 transition-all"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SponsorshipManager() {
  const { tiers, loading, addTier, updateTier, deleteTier } = useSponsorship();
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: any) => {
    setSaving(true);
    if (isAdding) {
      await addTier(data);
    } else if (editingTier) {
      await updateTier(editingTier.id, data);
    }
    setSaving(false);
    setEditingTier(null);
    setIsAdding(false);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-sans italic text-white/60">Cotas Ativas</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Cota
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div key={tier.id} className={`p-8 border ${tier.highlight ? 'border-brand-orange bg-brand-orange/5' : 'border-white/10 bg-white/5'} flex flex-col`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-orange font-bold mb-1">{tier.highlight ? 'Cota Destaque' : 'Cota Standard'}</p>
                <h4 className="text-2xl font-sans italic">{tier.name}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingTier(tier)} className="p-2 hover:text-brand-orange transition-all"><Settings className="w-4 h-4" /></button>
                <button onClick={() => deleteTier(tier.id)} className="p-2 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-3xl font-sans mb-8">{tier.price}</p>
            <ul className="space-y-3 mb-8 flex-1">
              {tier.benefits.map((b, i) => (
                <li key={i} className="text-xs text-white/40 flex items-start gap-2">
                  <span className="w-1 h-1 bg-brand-orange mt-1.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {(editingTier || isAdding) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-brand-dark border border-white/10 p-6 md:p-12 max-w-2xl w-full relative overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => {
                  setEditingTier(null);
                  setIsAdding(false);
                }}
                className="absolute top-8 right-8 text-white/20 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-sans italic mb-8">
                {isAdding ? 'Nova Cota' : 'Editar Cota'}
              </h3>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Nome da Cota</label>
                    <input 
                      type="text" 
                      defaultValue={editingTier?.name || ''}
                      id="tier-name"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Valor (R$)</label>
                    <input 
                      type="text" 
                      defaultValue={editingTier?.price || ''}
                      id="tier-price"
                      placeholder="0.000,00"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Benefícios (um por linha)</label>
                  <textarea 
                    rows={5}
                    defaultValue={editingTier?.benefits.join('\n') || ''}
                    id="tier-benefits"
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    id="tier-highlight"
                    defaultChecked={editingTier?.highlight || false}
                    className="w-5 h-5 accent-brand-orange"
                  />
                  <label htmlFor="tier-highlight" className="text-sm font-sans">Destacar esta cota (ex: Diamante)</label>
                </div>

                <div className="pt-8 border-t border-white/5 flex gap-4">
                   <button 
                    onClick={() => {
                      setEditingTier(null);
                      setIsAdding(false);
                    }}
                    className="flex-1 py-4 text-[10px] uppercase tracking-widest font-bold border border-white/10 hover:bg-white/5 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                    disabled={saving}
                    onClick={() => {
                      const name = (document.getElementById('tier-name') as HTMLInputElement).value;
                      const price = (document.getElementById('tier-price') as HTMLInputElement).value;
                      const benefits = (document.getElementById('tier-benefits') as HTMLTextAreaElement).value.split('\n').filter(b => b.trim());
                      const highlight = (document.getElementById('tier-highlight') as HTMLInputElement).checked;
                      handleSave({ name, price, benefits, highlight });
                    }}
                    className="flex-1 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-2"
                   >
                     {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                     Salvar Cota
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BannerManager() {
  const { banners, loading, updateBanner, addBanner, deleteBanner } = useHeroBanners();
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<HeroBanner | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    setDeleting(true);
    const result = await deleteBanner(bannerToDelete.id);
    if (result.success) {
      setBannerToDelete(null);
      triggerSuccess('Banner excluído com sucesso!');
    } else {
      alert('Erro ao excluir banner. Verifique sua conexão.');
    }
    setDeleting(false);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-sans italic text-white/60">Slides do Topo (Máx 6)</h3>
        {banners.length < 6 && (
          <button 
            onClick={() => {
              setEditingBanner({ 
                id: 'new', 
                image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2669&auto=format&fit=crop', 
                title: '', 
                subtitle: '', 
                order_index: banners.length 
              });
            }}
            className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Slide
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white/5 border border-white/10 overflow-hidden flex flex-col">
            <div className="aspect-video relative group">
              <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 lg:bg-black/60 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                 <button 
                  onClick={() => setEditingBanner(banner)}
                  className="bg-brand-orange p-3 rounded-full hover:bg-white hover:text-brand-dark transition-all transform lg:scale-90 lg:group-hover:scale-100"
                 >
                   <Settings className="w-4 h-4" />
                 </button>
                 <button 
                  onClick={() => setBannerToDelete(banner)}
                  className="bg-red-500 p-3 rounded-full hover:bg-white hover:text-red-500 transition-all transform lg:scale-90 lg:group-hover:scale-100"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-lg font-sans italic mb-1">{banner.title}</h4>
              <p className="text-xs text-white/40">{banner.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-brand-dark border border-white/10 p-6 md:p-12 max-w-2xl w-full relative overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setEditingBanner(null)}
                className="absolute top-8 right-8 text-white/20 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-sans italic mb-8">
                {editingBanner.id === 'new' ? 'Novo Slide' : 'Editar Slide'}
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Título do Slide</label>
                  <input 
                    type="text"
                    defaultValue={editingBanner.title}
                    id="banner-title"
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Subtítulo / Legenda</label>
                  <input 
                    type="text"
                    defaultValue={editingBanner.subtitle}
                    id="banner-subtitle"
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Imagem do Banner</label>
                  <div className="space-y-4">
                    <input 
                      type="text"
                      defaultValue={editingBanner.image_url}
                      id="banner-url"
                      className="w-full bg-white/5 border border-white/10 p-4 text-[10px] font-mono focus:border-brand-orange outline-none transition-all opacity-50"
                    />
                    <OptimizedImageUploader 
                      onUploadSuccess={(url) => {
                        const input = document.getElementById('banner-url') as HTMLInputElement;
                        if (input) input.value = url;
                      }}
                      folder="banners"
                      label="Substituir por Foto do Computador"
                    />
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      const title = (document.getElementById('banner-title') as HTMLInputElement).value;
                      const subtitle = (document.getElementById('banner-subtitle') as HTMLInputElement).value;
                      const image_url = (document.getElementById('banner-url') as HTMLInputElement).value;
                      
                      let result;
                      if (editingBanner.id === 'new') {
                        result = await addBanner({ title, subtitle, image_url, order_index: editingBanner.order_index });
                      } else {
                        result = await updateBanner(editingBanner.id, { title, subtitle, image_url });
                      }

                      if (result.success) {
                        setEditingBanner(null);
                        triggerSuccess(editingBanner.id === 'new' ? 'Slide criado!' : 'Slide atualizado!');
                      }
                      setSaving(false);
                    }}
                    className="flex-1 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {editingBanner.id === 'new' ? 'Criar Slide' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {bannerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-brand-dark border border-white/10 p-12 max-w-lg w-full text-center"
            >
              <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-8" />
              <h3 className="text-3xl font-sans italic mb-4">Excluir Slide?</h3>
              <p className="text-white/40 mb-12 font-sans">Este slide será removido permanentemente do carrossel do topo.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setBannerToDelete(null)}
                  className="flex-1 py-4 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-red-500 transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sim, Excluir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TickerManager() {
  const { phrases, loading, addPhrase, updatePhrase, deletePhrase } = useTicker();
  const [newPhrase, setNewPhrase] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [phraseToDelete, setPhraseToDelete] = useState<string | null>(null);

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  const handleAdd = async () => {
    if (!newPhrase.trim()) return;
    setSaving(true);
    await addPhrase(newPhrase);
    setNewPhrase('');
    setSaving(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editText.trim()) return;
    setSaving(true);
    await updatePhrase(id, editText);
    setEditingId(null);
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 p-8">
        <h3 className="text-xl font-sans italic mb-6">Adicionar Nova Frase</h3>
        <div className="flex gap-4">
          <input 
            type="text"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Ex: Novos Vencedores 2026..."
            className="flex-1 bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
          />
          <button 
            onClick={handleAdd}
            disabled={saving || !newPhrase.trim()}
            className="bg-brand-orange text-white px-8 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-sans italic text-white/60">Frases Atuais</h3>
        <div className="grid gap-4">
          {phrases.map((phrase) => (
            <div key={phrase.id} className="bg-white/5 border border-white/10 p-6 flex items-center justify-between group">
              {editingId === phrase.id ? (
                <div className="flex-1 flex gap-4 mr-4">
                  <input 
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 bg-white/10 border border-brand-orange p-2 text-sm font-sans outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => handleUpdate(phrase.id)}
                    className="text-green-500 hover:text-white transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setEditingId(null)}
                    className="text-white/20 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-sans italic text-lg">{phrase.text}</p>
                  <div className="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingId(phrase.id);
                        setEditText(phrase.text);
                      }}
                      className="p-2 hover:text-brand-orange transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPhraseToDelete(phrase.id)}
                      className="p-2 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {phrases.length === 0 && (
            <p className="text-center py-12 text-white/20 font-sans italic border border-dashed border-white/10">Nenhuma frase cadastrada.</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {phraseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-brand-dark border border-white/10 p-6 md:p-12 max-w-lg w-full text-center"
            >
              <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-8" />
              <h3 className="text-3xl font-sans italic mb-4">Excluir Frase?</h3>
              <p className="text-white/40 mb-12 font-sans">Esta frase será removida permanentemente da barra rotativa.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setPhraseToDelete(null)}
                  className="flex-1 py-4 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    await deletePhrase(phraseToDelete);
                    setPhraseToDelete(null);
                  }}
                  className="flex-1 py-4 bg-red-500 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-red-500 transition-all"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HelpSectionManager() {
  const { settings, loading, updateSetting } = useSiteSettings();
  const [saving, setSaving] = useState<string | null>(null);

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  const helpSections = [
    {
      id: 1,
      title: 'Loja Oficial',
      keys: {
        title: 'help_store_title',
        description: 'help_store_description',
        image: 'help_store_image'
      }
    },
    {
      id: 2,
      title: 'Rifa Digital',
      keys: {
        title: 'help_raffle_title',
        description: 'help_raffle_description',
        image: 'help_raffle_image'
      }
    },
    {
      id: 3,
      title: 'Eventos & Ações',
      keys: {
        title: 'help_event_title',
        description: 'help_event_description',
        image: 'help_event_image'
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {helpSections.map((sec) => (
        <div key={sec.id} className="bg-white/5 border border-white/10 p-8 space-y-6 flex flex-col">
          <h3 className="text-xl font-sans italic text-brand-orange">{sec.title}</h3>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-white/40">Título</label>
              <input 
                type="text"
                className="w-full bg-white/5 border border-white/10 p-3 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                defaultValue={settings[sec.keys.title]?.value || ''}
                onBlur={async (e) => {
                  setSaving(sec.keys.title);
                  await updateSetting(sec.keys.title, e.target.value);
                  setSaving(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-white/40">Descrição</label>
              <textarea 
                rows={4}
                className="w-full bg-white/5 border border-white/10 p-3 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                defaultValue={settings[sec.keys.description]?.value || ''}
                onBlur={async (e) => {
                  setSaving(sec.keys.description);
                  await updateSetting(sec.keys.description, e.target.value);
                  setSaving(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-white/40">Imagem da Seção</label>
              <div className="space-y-4">
                <div className="aspect-square bg-black/50 border border-white/10 overflow-hidden mb-4">
                  <img src={settings[sec.keys.image]?.value} alt="" className="w-full h-full object-cover" />
                </div>
                <OptimizedImageUploader 
                  onUploadSuccess={async (url) => {
                    setSaving(sec.keys.image);
                    await updateSetting(sec.keys.image, url);
                    setSaving(null);
                  }}
                  folder="help"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40">
            {saving?.startsWith('help_') && (saving === sec.keys.title || saving === sec.keys.description || saving === sec.keys.image) ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</>
            ) : (
              <><CheckCircle2 className="w-3 h-3 text-green-500" /> Sincronizado</>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function JourneyManager() {
  const { items, loading, addItem, deleteItem, updateItem, refresh } = useJourney();
  const [newLabel, setNewLabel] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<JourneyItem>>({});

  const handleAdd = async () => {
    if (!newLabel || !newTitle) return;
    setAdding(true);
    try {
      await addItem({ 
        label: newLabel, 
        title: newTitle, 
        description: newDescription,
        order: items.length 
      });
      setNewLabel('');
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      console.error(err);
    }
    setAdding(false);
  };

  const handleStartEdit = (item: JourneyItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateItem(editingId, editForm);
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-brand-orange mx-auto" />;

   return (
     <div className="space-y-8">
       <div>
<div className="flex items-center justify-between mb-6"><h4 className="text-xl font-sans italic">Linha do Tempo (Conquistas)</h4><div className="flex items-center gap-4"><span className="text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">Total: {items.length} itens</span><button onClick={() => refresh()} className="p-2 text-white/20 hover:text-brand-orange transition-all hover:bg-white/5 rounded-full" title="Sincronizar com o banco"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button></div></div>
         
         <div className="bg-white/5 p-8 space-y-8 border border-white/10">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
             <div className="space-y-3">
               <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block min-h-[1.5em]">Ano ou Sigla</label>
               <input 
                 type="text" 
                 value={newLabel}
                 onChange={(e) => setNewLabel(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange transition-all placeholder:opacity-20"
                 placeholder="2026."
               />
             </div>
             <div className="md:col-span-3 space-y-3">
               <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block min-h-[1.5em]">Título Curto</label>
               <input 
                 type="text" 
                 value={newTitle}
                 onChange={(e) => setNewTitle(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange transition-all placeholder:opacity-20"
                 placeholder="Ex: Melhor Grupo: Arte Minas"
               />
             </div>
           </div>
           <div className="space-y-3">
             <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Descrição Detalhada</label>
             <textarea 
               value={newDescription}
               onChange={(e) => setNewDescription(e.target.value)}
               className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange min-h-[100px] transition-all placeholder:opacity-20"
               placeholder="Descreva a conquista de forma breve e impactante..."
             />
           </div>
           <button 
             onClick={handleAdd}
             disabled={adding || !newLabel || !newTitle}
             className="w-full bg-brand-orange hover:bg-white hover:text-brand-dark py-4 text-[10px] uppercase font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-3"
           >
             {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-4 h-4" />}
             Adicionar à Jornada
           </button>
         </div>
       </div>

       <div className="space-y-4">
         <h5 className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Conquistas Ativas no Site</h5>
         {items.length === 0 ? (
           <div className="p-12 border border-dashed border-white/10 text-center">
             <p className="text-sm italic opacity-30 font-sans">Nenhuma conquista cadastrada ainda.</p>
           </div>
         ) : (
          <div className="grid grid-cols-1 gap-3">
             {items.map((item) => (
               <div key={item.id} className="flex flex-col p-6 bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                 {editingId === item.id ? (
                   <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input 
                          type="text" 
                          value={editForm.label}
                          onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                          className="bg-brand-dark border border-white/10 p-2 text-sm font-sans outline-none focus:border-brand-orange"
                        />
                        <input 
                          type="text" 
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="md:col-span-3 bg-brand-dark border border-white/10 p-2 text-sm font-sans outline-none focus:border-brand-orange"
                        />
                     </div>
                     <textarea 
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="w-full bg-brand-dark border border-white/10 p-2 text-sm font-sans outline-none focus:border-brand-orange min-h-[60px]"
                     />
                     <div className="flex gap-2">
                        <button 
                          onClick={handleSaveEdit}
                          className="flex-1 bg-green-600 hover:bg-green-700 py-2 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                        >
                          <Check className="w-3 h-3" /> Salvar
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-6 bg-white/10 hover:bg-white/20 py-2 text-[10px] uppercase font-bold tracking-widest"
                        >
                          Cancelar
                        </button>
                     </div>
                   </div>
                 ) : (
                   <div className="flex items-center justify-between">
                     <div className="flex gap-8 items-center">
                       <span className="text-brand-orange font-sans text-3xl opacity-80">{item.label}</span>
                       <div>
                         <h6 className="font-sans text-lg text-white mb-1">{item.title}</h6>
                         <p className="text-xs opacity-40 line-clamp-1 font-sans max-w-md">{item.description}</p>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <button 
                         onClick={() => handleStartEdit(item)}
                         className="p-3 text-white/10 hover:text-brand-orange hover:bg-white/5 transition-all rounded-full"
                         title="Editar conquista"
                       >
                         <Pencil className="w-5 h-5" strokeWidth={1.5} />
                       </button>
                       <button 
                         onClick={() => deleteItem(item.id)}
                         className="p-3 text-white/10 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-full"
                         title="Remover conquista"
                       >
                         <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             ))}
           </div>
         )}
       </div>
     </div>
  );
}

