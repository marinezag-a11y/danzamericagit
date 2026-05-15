import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Plus, 
  Save, 
  Trash2, 
  Pencil,
  X,
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../../../hooks/useGallery';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

interface GalleryManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function GalleryManager({ onAlert }: GalleryManagerProps) {
  const { images, loading, addImage, updateImage, deleteImage } = useGallery();
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSave = async () => {
    if (!newUrl) return;
    setAdding(true);
    const result = await addImage(newUrl, newCaption);
    if (result.success) {
      setNewUrl('');
      setNewCaption('');
      setIsAdding(false);
      onAlert('Sucesso', 'Foto adicionada à galeria.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível salvar a imagem.', 'danger');
    }
    setAdding(false);
  };

  if (loading && images.length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Accordion for New Photo */}
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
                Adicionar Nova Foto
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">Fazer upload de novos registros do evento</p>
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
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="p-10 bg-black/40 border border-white/10 rounded-[2rem] space-y-8 shadow-inner">
                        <div className="space-y-4">
                          <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Upload de Imagem</label>
                          <OptimizedImageUploader 
                            onUploadSuccess={(url) => setNewUrl(url)}
                            onAlert={onAlert}
                            folder="gallery"
                            maxWidth={800}
                          />
                        </div>
                        <div className="pt-8 border-t border-white/5 space-y-4">
                          <label className="block text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold ml-1 italic">Ou colar link direto</label>
                          <input 
                            type="text"
                            className="w-full bg-black/40 border border-white/5 p-5 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/60 rounded-xl"
                            placeholder="https://exemplo.com/foto.jpg"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Legenda / Descrição</label>
                        <input 
                          type="text"
                          className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                          placeholder="Ex: Danzamerica 2026 - Noite de Gala"
                          value={newCaption}
                          onChange={(e) => setNewCaption(e.target.value)}
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1 italic">Pré-visualização</label>
                        <div className="aspect-video bg-black rounded-[2rem] border border-white/10 overflow-hidden relative shadow-2xl">
                          {newUrl ? (
                            <img src={newUrl} className="w-full h-full object-contain" alt="Preview" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/5 italic">
                              <ImageIcon className="w-12 h-12 mb-4" />
                              <span className="text-[10px] uppercase tracking-widest font-bold">Aguardando Imagem...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex justify-end">
                    <button 
                       type="submit"
                       disabled={adding}
                       className="px-12 py-5 bg-brand-orange text-white text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl rounded-xl"
                    >
                      {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
                      Publicar na Galeria
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List of Photos as Accordions */}
      <div className="space-y-4 pt-12">
        <div className="flex flex-col gap-2 ml-1 mb-6">
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">Imagens Publicadas ({images.length})</h4>
          <div className="h-px w-12 bg-white/5" />
        </div>
        
        {images?.map((image, index) => (
          <GalleryItemAccordion 
            key={image.id} 
            image={image} 
            index={index + 1}
            onUpdate={updateImage} 
            onDelete={deleteImage}
            onAlert={onAlert}
          />
        ))}
      </div>
    </div>
  );
}

interface GalleryItemAccordionProps {
  image: any;
  index: number;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onAlert: (t: string, m: string, v: any) => void;
}

const GalleryItemAccordion: React.FC<GalleryItemAccordionProps> = ({ image, index, onUpdate, onDelete, onAlert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localUrl, setLocalUrl] = useState(image.url);
  const [localCaption, setLocalCaption] = useState(image.caption);
  const [itemToDelete, setItemToDelete] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setLocalUrl(image.url);
      setLocalCaption(image.caption);
    }
  }, [image, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate(image.id, { url: localUrl, caption: localCaption });
    setSaving(false);
    if (result.success) {
      setIsOpen(false);
      onAlert('Sucesso', 'Foto atualizada com sucesso.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível atualizar.', 'danger');
    }
  };

  const handleDelete = async () => {
    const result = await onDelete(image.id);
    if (result.success) {
      onAlert('Excluído', 'Foto removida.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível excluir.', 'danger');
    }
    setItemToDelete(false);
  };

  return (
    <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
      isOpen 
        ? 'bg-black/30 border-white/10 shadow-2xl' 
        : 'bg-black/10 border-white/5 hover:border-white/20'
    }`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-8 flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <div className="text-[10px] font-bold text-white/10 group-hover:text-brand-orange transition-colors font-sans w-6 text-center">
            {index.toString().padStart(2, '0')}
          </div>
          <div className="w-16 h-12 bg-black rounded-lg overflow-hidden border border-white/5 relative flex-shrink-0">
             <img src={image.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt="" />
          </div>
          <div className="text-left">
            <h3 className={`text-lg font-serif italic transition-all duration-500 ${
              isOpen ? 'text-white' : 'text-white/40 group-hover:text-white/60'
            }`}>
              {image.caption || 'Foto sem legenda'}
            </h3>
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
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Legenda da Foto</label>
                    <input 
                      type="text" value={localCaption}
                      onChange={(e) => setLocalCaption(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Substituir Imagem</label>
                    <OptimizedImageUploader 
                      onUploadSuccess={(url) => setLocalUrl(url)}
                      onAlert={onAlert}
                      folder="gallery"
                      maxWidth={800}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Ampliação</label>
                   <div className="aspect-video bg-black rounded-[2rem] border border-white/10 overflow-hidden relative shadow-2xl">
                     <img src={localUrl} className="w-full h-full object-contain" alt="" />
                   </div>
                </div>
              </div>

              <div className="pt-12 border-t border-white/5 flex justify-between items-center">
                <button 
                  onClick={() => setItemToDelete(true)}
                  className="flex items-center gap-3 px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Foto
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
        isOpen={itemToDelete}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(false)}
        title="Excluir Foto?"
        message="Deseja remover esta foto da galeria? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  );
}
