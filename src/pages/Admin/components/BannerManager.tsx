import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  X, 
  Settings, 
  Trash2, 
  Save,
  ChevronDown,
  Layout
} from 'lucide-react';
import { useHeroBanners, HeroBanner } from '../../../hooks/useHeroBanners';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

interface BannerManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function BannerManager({ onAlert }: BannerManagerProps) {
  const { banners, loading, updateBanner, addBanner, deleteBanner } = useHeroBanners();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newUrl, setNewUrl] = useState('https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2669&auto=format&fit=crop');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setSaving(true);
    const result = await addBanner({ 
      title: newTitle, 
      subtitle: newSubtitle, 
      image_url: newUrl, 
      order_index: (banners || []).length 
    });
    
    if (result.success) {
      setIsAdding(false);
      setNewTitle('');
      setNewSubtitle('');
      onAlert('Sucesso', 'Novo slide adicionado ao topo.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível adicionar o slide.', 'danger');
    }
    setSaving(false);
  };

  if (loading && banners.length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Accordion for New Banner */}
      {banners.length < 6 && (
        <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
          isAdding 
            ? 'bg-black/30 border-white/10 shadow-2xl' 
            : 'bg-black/10 border-white/5 hover:border-white/20'
        }`}>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-full p-10 flex items-center justify-between group"
          >
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                isAdding 
                  ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange' 
                  : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'
              }`}>
                <Plus className={`w-6 h-6 transition-transform duration-500 ${isAdding ? 'rotate-45' : ''}`} />
              </div>
              <div className="text-left">
                <h3 className={`text-2xl font-serif italic transition-all duration-500 ${
                  isAdding ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                }`}>
                  Adicionar Novo Slide ao Topo
                </h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">
                  Crie uma nova vitrine de impacto para a página inicial ({banners.length}/6)
                </p>
              </div>
            </div>
          </button>

          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
              >
                <div className="px-12 pb-12">
                  <form onSubmit={handleCreate} className="space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título do Banner</label>
                          <input 
                            type="text" required value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                            placeholder="Ex: Danzamerica 2026"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Subtítulo / Chamada</label>
                          <input 
                            type="text" value={newSubtitle}
                            onChange={(e) => setNewSubtitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/60 rounded-2xl shadow-inner"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Imagem de Fundo (1920x1080)</label>
                          <OptimizedImageUploader 
                            onUploadSuccess={(url) => setNewUrl(url)}
                            onAlert={onAlert}
                            folder="banners"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-8">
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Pré-visualização do Slide</label>
                        <div className="aspect-video bg-black rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl group">
                          <img src={newUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt="Preview" />
                          <div className="absolute inset-0 flex flex-col justify-center px-12 space-y-2">
                             <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-serif">{newSubtitle || 'Subtítulo do Banner'}</p>
                             <h4 className="text-3xl font-serif italic text-white leading-tight">{newTitle || 'Título de Impacto'}</h4>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex justify-end">
                      <button 
                        type="submit" disabled={saving}
                        className="px-12 py-5 bg-brand-orange text-white font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50 shadow-2xl rounded-xl flex items-center gap-4"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
                        Publicar Novo Slide
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* List of Active Banners as Accordions */}
      <div className="space-y-4 pt-12">
        <div className="flex flex-col gap-2 ml-1 mb-6">
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">Slides Ativos ({banners.length})</h4>
          <div className="h-px w-12 bg-white/5" />
        </div>
        
        {banners.map((banner, index) => (
          <BannerAccordion 
            key={banner.id} 
            banner={banner} 
            index={index + 1}
            onUpdate={updateBanner} 
            onDelete={deleteBanner}
            onAlert={onAlert}
          />
        ))}
      </div>
    </div>
  );
}

interface BannerAccordionProps {
  banner: HeroBanner;
  index: number;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onAlert: (t: string, m: string, v: any) => void;
}

const BannerAccordion: React.FC<BannerAccordionProps> = ({ banner, index, onUpdate, onDelete, onAlert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localTitle, setLocalTitle] = useState(banner.title);
  const [localSubtitle, setLocalSubtitle] = useState(banner.subtitle);
  const [localImageUrl, setLocalImageUrl] = useState(banner.image_url);
  const [bannerToDelete, setBannerToDelete] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setLocalTitle(banner.title);
      setLocalSubtitle(banner.subtitle);
      setLocalImageUrl(banner.image_url);
    }
  }, [banner, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate(banner.id, {
      title: localTitle,
      subtitle: localSubtitle,
      image_url: localImageUrl
    });
    setSaving(false);
    if (result.success) {
      setIsOpen(false);
      onAlert('Sucesso', 'Slide atualizado com sucesso.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível salvar as alterações.', 'danger');
    }
  };

  const handleDelete = async () => {
    const result = await onDelete(banner.id);
    if (result.success) {
      onAlert('Excluído', 'Slide removido com sucesso.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível excluir.', 'danger');
    }
    setBannerToDelete(false);
  };

  return (
    <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
      isOpen 
        ? 'bg-black/30 border-white/10 shadow-2xl' 
        : 'bg-black/10 border-white/5 hover:border-white/20'
    }`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-10 flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <div className="text-[10px] font-bold text-white/10 group-hover:text-brand-orange transition-colors font-sans">
            {index.toString().padStart(2, '0')}
          </div>
          <div className="text-left">
            <h3 className={`text-xl font-serif italic transition-all duration-500 ${
              isOpen ? 'text-white' : 'text-white/40 group-hover:text-white/60'
            }`}>
              {banner.title}
            </h3>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">
              Slide #{banner.order_index + 1} • {banner.subtitle || 'Sem subtítulo'}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/10 group-hover:text-white/40 transition-all duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-12 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título do Slide</label>
                    <input 
                      type="text" value={localTitle}
                      onChange={(e) => setLocalTitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Subtítulo</label>
                    <input 
                      type="text" value={localSubtitle}
                      onChange={(e) => setLocalSubtitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/60 rounded-2xl shadow-inner"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Imagem de Fundo</label>
                    <OptimizedImageUploader 
                      onUploadSuccess={(url) => setLocalImageUrl(url)}
                      onAlert={onAlert}
                      folder="banners"
                      label="Substituir Imagem"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Pré-visualização</label>
                  <div className="aspect-video bg-black rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl">
                    <img src={localImageUrl} className="w-full h-full object-cover opacity-60" alt="" />
                    <div className="absolute inset-0 flex flex-col justify-center px-12 space-y-2">
                       <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-serif">{localSubtitle}</p>
                       <h4 className="text-3xl font-serif italic text-white leading-tight">{localTitle}</h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-white/5 flex justify-between items-center">
                <button 
                  onClick={() => setBannerToDelete(true)}
                  className="flex items-center gap-3 px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Slide
                </button>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-10 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all rounded-xl flex items-center gap-3 shadow-2xl disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={bannerToDelete}
        onConfirm={handleDelete}
        onCancel={() => setBannerToDelete(false)}
        title="Excluir Slide?"
        message="Esta ação é permanente e o banner deixará de ser exibido na página inicial imediatamente."
        variant="danger"
        confirmLabel="Sim, Excluir"
      />
    </div>
  );
}
