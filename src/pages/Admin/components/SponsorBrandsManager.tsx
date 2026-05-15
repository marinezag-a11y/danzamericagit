import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Image as ImageIcon, Pencil } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSponsorBrands, SponsorBrand } from '../../../hooks/useSponsorBrands';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

interface SponsorBrandsManagerProps {
  onAlert: (type: 'success' | 'error', message: string) => void;
}

export function SponsorBrandsManager({ onAlert }: SponsorBrandsManagerProps) {
  const { brands, loading, refetch } = useSponsorBrands();
  const [isAdding, setIsAdding] = useState(false);
  const [editingBrand, setEditingBrand] = useState<SponsorBrand | null>(null);
  const [name, setName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const startEdit = (brand: SponsorBrand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setLinkUrl(brand.link_url || '');
    setLogoUrl(brand.logo_url);
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingBrand(null);
    setName('');
    setLinkUrl('');
    setLogoUrl('');
  };

  const handleSave = async () => {
    if (!name || !logoUrl) {
      onAlert('error', 'Nome e Logo são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      if (editingBrand) {
        const { error } = await supabase
          .from('sponsor_brands')
          .update({
            name,
            logo_url: logoUrl,
            link_url: linkUrl,
          })
          .eq('id', editingBrand.id);
        if (error) throw error;
        onAlert('success', 'Marca atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('sponsor_brands')
          .insert([{
            name,
            logo_url: logoUrl,
            link_url: linkUrl,
            is_active: true
          }]);
        if (error) throw error;
        onAlert('success', 'Marca adicionada com sucesso');
      }

      closeForm();
      refetch();
    } catch (error: any) {
      onAlert('error', error.message || 'Erro ao salvar marca');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('sponsor_brands')
        .delete()
        .eq('id', itemToDelete);

      if (error) throw error;
      onAlert('success', 'Marca excluída');
      refetch();
    } catch (error: any) {
      onAlert('error', error.message || 'Erro ao excluir');
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-serif text-white italic">Marcas Patrocinadoras</h3>
          <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Exibição de logos no rodapé do site</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-brand-orange text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-orange transition-all"
          >
            <Plus className="w-4 h-4" /> Adicionar Marca
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 border border-white/10 p-8 rounded-2xl space-y-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h4 className="text-brand-orange text-[10px] uppercase tracking-widest font-black">
                {editingBrand ? 'Editando Marca' : 'Nova Marca'}
              </h4>
              <button onClick={closeForm} className="text-white/20 hover:text-white transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2 ml-1">Logo da Marca</label>
                  <OptimizedImageUploader 
                    folder="sponsors"
                    maxWidth={800}
                    onUploadSuccess={(url) => setLogoUrl(url)}
                    onAlert={(t, m, v) => onAlert(v === 'danger' ? 'error' : 'success', m)}
                    className="h-48"
                  />
                  {logoUrl && (
                    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center aspect-video relative group">
                      <img src={logoUrl} alt="Preview" className="max-h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <p className="text-[8px] text-white uppercase font-bold tracking-widest">Logo Atual</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2 ml-1">Nome da Empresa</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                    placeholder="Ex: Coca-Cola"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2 ml-1">Link (Site / Instagram)</label>
                  <div className="relative group">
                    <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange" />
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 pl-14 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
              <button 
                onClick={closeForm}
                className="px-6 py-2 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-brand-orange text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-brand-orange/20"
              >
                {isSaving ? 'Salvando...' : editingBrand ? 'Atualizar Marca' : 'Salvar Marca'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {brands.map((brand) => (
          <motion.div 
            key={brand.id}
            layout
            className="bg-white/5 border border-white/10 p-6 rounded-2xl group relative hover:border-brand-orange/40 transition-all"
          >
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button 
                onClick={() => startEdit(brand)}
                className="p-3 bg-brand-orange text-white rounded-full hover:scale-110 transition-all shadow-xl"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setItemToDelete(brand.id)}
                className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-all shadow-xl"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video flex items-center justify-center p-4 mb-4 bg-white/[0.02] rounded-xl overflow-hidden">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <ImageIcon className="w-8 h-8 text-white/10" />
              )}
            </div>

            <h4 className="text-white text-center font-medium mb-1 truncate px-2">{brand.name}</h4>
            {brand.link_url && (
              <p className="text-[9px] text-white/20 text-center flex items-center justify-center gap-1">
                <ExternalLink className="w-2 h-2" /> {new URL(brand.link_url).hostname}
              </p>
            )}
          </motion.div>
        ))}

        {brands.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <ImageIcon className="w-12 h-12 text-white/5 mx-auto mb-4" />
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-black">Nenhuma marca cadastrada</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!itemToDelete}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
        title="Excluir Marca?"
        message="Deseja remover permanentemente esta marca patrocinadora?"
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  );
}
