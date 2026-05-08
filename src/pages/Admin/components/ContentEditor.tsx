import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Save, 
  CheckCircle2,
  ChevronDown,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { JourneyManager } from './JourneyManager';
import { FundraisingManager } from './FundraisingManager';
import { TickerManager } from './TickerManager';
import { HelpItemsManager } from './HelpItemsManager';
import { GalleryManager } from './GalleryManager';

interface ContentEditorProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function ContentEditor({ onAlert }: ContentEditorProps) {
  const { settings, loading, updateSetting } = useSiteSettings();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('01. Seção: Nossa Essência');

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

  const toggleSection = (title: string) => {
    setExpandedSection(prev => prev === title ? null : title);
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
    },
    {
      title: '05. Loja: Compre um Sonho',
      keys: []
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-20">
      {sections.map(section => {
        const isExpanded = expandedSection === section.title;
        
        return (
          <div 
            key={section.title} 
            className={`border transition-all duration-500 overflow-hidden rounded-3xl ${
              isExpanded 
                ? 'bg-black/30 border-white/10 shadow-2xl' 
                : 'bg-black/10 border-white/5 hover:border-white/20'
            }`}
          >
            {/* Section Header Button */}
            <button 
              onClick={() => toggleSection(section.title)}
              className="w-full p-10 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={`p-3 rounded-xl border transition-all duration-500 ${
                  isExpanded 
                    ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange' 
                    : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'
                }`}>
                  <Settings className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className={`text-2xl font-serif italic transition-all duration-500 ${
                    isExpanded ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                  }`}>
                    {section.title}
                  </h3>
                  {isExpanded && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: 48 }}
                      className="h-0.5 bg-brand-orange/60 mt-3 rounded-full"
                    />
                  )}
                </div>
              </div>
              <ChevronDown className={`w-6 h-6 transition-transform duration-500 ${
                isExpanded ? 'rotate-180 text-brand-orange' : 'text-white/10 group-hover:text-white/30'
              }`} />
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <div className="px-12 pb-12 space-y-12">
                    {section.keys.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {section.keys.map(key => (
                          <div key={key} className="space-y-4">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">
                              {settings[key]?.label || key.replace(/_/g, ' ')}
                            </label>
                            {key.includes('image') ? (
                              <div className="space-y-6">
                                <div className="aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative group/img">
                                  {localValues[key] ? (
                                    <img src={localValues[key]} className="w-full h-full object-cover opacity-80 group-hover/img:scale-105 transition-transform duration-700" alt="Preview" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/5 italic text-xs">Sem imagem</div>
                                  )}
                                </div>
                                <OptimizedImageUploader 
                                  onUploadSuccess={async (url) => {
                                    setLocalValues(prev => ({ ...prev, [key]: url }));
                                    await updateSetting(key, url);
                                    setSuccess(section.title);
                                    setTimeout(() => setSuccess(null), 3000);
                                    onAlert('Imagem Atualizada', 'A nova imagem foi salva automaticamente.', 'info');
                                  }}
                                  onAlert={onAlert}
                                />
                              </div>
                            ) : key.includes('subtitle') || key.includes('description') || key.includes('text') ? (
                              <textarea 
                                rows={6} 
                                className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] outline-none transition-all text-white/80 rounded-2xl resize-none shadow-inner"
                                value={localValues[key] || ''}
                                onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                              />
                            ) : (
                              <input 
                                type={key.includes('amount') || key.includes('count') ? 'number' : 'text'}
                                className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 focus:bg-brand-orange/[0.02] outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                                value={localValues[key] || ''}
                                onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {section.keys.length > 0 && (
                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <button 
                          onClick={() => handleSaveSection(section.title, section.keys)}
                          disabled={saving === section.title}
                          className={`px-10 py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 ${
                            success === section.title ? 'bg-green-600 text-white' : 'bg-brand-orange text-white hover:bg-white hover:text-brand-dark'
                          } disabled:opacity-50`}
                        >
                          {saving === section.title ? <Loader2 className="w-4 h-4 animate-spin" /> : success === section.title ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                          {saving === section.title ? 'Salvando...' : success === section.title ? 'Alterações Salvas' : 'Salvar Alterações'}
                        </button>
                      </div>
                    )}

                    {/* Nested Managers */}
                    {section.title === '01. Seção: Nossa Essência' && (
                      <div className="text-[10px] text-white/20 italic text-center mt-4">
                        * Esta seção controla os textos principais da página inicial.
                      </div>
                    )}

                    {section.title === '02. Seção: A Jornada' && (
                      <div className="border-t border-white/5 pt-12">
                        <JourneyManager onAlert={onAlert} />
                      </div>
                    )}

                    {section.title === '03. Seção: O Desafio' && (
                      <div className="border-t border-white/5 pt-12">
                        <FundraisingManager onAlert={onAlert} />
                      </div>
                    )}

                    {section.title === '04. Configurações Globais' && (
                      <div className="border-t border-white/5 pt-12 space-y-12">
                        <div>
                          <h4 className="text-xl font-serif italic text-white/60 mb-8">Gerenciador de Frases (Ticker Bar)</h4>
                          <TickerManager onAlert={onAlert} />
                        </div>
                      </div>
                    )}

                    {section.title === '05. Loja: Compre um Sonho' && (
                      <div className="border-t border-white/5 pt-12">
                        <HelpItemsManager onAlert={onAlert} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
