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
    <div className="space-y-10">
      {/* Global Challenge Stats Section */}
      <div className="bg-black/20 border border-white/5 p-10 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-orange/10 rounded-xl border border-brand-orange/20">
              <Settings className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold mb-1">Painel de Controle</h4>
              <h3 className="text-xl font-serif italic text-white/90">Configurações Gerais do Desafio</h3>
            </div>
          </div>
          {saving && (
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-orange/10 rounded-full border border-brand-orange/20">
              <Loader2 className="w-3 h-3 animate-spin text-brand-orange" />
              <span className="text-[8px] uppercase tracking-widest text-brand-orange font-bold">Salvando</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <div className="space-y-3">
            <label className="text-[9px] uppercase tracking-[0.2em] text-brand-orange font-bold ml-1">Título do Desafio</label>
            <input 
              type="text"
              className="w-full bg-black/40 border border-white/10 p-5 text-sm font-sans outline-none focus:border-brand-orange/50 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-xl shadow-inner"
              defaultValue={settings['desafio_title']?.value || ''}
              onBlur={async (e) => {
                setSaving('desafio_title');
                await updateSetting('desafio_title', e.target.value);
                setSaving(null);
              }}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[9px] uppercase tracking-[0.2em] text-brand-orange font-bold ml-1">Descrição Curta</label>
            <textarea 
              rows={1}
              className="w-full bg-black/40 border border-white/10 p-5 text-sm font-sans outline-none focus:border-brand-orange/50 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-xl resize-none shadow-inner"
              defaultValue={settings['desafio_description']?.value || ''}
              onBlur={async (e) => {
                setSaving('desafio_description');
                await updateSetting('desafio_description', e.target.value);
                setSaving(null);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <label className="text-[9px] uppercase tracking-[0.2em] text-brand-orange font-bold ml-1">Número de Apoiadores</label>
            <input 
              type="number"
              className="w-full bg-black/40 border border-white/10 p-5 text-sm font-sans outline-none focus:border-brand-orange/50 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-xl shadow-inner"
              defaultValue={settings['supporters_count']?.value || ''}
              onBlur={async (e) => {
                setSaving('supporters_count');
                await updateSetting('supporters_count', e.target.value);
                setSaving(null);
              }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[9px] uppercase tracking-[0.2em] text-brand-orange font-bold ml-1">Número de Bailarinos</label>
            <input 
              type="number"
              className="w-full bg-black/40 border border-white/10 p-5 text-sm font-sans outline-none focus:border-brand-orange/50 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-xl shadow-inner"
              defaultValue={settings['dancers_count']?.value || ''}
              onBlur={async (e) => {
                setSaving('dancers_count');
                await updateSetting('dancers_count', e.target.value);
                setSaving(null);
              }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[9px] uppercase tracking-[0.2em] text-brand-orange font-bold ml-1">Data do Evento (YYYY-MM-DD)</label>
            <input 
              type="text"
              className="w-full bg-black/40 border border-white/10 p-5 text-sm font-sans outline-none focus:border-brand-orange/50 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-xl shadow-inner"
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
        <div className="mt-12 pt-10 border-t border-white/5">
          <label className="text-[9px] uppercase tracking-[0.2em] text-brand-orange font-bold mb-6 block ml-1">Imagem de Fundo do Desafio</label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-center">
            <div className="aspect-video bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl relative group/img">
              {settings['desafio_image']?.value ? (
                <img src={settings['desafio_image']?.value} alt="Desafio" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/5 italic text-xs">Sem imagem</div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[8px] uppercase tracking-widest text-white font-bold bg-brand-orange/80 px-3 py-1 rounded-full">Preview</span>
              </div>
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
              <p className="text-[10px] text-white/20 mt-4 italic">Recomendado: 1920x1080px para melhor impacto visual no topo do site.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
