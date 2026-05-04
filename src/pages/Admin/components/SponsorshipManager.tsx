import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  X, 
  Settings, 
  Trash2, 
  Save 
} from 'lucide-react';
import { useSponsorship, SponsorshipTier } from '../../../hooks/useSponsorship';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { maskBRL, parseBRL } from '../../../lib/utils';

interface SponsorshipManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function SponsorshipManager({ onAlert }: SponsorshipManagerProps) {
  const { tiers, loading, addTier, updateTier, deleteTier } = useSponsorship();
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<string | null>(null);

  const handleSave = async (data: any) => {
    setSaving(true);
    let result;
    if (isAdding) {
      result = await addTier(data);
    } else if (editingTier) {
      result = await updateTier(editingTier.id, data);
    }
    
    if (result?.success) {
      setEditingTier(null);
      setIsAdding(false);
      onAlert('Sucesso', 'Cota de patrocínio salva.', 'info');
    } else {
      onAlert('Erro ao Salvar', 'Não foi possível atualizar a cota.', 'danger');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!tierToDelete) return;
    const result = await deleteTier(tierToDelete);
    if (result.success) {
      onAlert('Excluído', 'Cota de patrocínio removida.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível excluir a cota.', 'danger');
    }
    setTierToDelete(null);
  };

  if (loading && tiers.length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-sans italic text-white/60">Cotas Ativas</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Nova Cota
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div key={tier.id} className={`p-8 border rounded-sm transition-all duration-500 ${tier.highlight ? 'border-brand-orange bg-brand-orange/5 shadow-[0_0_20px_rgba(190,49,68,0.1)]' : 'border-white/10 bg-white/5'} flex flex-col group hover:border-white/20`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${tier.highlight ? 'text-brand-orange' : 'text-white/20'}`}>
                  {tier.highlight ? 'Cota Destaque' : 'Cota Standard'}
                </p>
                <h4 className="text-2xl font-sans italic text-white">{tier.name}</h4>
              </div>
              <div className="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingTier(tier)} 
                  className="p-2 text-white/20 hover:text-brand-orange transition-all"
                  title="Editar"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setTierToDelete(tier.id)} 
                  className="p-2 text-white/20 hover:text-red-500 transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-3xl font-sans mb-8 text-white">{maskBRL(tier.price)}</p>
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
        {tiers.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-white/10">
            <p className="text-white/20 italic font-sans">Nenhuma cota de patrocínio cadastrada.</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!tierToDelete}
        onConfirm={handleDelete}
        onCancel={() => setTierToDelete(null)}
        title="Excluir Cota"
        message="Deseja excluir permanentemente esta cota de patrocínio? Isso removerá o item da página de apoiadores."
        variant="danger"
      />

      <AnimatePresence>
        {(editingTier || isAdding) && (
          <TierEditModal 
            tier={editingTier} 
            isAdding={isAdding}
            onClose={() => {
              setEditingTier(null);
              setIsAdding(false);
            }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TierEditModal({ tier, isAdding, onClose, onSave, saving }: { tier: any, isAdding: boolean, onClose: () => void, onSave: (data: any) => void, saving: boolean }) {
  const [name, setName] = useState(tier?.name || '');
  const [price, setPrice] = useState(tier?.price || '');
  const [benefits, setBenefits] = useState(tier?.benefits.join('\n') || '');
  const [highlight, setHighlight] = useState(tier?.highlight || false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-brand-dark border border-white/10 p-6 md:p-12 max-w-2xl w-full relative overflow-y-auto max-h-[90vh] shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-white/20 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-3xl font-sans italic mb-8 text-white">
          {isAdding ? 'Nova Cota' : 'Editar Cota'}
        </h3>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Nome da Cota</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all text-white"
                placeholder="Ex: Cota Diamante"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Valor (R$)</label>
              <input 
                type="text" 
                value={maskBRL(price)}
                onChange={e => setPrice(parseBRL(e.target.value).toString())}
                placeholder="R$ 0,00"
                className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all text-brand-orange font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Benefícios (um por linha)</label>
            <textarea 
              rows={5}
              value={benefits}
              onChange={e => setBenefits(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all text-white"
              placeholder="Logotipo no site\nCitação nas redes sociais..."
            />
          </div>

          <div className="flex items-center gap-4">
            <input 
              type="checkbox" 
              checked={highlight}
              onChange={e => setHighlight(e.target.checked)}
              id="tier-highlight"
              className="w-5 h-5 accent-brand-orange"
            />
            <label htmlFor="tier-highlight" className="text-sm font-sans text-white/60 cursor-pointer">Destacar esta cota no site</label>
          </div>

          <div className="pt-8 border-t border-white/5 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4 text-[10px] uppercase tracking-widest font-bold border border-white/10 text-white/40 hover:bg-white/5 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button 
                disabled={saving || !name}
                onClick={() => onSave({ 
                  name, 
                  price: price, 
                  benefits: benefits.split('\n').filter(b => b.trim()), 
                  highlight 
                })}
                className="flex-1 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Salvar Cota
              </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
