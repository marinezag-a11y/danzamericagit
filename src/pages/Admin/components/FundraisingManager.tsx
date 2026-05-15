import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Settings,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { OptimizedImageUploader } from './OptimizedImageUploader';

interface FundraisingManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function FundraisingManager({ onAlert }: FundraisingManagerProps) {
  const { settings, updateSetting, loading } = useSiteSettings();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      const keys = ['desafio_title', 'desafio_description', 'supporters_count', 'dancers_count', 'event_date', 'desafio_image'];
      const vals: Record<string, string> = {};
      keys.forEach(key => {
        vals[key] = settings[key]?.value || '';
      });
      setLocalValues(prev => ({ ...prev, ...vals }));
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const keys = ['desafio_title', 'desafio_description', 'supporters_count', 'dancers_count', 'event_date'];
      const results = await Promise.all(keys.map(key => updateSetting(key, localValues[key])));
      
      if (results.every(r => r.success)) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onAlert('Sucesso', 'Seção "O Desafio" salva com sucesso.', 'info');
      } else {
        onAlert('Erro', 'Alguns campos não puderam ser salvos.', 'warning');
      }
    } catch (err) {
      onAlert('Erro ao Salvar', 'Não foi possível salvar esta seção.', 'danger');
    }
    setSaving(false);
  };

  if (loading && Object.keys(settings).length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título do Desafio</label>
          <input 
            type="text"
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl shadow-inner"
            value={localValues['desafio_title'] || ''}
            onChange={(e) => setLocalValues(prev => ({ ...prev, desafio_title: e.target.value }))}
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Descrição Curta</label>
          <textarea 
            rows={1}
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl resize-none shadow-inner"
            value={localValues['desafio_description'] || ''}
            onChange={(e) => setLocalValues(prev => ({ ...prev, desafio_description: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Número de Apoiadores</label>
          <input 
            type="number"
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl shadow-inner"
            value={localValues['supporters_count'] || ''}
            onChange={(e) => setLocalValues(prev => ({ ...prev, supporters_count: e.target.value }))}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Número de Bailarinos</label>
          <input 
            type="number"
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl shadow-inner"
            value={localValues['dancers_count'] || ''}
            onChange={(e) => setLocalValues(prev => ({ ...prev, dancers_count: e.target.value }))}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Data do Evento (YYYY-MM-DD)</label>
          <input 
            type="text"
            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] transition-all text-white/80 rounded-2xl shadow-inner"
            value={localValues['event_date'] || ''}
            onChange={(e) => setLocalValues(prev => ({ ...prev, event_date: e.target.value }))}
            placeholder="2026-09-24"
          />
        </div>
      </div>

      {/* Challenge Image Section */}
      <div className="pt-12 border-t border-white/5">
        <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold mb-6 block ml-1">Imagem de Fundo do Desafio</label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-center">
          <div className="aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative group/img">
            {localValues['desafio_image'] ? (
              <img src={localValues['desafio_image']} alt="Desafio" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 opacity-80" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/5 italic text-xs">Sem imagem</div>
            )}
          </div>
          <div className="md:col-span-3">
            <OptimizedImageUploader 
              onUploadSuccess={async (url) => {
                setSaving(true);
                await updateSetting('desafio_image', url);
                setLocalValues(prev => ({ ...prev, desafio_image: url }));
                setSaving(false);
                onAlert('Imagem Atualizada', 'A imagem do desafio foi salva com sucesso.', 'info');
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

      <div className="pt-8 border-t border-white/5 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className={`px-10 py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 ${
            success ? 'bg-green-600 text-white' : 'bg-brand-orange text-white hover:bg-white hover:text-brand-dark'
          } disabled:opacity-50`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : success ? 'Alterações Salvas' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}
