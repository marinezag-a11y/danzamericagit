import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  Save, 
  Check, 
  CheckCircle2 
} from 'lucide-react';
import { useHelpItems, HelpItem } from '../../../hooks/useHelpItems';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { maskBRL, parseBRL } from '../../../lib/utils';

interface HelpItemsManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function HelpItemsManager({ onAlert }: HelpItemsManagerProps) {
  const { items, loading, updateItem, addItem, deleteItem } = useHelpItems();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [newPrice, setNewPrice] = useState(0);
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2670&auto=format&fit=crop');

  const handleAddNew = async () => {
    if (!newTitle) return;
    setAdding(true);
    const result = await addItem({
      title: newTitle,
      description: newDescription,
      image_url: newImageUrl,
      price: newPrice,
      button_text: 'Fazer Pedido',
      modal_type: 'store',
      order: (items || []).length + 1
    });
    setAdding(false);
    if (result.success) {
      setIsAdding(false);
      setNewTitle('');
      setNewDescription('');
      setNewPrice(0);
      setNewImageUrl('https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2670&auto=format&fit=crop');
      onAlert('Sucesso!', 'Item adicionado com sucesso.', 'info');
    } else {
      onAlert('Erro', 'Erro ao adicionar item: ' + result.error, 'danger');
    }
  };

  if (loading && items.length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 italic">Gerenciar Cards "Como Ajudar"</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm ${isAdding ? 'bg-white/5 text-white/40' : 'bg-brand-orange text-white shadow-lg hover:scale-105'}`}
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancelar' : 'Incluir Novo Item'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 border border-white/10 p-8 space-y-6 rounded-sm mb-12 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">Título do Novo Card</label>
                    <input 
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all text-white"
                      placeholder="Ex: Doação de Materiais"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">Valor do Item (R$)</label>
                    <input 
                      type="text"
                      value={maskBRL(newPrice)}
                      onChange={(e) => setNewPrice(parseBRL(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all text-brand-orange font-bold"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">Descrição Curta</label>
                    <input 
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all text-white"
                      placeholder="Conte como essa ajuda faz a diferença..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">Imagem da Seção</label>
                  <div className="aspect-video bg-black/50 border border-white/10 overflow-hidden relative mb-2">
                    <img src={newImageUrl} alt="" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <OptimizedImageUploader 
                        onUploadSuccess={(url) => setNewImageUrl(url)}
                        onAlert={onAlert}
                        folder="help"
                        label="Subir Imagem do Card"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleAddNew}
                disabled={adding || !newTitle}
                className="w-full py-4 bg-brand-orange text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50 shadow-xl"
              >
                {adding ? 'Criando...' : 'Confirmar e Adicionar Card'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {items.map((item) => (
          <HelpItemCard 
            key={item.id} 
            item={item} 
            onUpdate={updateItem} 
            onDelete={deleteItem}
            onAlert={onAlert}
          />
        ))}
      </div>
    </div>
  );
}

function HelpItemCard({ item, onUpdate, onDelete, onAlert }: { item: HelpItem, onUpdate: (id: string, updates: any) => Promise<any>, onDelete: (id: string) => Promise<any>, onAlert: (t: string, m: string, v: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localTitle, setLocalTitle] = useState(item.title);
  const [localDescription, setLocalDescription] = useState(item.description);
  const [localButtonText, setLocalButtonText] = useState(item.button_text);
  const [localImageUrl, setLocalImageUrl] = useState(item.image_url);
  const [localPrice, setLocalPrice] = useState(item.price || 0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setLocalTitle(item.title);
      setLocalDescription(item.description);
      setLocalButtonText(item.button_text);
      setLocalImageUrl(item.image_url);
      setLocalPrice(item.price || 0);
    }
  }, [item, isEditing]);

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate(item.id, {
      title: localTitle,
      description: localDescription,
      button_text: localButtonText,
      image_url: localImageUrl,
      price: localPrice
    });
    setSaving(false);
    if (result.success) {
      setIsEditing(false);
      setShowSuccess(true);
      onAlert('Sucesso', 'Item atualizado com sucesso.', 'info');
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      onAlert('Erro', 'Erro ao atualizar item: ' + result.error, 'danger');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const result = await onDelete(itemToDelete);
    if (result.success) {
      onAlert('Excluído', 'Item removido com sucesso.', 'info');
    } else {
      onAlert('Erro', 'Erro ao excluir item.', 'danger');
    }
    setItemToDelete(null);
  };

  return (
    <div className="bg-white/5 border border-white/10 p-6 md:p-8 space-y-6 flex flex-col relative group hover:border-white/20 transition-all rounded-sm">
      <div className="flex justify-between items-start">
        {isEditing ? (
          <input 
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            className="text-xl font-sans italic text-brand-orange bg-black/50 border-b border-brand-orange/30 outline-none w-full p-1"
          />
        ) : (
          <h3 className="text-xl font-sans italic text-brand-orange">{item.title}</h3>
        )}
        
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-white/20 hover:text-brand-orange transition-all"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setItemToDelete(item.id)}
            className="p-2 text-white/20 hover:text-red-500 transition-all"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Descrição</label>
          {isEditing ? (
            <textarea 
              rows={4}
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-3 text-sm font-sans focus:border-brand-orange outline-none transition-all text-white"
            />
          ) : (
            <p className="text-sm text-white/60 font-sans leading-relaxed">{item.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Valor do Item (R$)</label>
          {isEditing ? (
            <input 
              type="text"
              value={maskBRL(localPrice)}
              onChange={(e) => setLocalPrice(parseBRL(e.target.value))}
              className="w-full bg-black/50 border border-white/10 p-3 text-sm font-sans focus:border-brand-orange outline-none transition-all text-brand-orange font-bold"
              placeholder="R$ 0,00"
            />
          ) : (
            <p className="text-xl font-display text-brand-orange">{maskBRL(item.price || 0)}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Imagem da Seção</label>
          <div className="space-y-4">
            <div className="aspect-video bg-black/50 border border-white/10 overflow-hidden relative group-hover:border-brand-orange/20 transition-all">
              <img src={isEditing ? localImageUrl : item.image_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                  <OptimizedImageUploader 
                    onUploadSuccess={(url) => setLocalImageUrl(url)}
                    onAlert={onAlert}
                    folder="help"
                    label="Alterar Imagem"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Texto do Botão</label>
            <input 
              type="text"
              value={localButtonText}
              onChange={(e) => setLocalButtonText(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-3 text-sm font-sans focus:border-brand-orange outline-none transition-all text-white"
            />
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="flex gap-4 pt-4 border-t border-white/10">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-brand-orange text-white py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Alterações
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="px-6 py-3 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-all"
          >
            Cancelar
          </button>
        </div>
      ) : showSuccess && (
        <div className="pt-4 border-t border-green-500/20 flex items-center gap-3 text-green-500 text-[10px] uppercase tracking-widest font-bold">
          <CheckCircle2 className="w-4 h-4" />
          Alterado com sucesso!
        </div>
      )}

      <ConfirmModal 
        isOpen={!!itemToDelete}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
        title="Excluir Item"
        message="Tem certeza que deseja excluir este item de ajuda? Esta ação removerá o card da loja solidária."
        variant="danger"
      />
    </div>
  );
}
