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
  CheckCircle2,
  Play,
  Pause,
  ChevronDown,
  ShoppingBag
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
  const [newCostPrice, setNewCostPrice] = useState(0);
  const [newOptions, setNewOptions] = useState<string[]>([]);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2670&auto=format&fit=crop');

  const handleAddNew = async () => {
    if (!newTitle) return;
    setAdding(true);
    const result = await addItem({
      title: newTitle,
      description: newDescription,
      image_url: newImageUrl,
      price: newPrice,
      cost_price: newCostPrice,
      options: newOptions,
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
      setNewCostPrice(0);
      setNewOptions([]);
      setNewImageUrl('https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2670&auto=format&fit=crop');
      onAlert('Sucesso!', 'Item adicionado com sucesso.', 'info');
    } else {
      onAlert('Erro', 'Erro ao adicionar item: ' + result.error, 'danger');
    }
  };

  if (loading && items.length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Accordion for New Product */}
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
                Adicionar Novo Produto à Loja
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">Cadastre um novo item para arrecadação solidária</p>
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
                    handleAddNew();
                  }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título do Produto</label>
                        <input 
                          type="text" required value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Preço Sugerido</label>
                          <input 
                            type="text" value={maskBRL(newPrice)}
                            onChange={(e) => setNewPrice(parseBRL(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-brand-orange font-bold rounded-2xl shadow-inner text-xl"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold ml-1">Valor de Custo (Interno)</label>
                          <input 
                            type="text" value={maskBRL(newCostPrice)}
                            onChange={(e) => setNewCostPrice(parseBRL(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/40 font-bold rounded-2xl shadow-inner text-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Descrição Curta</label>
                        <textarea 
                          rows={4} value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl resize-none shadow-inner"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Opções do Produto (ex: P, M, G, Masc, Fem)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" value={newOptionValue}
                            onChange={(e) => setNewOptionValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newOptionValue.trim()) {
                                  setNewOptions([...newOptions, newOptionValue.trim()]);
                                  setNewOptionValue('');
                                }
                              }
                            }}
                            placeholder="Digite e aperte Enter"
                            className="flex-1 bg-black/40 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-xl shadow-inner"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (newOptionValue.trim()) {
                                setNewOptions([...newOptions, newOptionValue.trim()]);
                                setNewOptionValue('');
                              }
                            }}
                            className="px-6 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {newOptions.map((opt, i) => (
                            <span key={i} className="px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] uppercase font-bold rounded-lg flex items-center gap-2">
                              {opt}
                              <button type="button" onClick={() => setNewOptions(newOptions.filter((_, idx) => idx !== i))}>
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Imagem e Pré-visualização</label>
                      <div className="aspect-square max-w-[400px] mx-auto bg-black rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl group">
                        <img src={newImageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt="" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8">
                          <OptimizedImageUploader 
                            onUploadSuccess={(url) => setNewImageUrl(url)}
                            onAlert={onAlert}
                            folder="help"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex justify-end">
                    <button 
                      type="submit" disabled={adding}
                      className="px-12 py-5 bg-brand-orange text-white font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50 shadow-2xl rounded-xl flex items-center gap-4"
                    >
                      {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
                      Cadastrar Produto
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List of Products as Accordions */}
      <div className="space-y-4 pt-12">
        <div className="flex flex-col gap-2 ml-1 mb-6">
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">Produtos Ativos ({items.length})</h4>
          <div className="h-px w-12 bg-white/5" />
        </div>
        
        {items.map((item, index) => (
          <HelpItemAccordion 
            key={item.id} 
            item={item} 
            index={index + 1}
            onUpdate={updateItem} 
            onDelete={deleteItem}
            onAlert={onAlert}
          />
        ))}
      </div>
    </div>
  );
}

interface HelpItemAccordionProps {
  item: HelpItem;
  index: number;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onAlert: (t: string, m: string, v: any) => void;
}

