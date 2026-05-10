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
  const [numbersPerOrder, setNumbersPerOrder] = useState(campaign?.numbers_per_order || 10);
  const [imageUrl, setImageUrl] = useState(campaign?.image_url || '');
  const [startDate, setStartDate] = useState(campaign?.start_date?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(campaign?.end_date?.split('T')[0] || '');
  const [isActive, setIsActive] = useState(campaign?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-brand-dark/90 border border-white/10 w-full max-w-6xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative rounded-[4rem] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-10 md:p-14 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <p className="text-brand-orange text-[9px] uppercase tracking-[0.5em] font-black mb-3">CONFIGURAÇÃO DE AÇÃO</p>
            <h3 className="text-4xl font-serif italic text-white leading-tight">
              {campaign ? 'Refinar Detalhes da Ação' : 'Nova Ação entre Amigos'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all transform hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onSave({ 
            name, 
            description, 
            price_per_number: price, 
            total_numbers: total, 
            numbers_per_order: numbersPerOrder,
            image_url: imageUrl,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            end_date: endDate ? new Date(endDate).toISOString() : null,
            is_active: isActive
          });
          setSaving(false);
        }} className="flex-1 overflow-y-auto p-10 md:p-16 space-y-16 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div className="space-y-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-black ml-2">INFORMAÇÕES BÁSICAS</p>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-orange font-black ml-4">Título da Campanha</label>
                    <input 
                      type="text" required value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium"
                      placeholder="Ex: Rifa Solidária - Nova Fantasia"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-orange font-black ml-4">Descrição do Impacto</label>
                    <textarea 
                      rows={4} value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium resize-none"
                      placeholder="Conte os detalhes da ação..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-black ml-2">MÉTRICAS E VALORES</p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-orange font-black ml-4">Valor/Núm</label>
                    <input 
                      type="text" required value={maskBRL(price)}
                      onChange={(e) => setPrice(parseBRL(e.target.value))}
                      className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-xl text-brand-orange font-serif italic focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-orange font-black ml-4">Total</label>
                    <input 
                      type="number" required min={1} value={total}
                      onChange={(e) => setTotal(parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-xl text-white font-serif italic focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-orange font-black ml-4">Qtd/Ação</label>
                    <input 
                      type="number" required min={1} value={numbersPerOrder}
                      onChange={(e) => setNumbersPerOrder(parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-xl text-white font-serif italic focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-black ml-2">PERÍODO DE VIGÊNCIA</p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-orange font-black ml-4">Início</label>
                    <input 
                      type="date" value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-sm text-white/60 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-orange font-black ml-4">Término</label>
                    <input 
                      type="date" value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-sm text-white/60 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-black ml-2">IDENTIDADE VISUAL</p>
                <div className="aspect-[16/10] bg-black rounded-[3.5rem] border border-white/5 overflow-hidden relative group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]">
                  {imageUrl ? (
                    <img src={imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/5 italic">
                      <ImageIcon className="w-16 h-16 mb-4" strokeWidth={1} />
                      <span className="text-[10px] uppercase tracking-[0.4em] font-black">Aguardando Imagem de Capa</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-12 backdrop-blur-sm">
                    <OptimizedImageUploader 
                      onUploadSuccess={(url) => setImageUrl(url)}
                      onAlert={onAlert}
                      folder="raffles"
                      label={imageUrl ? 'Substituir Identidade' : 'Enviar Capa Oficial'}
                    />
                  </div>
                </div>
              </div>

              <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-8">
                <div className="flex items-center gap-6">
                   <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" id="is_active"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-orange" onClick={() => setIsActive(!isActive)}></div>
                   </div>
                   <label htmlFor="is_active" className="text-xs uppercase tracking-[0.3em] font-black text-white/40 cursor-pointer select-none">Ativar Publicação no Site</label>
                </div>
                <div className="flex gap-4 p-6 bg-brand-orange/5 border border-brand-orange/10 rounded-2xl">
                   <div className="w-1 h-auto bg-brand-orange rounded-full shrink-0" />
                   <p className="text-[10px] text-brand-orange font-black italic leading-relaxed uppercase tracking-widest opacity-60">
                      Campanhas inativas ficam ocultas e não permitem novos registros de pedidos.
                   </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-6">
            <button 
              type="button" onClick={onClose} 
              className="px-12 py-6 text-[10px] uppercase tracking-[0.4em] font-black text-white/20 hover:text-white transition-all active:scale-95"
            >
              DESCARTAR
            </button>
            <button 
              type="submit" disabled={saving}
              className="px-16 py-7 bg-brand-orange text-white text-[11px] uppercase tracking-[0.4em] font-black hover:bg-brand-dark transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 rounded-[2rem] active:scale-95"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {campaign ? 'CONFIRMAR ATUALIZAÇÃO' : 'PUBLICAR NOVA AÇÃO'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
