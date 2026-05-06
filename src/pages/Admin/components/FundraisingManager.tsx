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
    </div>
  );
}
