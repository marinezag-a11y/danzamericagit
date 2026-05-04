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
import { HelpItemsManager } from './HelpItemsManager';

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
      title: '04. Seção: Como Ajudar',
      keys: ['help_title', 'help_image']
    },
    {
      title: '05. Configurações Globais',
      keys: ['pix_key', 'vakinha_url']
    }
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {sections.map(section => (
        <div key={section.title} className="bg-white/5 border border-white/10 p-8 space-y-6 flex flex-col rounded-sm">
          <h3 className="text-xl font-sans italic mb-4 text-white/80">{section.title}</h3>
          
          <div className="space-y-6 flex-1">
            {section.keys.map(key => (
              <div key={key}>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">
                  {settings[key]?.label || key}
                </label>
                {key.includes('image') ? (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
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
                        <div className="w-16 h-16 border border-white/10 overflow-hidden bg-black/50">
                          <img src={localValues[key]} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : key.includes('subtitle') || key.includes('description') || key.includes('text') ? (
                  <textarea 
                    rows={3} 
                    className="w-full bg-black/50 border border-white/10 p-3 text-sm font-sans focus:border-brand-orange focus:outline-none transition-all text-white"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                ) : (
                  <input 
                    type={key.includes('amount') || key.includes('count') ? 'number' : 'text'}
                    className="w-full bg-black/50 border border-white/10 p-3 text-sm font-sans focus:border-brand-orange focus:outline-none transition-all text-white"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

           <div className="pt-6 mt-6 border-t border-white/5">
             <button 
               onClick={() => handleSaveSection(section.title, section.keys)}
               disabled={saving === section.title || section.keys.length === 0}
               className={`w-full py-4 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
                 success === section.title ? 'bg-green-500 text-white' : 'bg-brand-orange text-white hover:bg-white hover:text-brand-dark'
               } disabled:opacity-50`}
             >
               {saving === section.title ? <Loader2 className="w-3 h-3 animate-spin" /> : success === section.title ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
               {saving === section.title ? 'Salvando...' : success === section.title ? 'Salvo com Sucesso' : 'Salvar Alterações'}
             </button>
           </div>

           {/* Nested Managers */}
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

           {section.title === '04. Seção: Como Ajudar' && (
             <div className="mt-12 pt-12 border-t border-white/10">
               <HelpItemsManager onAlert={onAlert} />
             </div>
           )}

           {section.title === '05. Configurações Globais' && (
             <div className="mt-16 pt-16 border-t border-white/10">
               <h3 className="text-xl font-sans italic mb-8 text-white/80">Gerenciador de Frases (Barra de Links)</h3>
               <TickerManager onAlert={onAlert} />
             </div>
           )}
        </div>
      ))}
      </div>
    </div>
  );
}
