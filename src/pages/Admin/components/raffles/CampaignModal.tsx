import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  Loader2, 
  Image as ImageIcon
} from 'lucide-react';
import { RaffleCampaign } from '../../../../hooks/useRaffles';
import { OptimizedImageUploader } from '../OptimizedImageUploader';
import { maskBRL, parseBRL } from '../../../../lib/utils';

interface CampaignModalProps {
  campaign: RaffleCampaign | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function CampaignModal({ campaign, onClose, onSave, onAlert }: CampaignModalProps) {
  const [name, setName] = useState(campaign?.name || '');
  const [description, setDescription] = useState(campaign?.description || '');
  const [price, setPrice] = useState(campaign?.price_per_number || 0);
  const [total, setTotal] = useState(campaign?.total_numbers || 100);
  const [imageUrl, setImageUrl] = useState(campaign?.image_url || '');
  const [startDate, setStartDate] = useState(campaign?.start_date?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(campaign?.end_date?.split('T')[0] || '');
  const [isActive, setIsActive] = useState(campaign?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-brand-dark/80 border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-10 md:p-16 shadow-2xl relative backdrop-blur-md"
      >
        <button onClick={onClose} className="absolute top-10 right-10 p-3 bg-white/5 hover:bg-white/10 text-white/20 hover:text-white transition-all rounded-2xl">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-16">
          <h3 className="text-4xl font-serif italic text-white/90">
            {campaign ? 'Refinar Detalhes da Ação' : 'Nova Ação entre Amigos'}
          </h3>
          <div className="h-1 w-20 bg-brand-orange/60 mt-6 rounded-full" />
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onSave({ 
            name, 
            description, 
            price_per_number: price, 
            total_numbers: total, 
            image_url: imageUrl,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            end_date: endDate ? new Date(endDate).toISOString() : null,
            is_active: isActive
          });
          setSaving(false);
        }} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título da Campanha</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-6 text-sm text-white focus:border-brand-orange/40 outline-none transition-all rounded-2xl shadow-inner"
                  placeholder="Ex: Rifa Solidária - Nova Fantasia"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Descrição do Impacto</label>
                <textarea 
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-6 text-sm text-white focus:border-brand-orange/40 outline-none transition-all rounded-2xl resize-none shadow-inner"
                  placeholder="Conte os detalhes da ação..."
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Valor/Número</label>
                  <input 
                    type="text" 
                    required
                    value={maskBRL(price)}
                    onChange={(e) => setPrice(parseBRL(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 p-6 text-sm text-brand-orange font-bold focus:border-brand-orange/40 outline-none transition-all rounded-2xl shadow-inner text-xl"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Total de Números</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={total}
                    onChange={(e) => setTotal(parseInt(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 p-6 text-sm text-white focus:border-brand-orange/40 outline-none transition-all rounded-2xl shadow-inner text-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Data de Início</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-5 text-sm text-white/60 focus:border-brand-orange/40 outline-none transition-all rounded-2xl"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Data de Término</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-5 text-sm text-white/60 focus:border-brand-orange/40 outline-none transition-all rounded-2xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Capa da Campanha</label>
                <div className="aspect-[16/10] bg-black rounded-[2.5rem] border border-white/10 overflow-hidden relative group shadow-2xl">
                  {imageUrl ? (
                    <img src={imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/5 italic">
                      <ImageIcon className="w-12 h-12 mb-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Sem Foto Ilustrativa</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-8">
                    <OptimizedImageUploader 
                      onUploadSuccess={(url) => setImageUrl(url)}
                      onAlert={onAlert}
                      folder="raffles"
                      label={imageUrl ? 'Substituir Imagem' : 'Subir Imagem'}
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-black/20 border border-white/5 rounded-3xl space-y-6">
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-6 h-6 rounded-lg bg-black border-white/10 text-brand-orange focus:ring-brand-orange/40 accent-brand-orange transition-all cursor-pointer"
                  />
                  <label htmlFor="is_active" className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 cursor-pointer select-none">Manter Ação Ativa no Site</label>
                </div>
                <p className="text-[10px] text-white/20 italic leading-relaxed">
                  * Quando inativa, a campanha não aceitará novos pedidos e ficará oculta da página pública.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex justify-end gap-6">
            <button type="button" onClick={onClose} className="px-10 py-5 text-[10px] uppercase tracking-[0.3em] font-bold text-white/20 hover:text-white transition-all rounded-xl">Descartar</button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-12 py-5 bg-brand-orange text-white text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white hover:text-brand-dark transition-all shadow-2xl flex items-center gap-4 disabled:opacity-50 rounded-xl"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
              {campaign ? 'Confirmar Alterações' : 'Lançar Campanha'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
