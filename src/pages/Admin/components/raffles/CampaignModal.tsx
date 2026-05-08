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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-brand-dark border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm p-8 md:p-12 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all">
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-4xl font-serif italic text-white mb-12">
          {campaign ? 'Editar Ação' : 'Nova Ação entre Amigos'}
        </h3>

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
        }} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Título da Ação</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  placeholder="Ex: Rifa Solidária - Nova Fantasia"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Descrição</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  placeholder="Conte os detalhes da ação..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Preço por Número</label>
                  <input 
                    type="text" 
                    required
                    value={maskBRL(price)}
                    onChange={(e) => setPrice(parseBRL(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm text-brand-orange font-bold focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Quantidade de Números</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={total}
                    onChange={(e) => setTotal(parseInt(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Início</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Término</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Foto Ilustrativa</label>
                <div className="aspect-video bg-black/50 border border-white/10 overflow-hidden relative group">
                  {imageUrl ? (
                    <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/10">
                      <ImageIcon className="w-12 h-12 mb-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Sem Foto</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
                    <OptimizedImageUploader 
                      onUploadSuccess={(url) => setImageUrl(url)}
                      onAlert={onAlert}
                      folder="raffles"
                      label={imageUrl ? 'Trocar Foto' : 'Subir Foto'}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/5 space-y-4">
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 accent-brand-orange"
                  />
                  <label htmlFor="is_active" className="text-xs uppercase tracking-widest font-bold text-white/60 cursor-pointer">Ação Ativa no Site</label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex justify-end gap-6">
            <button type="button" onClick={onClose} className="px-10 py-4 text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-white transition-all">Cancelar</button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-12 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {campaign ? 'Salvar Alterações' : 'Criar Ação'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
