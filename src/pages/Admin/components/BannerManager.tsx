import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  X, 
  Settings, 
  Trash2, 
  Save 
} from 'lucide-react';
import { useHeroBanners, HeroBanner } from '../../../hooks/useHeroBanners';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

interface BannerManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function BannerManager({ onAlert }: BannerManagerProps) {
  const { banners, loading, updateBanner, addBanner, deleteBanner } = useHeroBanners();
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<HeroBanner | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    setDeleting(true);
    const result = await deleteBanner(bannerToDelete.id);
    if (!result.success) {
      onAlert('Erro de Conexão', 'Não foi possível excluir o banner.', 'danger');
    } else {
      onAlert('Excluído', 'Slide removido com sucesso.', 'info');
    }
    setBannerToDelete(null);
    setDeleting(false);
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-sans italic text-white/60">Slides do Topo (Máx 6)</h3>
        {banners.length < 6 && (
          <button 
            onClick={() => {
              setEditingBanner({ 
                id: 'new', 
                image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2669&auto=format&fit=crop', 
                title: '', 
                subtitle: '', 
                order_index: banners.length 
              });
            }}
            className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Slide
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white/5 border border-white/10 overflow-hidden flex flex-col">
            <div className="aspect-video relative group">
              <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 lg:bg-black/60 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                 <button 
                  onClick={() => setEditingBanner(banner)}
                  className="bg-brand-orange p-3 rounded-full hover:bg-white hover:text-brand-dark transition-all transform lg:scale-90 lg:group-hover:scale-100"
                 >
                   <Settings className="w-4 h-4" />
                 </button>
                 <button 
                  onClick={() => setBannerToDelete(banner)}
                  className="bg-red-500 p-3 rounded-full hover:bg-white hover:text-red-500 transition-all transform lg:scale-90 lg:group-hover:scale-100"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-lg font-sans italic mb-1">{banner.title}</h4>
              <p className="text-xs text-white/40">{banner.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-brand-dark border border-white/10 p-6 md:p-12 max-w-2xl w-full relative overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setEditingBanner(null)}
                className="absolute top-8 right-8 text-white/20 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-sans italic mb-8">
                {editingBanner.id === 'new' ? 'Novo Slide' : 'Editar Slide'}
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Título do Slide</label>
                  <input 
                    type="text"
                    defaultValue={editingBanner.title}
                    id="banner-title"
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Subtítulo / Legenda</label>
                  <input 
                    type="text"
                    defaultValue={editingBanner.subtitle}
                    id="banner-subtitle"
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Imagem do Banner</label>
                  <div className="space-y-4">
                    <input 
                      type="text"
                      defaultValue={editingBanner.image_url}
                      id="banner-url"
                      className="w-full bg-white/5 border border-white/10 p-4 text-[10px] font-mono focus:border-brand-orange outline-none transition-all opacity-50"
                    />
                    <OptimizedImageUploader 
                      onUploadSuccess={(url) => {
                        const input = document.getElementById('banner-url') as HTMLInputElement;
                        if (input) input.value = url;
                      }}
                      onAlert={onAlert}
                      folder="banners"
                      label="Substituir por Foto do Computador"
                    />
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    onClick={() => setEditingBanner(null)}
                    className="flex-1 py-4 text-[10px] uppercase tracking-widest font-bold border border-white/10 hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      const title = (document.getElementById('banner-title') as HTMLInputElement).value;
                      const subtitle = (document.getElementById('banner-subtitle') as HTMLInputElement).value;
                      const image_url = (document.getElementById('banner-url') as HTMLInputElement).value;
                      
                      let result;
                      if (editingBanner.id === 'new') {
                        result = await addBanner({ title, subtitle, image_url, order_index: editingBanner.order_index });
                      } else {
                        result = await updateBanner(editingBanner.id, { title, subtitle, image_url });
                      }

                      if (result.success) {
                        setEditingBanner(null);
                        onAlert('Sucesso', 'Slide salvo com sucesso.', 'info');
                      } else {
                        onAlert('Erro ao Salvar', 'Não foi possível salvar o slide.', 'danger');
                      }
                      setSaving(false);
                    }}
                    className="flex-1 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Salvar Slide
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!bannerToDelete}
        onConfirm={handleDelete}
        onCancel={() => setBannerToDelete(null)}
        title="Excluir Slide"
        message="Tem certeza que deseja excluir este slide do topo? Esta ação não pode ser desfeita."
        variant="danger"
        confirmLabel={deleting ? "Excluindo..." : "Sim, Excluir"}
      />
    </div>
  );
}
