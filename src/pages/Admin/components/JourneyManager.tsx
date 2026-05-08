import React, { useState } from 'react';
import { 
  Loader2, 
  RefreshCw, 
  Plus, 
  Check, 
  X, 
  Trash2,
  Edit2
} from 'lucide-react';
import { useJourney, JourneyItem } from '../../../hooks/useJourney';

interface JourneyManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function JourneyManager({ onAlert }: JourneyManagerProps) {
  const { items, loading, addItem, deleteItem, updateItem, refresh } = useJourney();
  const [newLabel, setNewLabel] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<JourneyItem>>({});

  const handleAdd = async () => {
    if (!newLabel || !newTitle) return;
    setAdding(true);
    try {
      const result = await addItem({ 
        label: newLabel, 
        title: newTitle, 
        description: newDescription,
        order: items.length 
      });
      if (result.success) {
        setNewLabel('');
        setNewTitle('');
        setNewDescription('');
        onAlert('Sucesso', 'Item adicionado à jornada.', 'info');
      } else {
        onAlert('Erro', result.error || 'Erro ao adicionar item.', 'danger');
      }
    } catch (err) {
      console.error(err);
      onAlert('Erro Fatal', 'Não foi possível salvar o item.', 'danger');
    }
    setAdding(false);
  };

  const handleStartEdit = (item: JourneyItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const result = await updateItem(editingId, editForm);
      if (result.success) {
        setEditingId(null);
        onAlert('Sucesso', 'Item atualizado.', 'info');
      } else {
        onAlert('Erro', result.error || 'Erro ao atualizar.', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteItem(id);
      if (result.success) {
        onAlert('Excluído', 'Item removido da jornada.', 'info');
      } else {
        onAlert('Erro', result.error || 'Erro ao excluir.', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && items.length === 0) return <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-orange mx-auto" /></div>;

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-xl font-serif italic text-white/80">Linha do Tempo (Conquistas)</h4>
          <div className="flex items-center gap-6">
            <span className="text-[10px] uppercase tracking-widest text-brand-orange font-bold px-4 py-2 bg-brand-orange/5 border border-brand-orange/10 rounded-full">
              {items.length} Conquistas
            </span>
            <button 
              onClick={() => refresh()} 
              className="p-2 text-white/20 hover:text-brand-orange transition-all hover:bg-white/5 rounded-full" 
              title="Sincronizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        
        <div className="space-y-8 bg-black/10 p-8 rounded-3xl border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Ano / Rótulo</label>
              <input 
                type="text" 
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-5 text-sm font-sans outline-none focus:border-brand-orange/40 transition-all text-white/80 rounded-xl"
                placeholder="Ex: 2026"
              />
            </div>
            <div className="md:col-span-3 space-y-3">
              <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título da Conquista</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-5 text-sm font-sans outline-none focus:border-brand-orange/40 transition-all text-white/80 rounded-xl"
                placeholder="Ex: Melhor Grupo FIDIFEST"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Descrição</label>
            <textarea 
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans outline-none focus:border-brand-orange/40 min-h-[120px] transition-all text-white/80 rounded-2xl resize-none shadow-inner"
              placeholder="Descreva a vitória de forma impactante..."
            />
          </div>
          <button 
            onClick={handleAdd}
            disabled={adding || !newLabel || !newTitle}
            className="w-full bg-brand-orange hover:bg-white hover:text-brand-dark py-5 text-[10px] uppercase font-bold tracking-[0.3em] transition-all flex items-center justify-center gap-4 text-white rounded-xl shadow-xl disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
            Adicionar à Jornada
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h5 className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold ml-1">Itens Publicados</h5>
        {items.length === 0 ? (
          <div className="p-16 border border-dashed border-white/10 text-center rounded-3xl">
            <p className="text-sm italic opacity-30 font-sans text-white">Sua jornada ainda está sendo escrita...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <div key={item.id} className="group relative p-8 bg-black/20 border border-white/5 hover:border-brand-orange/20 transition-all rounded-2xl">
                {editingId === item.id ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <input 
                         type="text" 
                         value={editForm.label}
                         onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                         className="bg-black border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange text-white rounded-lg"
                       />
                       <input 
                         type="text" 
                         value={editForm.title}
                         onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                         className="md:col-span-3 bg-black border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange text-white rounded-lg"
                       />
                    </div>
                    <textarea 
                       value={editForm.description}
                       onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                       className="w-full bg-black border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange min-h-[80px] text-white rounded-lg resize-none"
                    />
                    <div className="flex gap-4">
                       <button 
                         onClick={handleSaveEdit}
                         className="flex-1 bg-green-600 hover:bg-green-700 py-3 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-3 text-white rounded-lg"
                       >
                         <Check className="w-4 h-4" /> Salvar Alterações
                       </button>
                       <button 
                         onClick={() => setEditingId(null)}
                         className="px-6 py-3 bg-white/5 text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white rounded-lg"
                       >
                         Cancelar
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-6 mb-2">
                        <span className="text-brand-orange font-serif italic text-lg">{item.label}</span>
                        <h6 className="text-white/90 font-bold font-sans text-base">{item.title}</h6>
                      </div>
                      <p className="text-sm text-white/40 font-sans leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleStartEdit(item)}
                        className="p-3 bg-white/5 hover:bg-brand-orange hover:text-white transition-all rounded-xl text-white/20"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-3 bg-white/5 hover:bg-red-500 hover:text-white transition-all rounded-xl text-white/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
