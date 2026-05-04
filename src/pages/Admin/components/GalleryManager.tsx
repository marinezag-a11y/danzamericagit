import React, { useState } from 'react';
import { 
  Loader2, 
  Plus, 
  Save, 
  Trash2, 
  Pencil 
} from 'lucide-react';
import { useGallery } from '../../../hooks/useGallery';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

interface GalleryManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function GalleryManager({ onAlert }: GalleryManagerProps) {
  const { images, loading, addImage, updateImage, deleteImage } = useGallery();
  const [editingImage, setEditingImage] = useState<any>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [adding, setAdding] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const handleStartEdit = (image: any) => {
    setEditingImage(image);
    setNewUrl(image.url);
    setNewCaption(image.caption);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
    setNewUrl('');
    setNewCaption('');
  };

  const handleSave = async () => {
    if (!newUrl) return;
    setAdding(true);
    setStatus({ type: 'info', message: editingImage ? 'Atualizando foto...' : 'Salvando na galeria...' });
    
    let result;
    if (editingImage) {
      result = await updateImage(editingImage.id, { url: newUrl, caption: newCaption });
    } else {
      result = await addImage(newUrl, newCaption);
    }

    if (result.success) {
      setNewUrl('');
      setNewCaption('');
      setEditingImage(null);
      setStatus({ type: 'success', message: editingImage ? 'Foto atualizada!' : 'Foto adicionada com sucesso!' });
      onAlert('Sucesso', editingImage ? 'Foto atualizada na galeria.' : 'Foto adicionada à galeria.', 'info');
      setTimeout(() => setStatus(null), 3000);
    } else {
      onAlert('Erro', 'Não foi possível salvar a imagem: ' + result.error, 'danger');
      setStatus(null);
    }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;
    const result = await deleteImage(imageToDelete);
    if (result.success) {
      onAlert('Excluído', 'Foto removida da galeria.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível excluir a foto.', 'danger');
    }
    setImageToDelete(null);
  };

  if (loading && images.length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-12">
      <div className={`bg-white/5 border p-8 transition-all duration-500 rounded-sm ${editingImage ? 'border-brand-orange ring-1 ring-brand-orange/20' : 'border-white/10'}`}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-sans italic text-white/80">
            {editingImage ? 'Editando Foto' : 'Adicionar Nova Foto'}
          </h3>
          {editingImage && (
            <button 
              onClick={handleCancelEdit}
              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Cancelar Edição
            </button>
          )}
        </div>
        
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 border border-white/5 bg-white/5 space-y-4">
                <OptimizedImageUploader 
                  onUploadSuccess={(url) => setNewUrl(url)}
                  onAlert={onAlert}
                  label="Selecionar do Computador"
                  folder="gallery"
                />
              </div>

              <div className="p-6 border border-white/5 bg-white/5 space-y-4">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Ou Link Externo</label>
                <input 
                  type="text"
                  className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all text-white"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-8 flex flex-col">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Legenda da Foto</label>
                <input 
                  type="text"
                  className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all text-white"
                  placeholder="Ex: Danzamerica 2026 - Noite de Gala"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                />
              </div>

              {newUrl && (
                <div className="aspect-video border border-white/10 overflow-hidden bg-black/50">
                   <img src={newUrl} className="w-full h-full object-contain" alt="Preview" />
                </div>
              )}

              <div className="mt-auto pt-6">
                <button 
                   onClick={handleSave}
                   disabled={adding || !newUrl}
                   className="w-full py-5 bg-brand-orange text-white text-[12px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : editingImage ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingImage ? 'Salvar Alterações' : 'Finalizar e Adicionar à Galeria'}
                </button>
              </div>
            </div>
          </div>
          {status && (
            <div className={`p-4 text-xs font-bold uppercase tracking-widest rounded-sm ${
              status.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/20' :
              status.type === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500/20' :
              'bg-blue-500/20 text-blue-500 border border-blue-500/20'
            }`}>
              {status.message}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {images?.map((image) => (
          <div key={image.id} className="group flex flex-col">
            <div className="relative aspect-square bg-white/5 border border-white/10 overflow-hidden mb-3">
              <img src={image.url} alt={image.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 lg:bg-black/60 lg:opacity-0 lg:group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                <button 
                  onClick={() => handleStartEdit(image)}
                  className="p-3 bg-brand-orange text-white rounded-full hover:bg-white hover:text-brand-dark transition-all transform lg:translate-y-4 lg:group-hover:translate-y-0 shadow-lg"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setImageToDelete(image.id)}
                  className="p-3 bg-red-500 text-white rounded-full hover:bg-white hover:text-red-500 transition-all transform lg:translate-y-4 lg:group-hover:translate-y-0 shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold truncate px-1">{image.caption || 'Sem legenda'}</p>
          </div>
        ))}
      </div>

      <ConfirmModal 
        isOpen={!!imageToDelete}
        onConfirm={handleDelete}
        onCancel={() => setImageToDelete(null)}
        title="Excluir Foto"
        message="Deseja remover esta foto da galeria? Esta ação não pode ser desfeita."
        variant="danger"
      />
    </div>
  );
}