const HelpItemAccordion: React.FC<HelpItemAccordionProps> = ({ item, index, onUpdate, onDelete, onAlert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localTitle, setLocalTitle] = useState(item.title);
  const [localDescription, setLocalDescription] = useState(item.description);
  const [localImageUrl, setLocalImageUrl] = useState(item.image_url);
  const [localPrice, setLocalPrice] = useState(item.price || 0);
  const [localCostPrice, setLocalCostPrice] = useState(item.cost_price || 0);
  const [localOptions, setLocalOptions] = useState<string[]>(item.options || []);
  const [optionValue, setOptionValue] = useState('');
  const [itemToDelete, setItemToDelete] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setLocalTitle(item.title);
      setLocalDescription(item.description);
      setLocalImageUrl(item.image_url);
      setLocalPrice(item.price || 0);
      setLocalCostPrice(item.cost_price || 0);
      setLocalOptions(item.options || []);
    }
  }, [item, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate(item.id, {
      title: localTitle,
      description: localDescription,
      image_url: localImageUrl,
      price: localPrice,
      cost_price: localCostPrice,
      options: localOptions
    });
    setSaving(false);
    if (result.success) {
      setIsOpen(false);
      onAlert('Sucesso', 'Produto atualizado.', 'info');
    } else {
      onAlert('Erro', 'Erro ao atualizar: ' + result.error, 'danger');
    }
  };

  return (
    <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
      isOpen 
        ? 'bg-black/30 border-white/10 shadow-2xl' 
        : 'bg-black/10 border-white/5 hover:border-white/20'
    } ${!item.is_active ? 'opacity-50 grayscale' : ''}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-10 flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <div className="text-[10px] font-bold text-white/10 group-hover:text-brand-orange transition-colors font-sans w-6 text-center">
            {index.toString().padStart(2, '0')}
          </div>
          <div className="w-16 h-12 bg-black rounded-lg overflow-hidden border border-white/5 relative flex-shrink-0">
             <img src={item.image_url} className="w-full h-full object-cover opacity-60" alt="" />
          </div>
          <div className="text-left">
            <h3 className={`text-xl font-serif italic transition-all duration-500 ${
              isOpen ? 'text-white' : 'text-white/40 group-hover:text-white/60'
            }`}>
              {item.title}
            </h3>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">
              {maskBRL(item.price || 0)} {!item.is_active && '• PAUSADO'}
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
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título do Produto</label>
                    <input 
                      type="text" value={localTitle}
                      onChange={(e) => setLocalTitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Preço Sugerido</label>
                      <input 
                        type="text" value={maskBRL(localPrice)}
                        onChange={(e) => setLocalPrice(parseBRL(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-brand-orange font-bold rounded-2xl shadow-inner text-xl"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold ml-1">Valor de Custo (Interno)</label>
                      <input 
                        type="text" value={maskBRL(localCostPrice)}
                        onChange={(e) => setLocalCostPrice(parseBRL(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/40 font-bold rounded-2xl shadow-inner text-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Descrição</label>
                    <textarea 
                      rows={6} value={localDescription}
                      onChange={(e) => setLocalDescription(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl resize-none shadow-inner"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Opções do Produto</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" value={optionValue}
                        onChange={(e) => setOptionValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (optionValue.trim()) {
                              setLocalOptions([...localOptions, optionValue.trim()]);
                              setOptionValue('');
                            }
                          }
                        }}
                        placeholder="Adicionar opção"
                        className="flex-1 bg-black/40 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-xl shadow-inner"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (optionValue.trim()) {
                            setLocalOptions([...localOptions, optionValue.trim()]);
                            setOptionValue('');
                          }
                        }}
                        className="px-6 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {localOptions.map((opt, i) => (
                        <span key={i} className="px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] uppercase font-bold rounded-lg flex items-center gap-2">
                          {opt}
                          <button type="button" onClick={() => setLocalOptions(localOptions.filter((_, idx) => idx !== i))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Capa do Card (Pré-visualização)</label>
                  <div className="aspect-square max-w-[360px] mx-auto bg-black rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl group">
                    <img src={localImageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt="" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8">
                      <OptimizedImageUploader 
                        onUploadSuccess={(url) => setLocalImageUrl(url)}
                        onAlert={onAlert}
                        folder="help"
                        label="Substituir Foto"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-white/5 flex justify-between items-center">
                <div className="flex gap-4">
                  <button 
                    onClick={() => onUpdate(item.id, { is_active: !item.is_active })}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all ${
                      item.is_active 
                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' 
                        : 'bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white'
                    }`}
                  >
                    {item.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {item.is_active ? 'Pausar Venda' : 'Ativar Venda'}
                  </button>
                  <button 
                    onClick={() => setItemToDelete(true)}
                    className="flex items-center gap-3 px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>

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
        onConfirm={async () => {
           const res = await onDelete(item.id);
           if (res.success) onAlert('Excluído', 'Produto removido.', 'info');
           setItemToDelete(false);
        }}
        onCancel={() => setItemToDelete(null)}
        title="Excluir Item?"
        message="Esta ação é permanente e o produto sairá da vitrine pública."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  );
}
