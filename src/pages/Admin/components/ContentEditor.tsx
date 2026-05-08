import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { JourneyManager } from './JourneyManager';
import { FundraisingManager } from './FundraisingManager';
import { TickerManager } from './TickerManager';

interface ContentEditorProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function ContentEditor({ onAlert }: ContentEditorProps) {
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
        onAlert('Sucesso', `Seção "${sectionTitle}" salva com sucesso.`, 'info');
      } else {
        onAlert('Erro parcial', 'Alguns campos não puderam ser salvos.', 'warning');
      }
    } catch (err) {
      onAlert('Erro ao Salvar', 'Não foi possível salvar esta seção.', 'danger');
    }
    setSaving(null);
  };

  if (loading && Object.keys(settings).length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {sections.map(section => (
        <div key={section.title} className="bg-white/[0.02] border border-white/5 p-10 space-y-8 flex flex-col rounded-2xl relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-500">
          {/* Section Header */}
          <div className="relative">
            <h3 className="text-2xl font-serif italic text-white/90 group-hover:text-brand-orange transition-colors duration-500">{section.title}</h3>
            <div className="h-px w-12 bg-brand-orange/30 mt-4 group-hover:w-24 transition-all duration-700" />
          </div>
          
          <div className="space-y-8 flex-1">
            {section.keys.map(key => (
              <div key={key} className="space-y-3">
                <label className="block text-[8px] uppercase tracking-[0.3em] text-white/30 font-bold ml-1">
                  {settings[key]?.label || key}
                </label>
                {key.includes('image') ? (
                  <div className="space-y-4">
                    <div className="flex gap-6 items-center bg-black/20 p-4 rounded-xl border border-white/5">
                      <OptimizedImageUploader 
                        onUploadSuccess={async (url) => {
                          setLocalValues(prev => ({ ...prev, [key]: url }));
                          await updateSetting(key, url);
                          setSuccess(section.title);
                          setTimeout(() => setSuccess(null), 3000);
                          onAlert('Imagem Atualizada', 'A nova imagem foi salva automaticamente.', 'info');
                        }}
                        onAlert={onAlert}
                        className="flex-1"
                      />
                      {localValues[key] && (
                        <div className="w-20 h-20 rounded-lg border border-white/10 overflow-hidden bg-black shadow-2xl flex-shrink-0">
                          <img src={localValues[key]} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : key.includes('subtitle') || key.includes('description') || key.includes('text') ? (
                  <textarea 
                    rows={4} 
                    className="w-full bg-black/40 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange/50 focus:bg-brand-orange/[0.02] outline-none transition-all text-white/80 rounded-xl resize-none"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                ) : (
                  <input 
                    type={key.includes('amount') || key.includes('count') ? 'number' : 'text'}
                    className="w-full bg-black/40 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange/50 focus:bg-brand-orange/[0.02] outline-none transition-all text-white/80 rounded-xl"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

           <div className="pt-8 mt-4 border-t border-white/5">
             <button 
               onClick={() => handleSaveSection(section.title, section.keys)}
               disabled={saving === section.title || section.keys.length === 0}
               className={`w-full py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 ${
                 success === section.title ? 'bg-green-600 text-white' : 'bg-brand-orange text-white hover:bg-white hover:text-brand-dark'
               } disabled:opacity-50`}
             >
               {saving === section.title ? <Loader2 className="w-4 h-4 animate-spin" /> : success === section.title ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
               {saving === section.title ? 'Processando...' : success === section.title ? 'Configurações Salvas' : 'Salvar Alterações'}
             </button>
           </div>

           {/* Nested Managers */}
           {section.title === '01. Seção: Nossa Essência' && (
             <div className="text-[10px] text-white/20 italic mt-4 text-center">
               * Esta seção controla os textos principais da página inicial.
             </div>
           )}

           {section.title === '02. Seção: A Jornada' && (
             <div className="mt-12 pt-12 border-t border-white/10">
               <JourneyManager onAlert={onAlert} />
             </div>
           )}

           {section.title === '03. Seção: O Desafio' && (
             <div className="mt-12 pt-12 border-t border-white/10">
               <FundraisingManager onAlert={onAlert} />
             </div>
           )}

           {section.title === '04. Configurações Globais' && (
             <div className="mt-16 pt-16 border-t border-white/10">
               <h3 className="text-2xl font-serif italic mb-10 text-white/90">Gerenciador de Frases (Ticker Bar)</h3>
               <TickerManager onAlert={onAlert} />
             </div>
           )}
        </div>
      ))}
      </div>
    </div>
  );
}
