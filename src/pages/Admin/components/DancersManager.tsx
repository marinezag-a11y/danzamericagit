import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown,
  User,
  Image as ImageIcon
} from 'lucide-react';
import { useDancers, Dancer } from '../../../hooks/useDancers';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { OptimizedImageUploader } from './OptimizedImageUploader';

interface DancersManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function DancersManager({ onAlert }: DancersManagerProps) {
  const { dancers, loading, addDancer, updateDancer, deleteDancer } = useDancers();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setSaving(true);
    const res = await addDancer({
      name: newName,
      photo_url: newPhotoUrl || null,
      is_active: true,
      display_order: dancers.length
    });
    
    if (res.success) {
      onAlert('Sucesso', 'Bailarino(a) cadastrado(a) com sucesso.', 'info');
      setIsAdding(false);
      setNewName('');
      setNewPhotoUrl('');
    } else {
      onAlert('Erro', 'Não foi possível cadastrar o bailarino.', 'danger');
    }
    setSaving(false);
  };

  if (loading && dancers.length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-16 pb-24">
      {/* Toggleable Form for New Dancer */}
      <div className="bg-brand-dark/40 border border-white/10 rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full p-12 flex items-center justify-between group bg-white/5 transition-all hover:bg-white/10"
        >
          <div className="flex items-center gap-10">
            <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center border transition-all duration-700 ${
              isAdding 
                ? 'bg-brand-orange border-brand-orange text-white rotate-45 scale-110 shadow-2xl shadow-brand-orange/40' 
                : 'bg-brand-orange/10 border-brand-orange/40 text-brand-orange'
            }`}>
              <Plus className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-brand-orange text-[9px] uppercase tracking-[0.5em] font-black mb-3 italic opacity-60">ADMINISTRAÇÃO DE ELENCO</p>
              <h3 className="text-3xl font-serif italic text-white leading-tight">Cadastrar Novo Bailarino(a)</h3>
            </div>
          </div>
          <ChevronDown className={`w-8 h-8 text-white/10 group-hover:text-white/40 transition-all duration-700 ${isAdding ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="p-12 md:p-20 border-t border-white/5">
                <form onSubmit={handleCreate} className="space-y-16">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.4em] text-brand-orange font-black ml-4">Nome Artístico / Completo</label>
                        <input 
                          type="text" required value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 p-8 rounded-[2.5rem] text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium"
                          placeholder="Ex: Ana Clara Silva"
                        />
                      </div>
                      <div className="flex gap-4 p-8 bg-brand-orange/5 border border-brand-orange/10 rounded-[2rem]">
                         <div className="w-1 h-auto bg-brand-orange rounded-full shrink-0" />
                         <p className="text-[10px] text-brand-orange font-black italic leading-relaxed uppercase tracking-widest opacity-60">
                            Certifique-se de usar o nome que o público reconhece para facilitar a busca durante as doações.
                         </p>
                      </div>
                    </div>
                    
                    <div className="space-y-10">
                      <label className="text-[10px] uppercase tracking-[0.4em] text-brand-orange font-black ml-4 italic">Retrato Oficial (Opcional)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-12">
                        <div className="aspect-square w-60 bg-black rounded-[3rem] border border-white/5 overflow-hidden relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] group flex-shrink-0">
                          {newPhotoUrl ? (
                            <img src={newPhotoUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/5 bg-white/[0.02]">
                              <User className="w-16 h-16 mb-4" strokeWidth={1} />
                              <span className="text-[9px] uppercase tracking-[0.4em] font-black">Aguardando Foto</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 backdrop-blur-sm p-12">
                            <OptimizedImageUploader 
                              onUploadSuccess={(url) => setNewPhotoUrl(url)}
                              onAlert={onAlert}
                              folder="dancers"
                              label={newPhotoUrl ? "Substituir Foto" : "Enviar Retrato"}
                            />
                          </div>
                        </div>
                        <div className="flex-1 space-y-6">
                          <p className="text-[10px] text-white/20 italic leading-relaxed uppercase tracking-widest font-medium">
                            * Use preferencialmente fotos com fundo neutro e alta resolução para um resultado premium.
                          </p>
                          {newPhotoUrl && (
                            <button 
                              type="button" 
                              onClick={() => setNewPhotoUrl('')}
                              className="px-6 py-3 bg-red-500/10 text-red-500 rounded-full text-[9px] uppercase tracking-[0.3em] font-black hover:bg-red-500 hover:text-white transition-all active:scale-95"
                            >
                              Remover Imagem
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-12 border-t border-white/5 flex justify-end">
                    <button 
                      type="submit" disabled={saving}
                      className="px-16 py-7 bg-brand-orange text-white font-black uppercase tracking-[0.4em] text-[11px] hover:bg-brand-dark transition-all shadow-2xl rounded-[2.5rem] flex items-center gap-6 active:scale-95 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      FINALIZAR CADASTRO
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List of Dancers */}
      <div className="space-y-8">
        <div className="flex flex-col gap-3 ml-4">
          <p className="text-white/20 text-[10px] uppercase tracking-[0.5em] font-black italic">ELENCO ATUAL</p>
          <h4 className="text-2xl font-serif italic text-white/40">Total de {dancers.length} Bailarinos(as)</h4>
          <div className="h-1 w-16 bg-brand-orange/40 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {dancers.map((dancer, index) => (
            <DancerAccordion 
              key={dancer.id} 
              dancer={dancer} 
              index={index + 1}
              onUpdate={updateDancer} 
              onDelete={deleteDancer}
              onAlert={onAlert}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DancerAccordionProps {
  dancer: Dancer;
  index: number;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onAlert: (t: string, m: string, v: any) => void;
}

const DancerAccordion: React.FC<DancerAccordionProps> = ({ dancer, index, onUpdate, onDelete, onAlert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localName, setLocalName] = useState(dancer.name);
  const [localPhotoUrl, setLocalPhotoUrl] = useState(dancer.photo_url || '');
  const [itemToDelete, setItemToDelete] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setLocalName(dancer.name);
      setLocalPhotoUrl(dancer.photo_url || '');
    }
  }, [dancer, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate(dancer.id, {
      name: localName,
      photo_url: localPhotoUrl || null
    });
    setSaving(false);
    if (result.success) {
      setIsOpen(false);
      onAlert('Sucesso', 'Dados atualizados.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível atualizar.', 'danger');
    }
  };

  const handleDelete = async () => {
    const result = await onDelete(dancer.id);
    if (result.success) {
      onAlert('Excluído', 'Bailarino removido.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível excluir.', 'danger');
    }
    setItemToDelete(false);
  };

  return (
    <div className={`transition-all duration-700 overflow-hidden rounded-[3rem] ${
      isOpen 
        ? 'bg-brand-dark/60 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]' 
        : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10'
    }`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-8 md:p-10 flex items-center justify-between group"
      >
        <div className="flex items-center gap-8">
          <div className="text-[11px] font-black text-white/5 group-hover:text-brand-orange transition-all duration-500 font-sans w-8 text-center italic tracking-widest">
            {index.toString().padStart(2, '0')}
          </div>
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-white flex-shrink-0 shadow-xl relative">
            {dancer.photo_url ? (
              <img 
                src={dancer.photo_url} 
                className="w-full h-full object-cover transition-all duration-700 scale-[1.8] group-hover:scale-[2.0]" 
                alt="" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-orange/5">
                <User className="w-6 h-6 text-brand-orange/20" strokeWidth={1} />
              </div>
            )}
          </div>
          <div className="text-left">
            <h3 className={`text-2xl font-serif italic transition-all duration-700 ${
              isOpen ? 'text-white' : 'text-white/40 group-hover:text-white/80'
            }`}>
              {dancer.name}
            </h3>
          </div>
        </div>
        <div className={`p-4 rounded-full bg-white/5 text-white/10 group-hover:text-white/40 transition-all duration-700 ${isOpen ? 'rotate-180 bg-brand-orange/10 text-brand-orange/60' : ''}`}>
          <ChevronDown className="w-6 h-6" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-10 pb-12 md:px-16 md:pb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-12 border-t border-white/5">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-brand-orange font-black ml-4 italic">Nome do Bailarino</label>
                    <input 
                      type="text" value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 p-8 rounded-[2rem] text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                    <p className="text-[10px] text-white/20 italic leading-relaxed uppercase tracking-widest font-black">
                      Identificador Único: <span className="text-white/40">{dancer.id}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-10">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-brand-orange font-black ml-4 italic">Atualizar Retrato</label>
                  <div className="flex flex-col sm:flex-row gap-10 items-center">
                    <div className="aspect-square w-40 bg-black rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-2xl group flex-shrink-0">
                      {localPhotoUrl ? (
                        <img src={localPhotoUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                          <ImageIcon className="w-10 h-10 text-white/5" strokeWidth={1} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 backdrop-blur-sm p-8">
                        <OptimizedImageUploader 
                          onUploadSuccess={(url) => setLocalPhotoUrl(url)}
                          onAlert={onAlert}
                          folder="dancers"
                          label="Alterar"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-white/10 italic max-w-[200px] leading-relaxed uppercase tracking-[0.2em] font-black">
                      * O sistema otimiza automaticamente para carregamento rápido.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-16 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8">
                <button 
                  onClick={() => setItemToDelete(true)}
                  className="flex items-center gap-4 px-10 py-5 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-[9px] uppercase tracking-[0.4em] font-black transition-all active:scale-95 border border-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  REMOVER REGISTRO
                </button>

                <div className="flex gap-6">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="px-10 py-5 text-[9px] uppercase tracking-[0.4em] font-black text-white/20 hover:text-white transition-all active:scale-95"
                  >
                    DESCARTAR
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-12 py-5 bg-brand-orange text-white text-[10px] uppercase tracking-[0.4em] font-black hover:bg-brand-dark transition-all rounded-2xl flex items-center gap-4 shadow-2xl active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
                    SALVAR ALTERAÇÕES
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
        title="Remover Bailarino(a)?"
        message="Esta ação é irreversível e removerá o bailarino de todas as campanhas ativas. Confirmar exclusão?"
        confirmLabel="SIM, EXCLUIR REGISTRO"
        variant="danger"
      />
    </div>
  );
}
