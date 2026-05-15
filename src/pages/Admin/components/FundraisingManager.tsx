import React, { useState } from 'react';
import { 
  Loader2, 
  Settings
} from 'lucide-react';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { OptimizedImageUploader } from './OptimizedImageUploader';

interface FundraisingManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function FundraisingManager({ onAlert }: FundraisingManagerProps) {
  const { settings, updateSetting, loading } = useSiteSettings();
  const [saving, setSaving] = useState<string | null>(null);

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-12">
      {saving && (
        <div className="fixed bottom-12 right-12 flex items-center gap-3 px-6 py-3 bg-brand-orange text-white rounded-full shadow-2xl z-50 animate-bounce">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[10px] uppercase tracking-widest font-bold">Salvando {saving.replace(/_/g, ' ')}...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título do Desafio</label>
          <input 
            type="text"
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl shadow-inner"
            defaultValue={settings['desafio_title']?.value || ''}
            onBlur={async (e) => {
              setSaving('desafio_title');
              await updateSetting('desafio_title', e.target.value);
              setSaving(null);
            }}
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Descrição Curta</label>
          <textarea 
            rows={1}
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl resize-none shadow-inner"
            defaultValue={settings['desafio_description']?.value || ''}
            onBlur={async (e) => {
              setSaving('desafio_description');
              await updateSetting('desafio_description', e.target.value);
              setSaving(null);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Número de Apoiadores</label>
          <input 
            type="number"
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl shadow-inner"
            defaultValue={settings['supporters_count']?.value || ''}
            onBlur={async (e) => {
              setSaving('supporters_count');
              await updateSetting('supporters_count', e.target.value);
              setSaving(null);
            }}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Número de Bailarinos</label>
          <input 
            type="number"
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl shadow-inner"
            defaultValue={settings['dancers_count']?.value || ''}
            onBlur={async (e) => {
              setSaving('dancers_count');
              await updateSetting('dancers_count', e.target.value);
              setSaving(null);
            }}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Data do Evento (YYYY-MM-DD)</label>
          <input 
            type="text"
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl shadow-inner"
            defaultValue={settings['event_date']?.value || ''}
            onBlur={async (e) => {
              setSaving('event_date');
              await updateSetting('event_date', e.target.value);
              setSaving(null);
            }}
            placeholder="2026-09-24"
          />
        </div>
      </div>

      {/* Challenge Image Section */}
      <div className="pt-12 border-t border-white/5">
        <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold mb-6 block ml-1">Imagem de Fundo do Desafio</label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-center">
          <div className="aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative group/img">
            {settings['desafio_image']?.value ? (
              <img src={settings['desafio_image']?.value} alt="Desafio" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 opacity-80" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/5 italic text-xs">Sem imagem</div>
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
              maxWidth={1400}
            />
            <p className="text-[10px] text-white/20 mt-4 italic">Recomendado: 1920x1080px para melhor impacto visual no topo do site.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
