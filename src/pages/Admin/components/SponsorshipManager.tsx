import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown,
  Star
} from 'lucide-react';
import { useSponsorship, SponsorshipTier } from '../../../hooks/useSponsorship';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

interface SponsorshipManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function SponsorshipManager({ onAlert }: SponsorshipManagerProps) {
  const { tiers, loading, addTier, updateTier, deleteTier } = useSponsorship();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newBenefits, setNewBenefits] = useState('');
  const [newHighlight, setNewHighlight] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await addTier({
      name: newName,
      price: newPrice,
      benefits: newBenefits.split('\n').filter(b => b.trim()),
      highlight: newHighlight,
      display_order: tiers.length
    });
    
    if (res.success) {
      onAlert('Sucesso', 'Nova cota criada com sucesso.', 'info');
      setIsAdding(false);
      setNewName('');
      setNewPrice('');
      setNewBenefits('');
      setNewHighlight(false);
    } else {
      onAlert('Erro', 'Não foi possível criar a cota.', 'danger');
    }
    setSaving(false);
  };

  if (loading && tiers.length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Accordion for New Tier */}
      <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
        isAdding 
          ? 'bg-black/30 border-white/10 shadow-2xl' 
          : 'bg-black/10 border-white/5 hover:border-white/20'
      }`}>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full p-10 flex items-center justify-between group"
        >
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl border transition-all duration-500 ${
              isAdding 
                ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange' 
                : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'
            }`}>
              <Plus className={`w-6 h-6 transition-transform duration-500 ${isAdding ? 'rotate-45' : ''}`} />
            </div>
            <div className="text-left">
              <h3 className={`text-2xl font-serif italic transition-all duration-500 ${
                isAdding ? 'text-white' : 'text-white/40 group-hover:text-white/60'
              }`}>
                Nova Cota de Patrocínio
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">Crie um novo plano de apoio para parceiros</p>
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
            >
              <div className="px-12 pb-12">
                <form onSubmit={handleCreate} className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Nome da Cota</label>
                        <input 
                          type="text" required value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                          placeholder="Ex: Cota Platina"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Valor / Investimento</label>
                        <input 
                          type="text" value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/60 rounded-2xl shadow-inner"
                          placeholder="Ex: R$ 5.000,00 ou Sob Consulta"
                        />
                      </div>
                      <div className="flex items-center gap-4 p-6 bg-black/20 border border-white/5 rounded-2xl">
                        <input 
                           type="checkbox" checked={newHighlight}
                           onChange={(e) => setNewHighlight(e.target.checked)}
                           className="w-5 h-5 accent-brand-orange"
                           id="new-highlight"
                        />
                        <label htmlFor="new-highlight" className="text-[10px] uppercase tracking-widest text-white/40 font-bold cursor-pointer">Destacar Cota (Premium)</label>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Benefícios Inclusos (Um por linha)</label>
                        <textarea 
                          rows={6} value={newBenefits}
                          onChange={(e) => setNewBenefits(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl resize-none shadow-inner h-full min-h-[220px]"
                          placeholder="Logotipo no site\nCitação nas redes sociais\nBanner no evento..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex justify-end">
                    <button 
                      type="submit" disabled={saving}
                      className="px-12 py-5 bg-brand-orange text-white font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50 shadow-2xl rounded-xl flex items-center gap-4"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
                      Lançar Nova Cota
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List of Tiers as Accordions */}
      <div className="space-y-4 pt-12">
        <div className="flex flex-col gap-2 ml-1 mb-6">
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">Cotas Ativas ({tiers.length})</h4>
          <div className="h-px w-12 bg-white/5" />
        </div>
        
        {tiers.map((tier, index) => (
          <SponsorshipAccordion 
            key={tier.id} 
            tier={tier} 
            index={index + 1}
            onUpdate={updateTier} 
            onDelete={deleteTier}
            onAlert={onAlert}
          />
        ))}
      </div>
    </div>
  );
}

interface SponsorshipAccordionProps {
  tier: SponsorshipTier;
  index: number;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onAlert: (t: string, m: string, v: any) => void;
}

const SponsorshipAccordion: React.FC<SponsorshipAccordionProps> = ({ tier, index, onUpdate, onDelete, onAlert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localName, setLocalName] = useState(tier.name);
  const [localPrice, setLocalPrice] = useState(tier.price);
  const [localBenefits, setLocalBenefits] = useState(tier.benefits.join('\n'));
  const [localHighlight, setLocalHighlight] = useState(tier.highlight);
  const [itemToDelete, setItemToDelete] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setLocalName(tier.name);
      setLocalPrice(tier.price);
      setLocalBenefits(tier.benefits.join('\n'));
      setLocalHighlight(tier.highlight);
    }
  }, [tier, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate(tier.id, {
      name: localName,
      price: localPrice,
      benefits: localBenefits.split('\n').filter(b => b.trim()),
      highlight: localHighlight
    });
    setSaving(false);
    if (result.success) {
      setIsOpen(false);
      onAlert('Sucesso', 'Cota atualizada com sucesso.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível atualizar.', 'danger');
    }
  };

  const handleDelete = async () => {
    const result = await onDelete(tier.id);
    if (result.success) {
      onAlert('Excluído', 'Cota removida.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível excluir.', 'danger');
    }
    setItemToDelete(false);
  };

  return (
    <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
      isOpen 
        ? 'bg-black/30 border-white/10 shadow-2xl' 
        : 'bg-black/10 border-white/5 hover:border-white/20'
    }`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-10 flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <div className="text-[10px] font-bold text-white/10 group-hover:text-brand-orange transition-colors font-sans w-6 text-center">
            {index.toString().padStart(2, '0')}
          </div>
          <div className="text-left">
            <h3 className={`text-xl font-serif italic transition-all duration-500 flex items-center gap-4 ${
              isOpen ? 'text-white' : 'text-white/40 group-hover:text-white/60'
            }`}>
              {tier.name}
              {tier.highlight && <Star className="w-4 h-4 text-brand-orange fill-brand-orange" />}
            </h3>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">
              {tier.price} • {tier.benefits.length} benefícios
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/10 group-hover:text-white/40 transition-all duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-12 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Nome da Cota</label>
                    <input 
                      type="text" value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Preço / Investimento</label>
                    <input 
                      type="text" value={localPrice}
                      onChange={(e) => setLocalPrice(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                    />
                  </div>
                  <div className="flex items-center gap-4 p-6 bg-black/20 border border-white/5 rounded-2xl">
                    <input 
                       type="checkbox" checked={localHighlight}
                       onChange={(e) => setLocalHighlight(e.target.checked)}
                       className="w-5 h-5 accent-brand-orange"
                       id={`highlight-${tier.id}`}
                    />
                    <label htmlFor={`highlight-${tier.id}`} className="text-[10px] uppercase tracking-widest text-white/40 font-bold cursor-pointer">Destacar Cota (Premium)</label>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Benefícios (Um por linha)</label>
                    <textarea 
                      rows={8} value={localBenefits}
                      onChange={(e) => setLocalBenefits(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl resize-none shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-white/5 flex justify-between items-center">
                <button 
                  onClick={() => setItemToDelete(true)}
                  className="flex items-center gap-3 px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Cota
                </button>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-10 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all rounded-xl flex items-center gap-3 shadow-2xl disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={itemToDelete}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(false)}
        title="Excluir Cota?"
        message="Deseja remover permanentemente esta cota de patrocínio?"
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  );
}
