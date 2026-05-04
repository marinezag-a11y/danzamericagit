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
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-sans italic text-white/80">Linha do Tempo (Conquistas)</h4>
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
              Total: {items.length} itens
            </span>
            <button 
              onClick={() => refresh()} 
              className="p-2 text-white/20 hover:text-brand-orange transition-all hover:bg-white/5 rounded-full" 
              title="Sincronizar com o banco"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        
        <div className="bg-white/5 p-8 space-y-8 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block min-h-[1.5em]">Ano ou Sigla</label>
              <input 
                type="text" 
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange transition-all placeholder:opacity-20 text-white"
                placeholder="2026."
              />
            </div>
            <div className="md:col-span-3 space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block min-h-[1.5em]">Título Curto</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange transition-all placeholder:opacity-20 text-white"
                placeholder="Ex: Melhor Grupo: Arte Minas"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Descrição Detalhada</label>
            <textarea 
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-4 text-sm font-sans outline-none focus:border-brand-orange min-h-[100px] transition-all placeholder:opacity-20 text-white"
              placeholder="Descreva a conquista de forma breve e impactante..."
            />
          </div>
          <button 
            onClick={handleAdd}
            disabled={adding || !newLabel || !newTitle}
            className="w-full bg-brand-orange hover:bg-white hover:text-brand-dark py-4 text-[10px] uppercase font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-3 text-white disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar à Jornada
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Conquistas Ativas no Site</h5>
        {items.length === 0 ? (
          <div className="p-12 border border-dashed border-white/10 text-center">
            <p className="text-sm italic opacity-30 font-sans text-white">Nenhuma conquista cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col p-6 bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                {editingId === item.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <input 
                         type="text" 
                         value={editForm.label}
                         onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                         className="bg-brand-dark border border-white/10 p-2 text-sm font-sans outline-none focus:border-brand-orange text-white"
                       />
                       <input 
                         type="text" 
                         value={editForm.title}
                         onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                         className="md:col-span-3 bg-brand-dark border border-white/10 p-2 text-sm font-sans outline-none focus:border-brand-orange text-white"
                       />
                    </div>
                    <textarea 
                       value={editForm.description}
                       onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                       className="w-full bg-brand-dark border border-white/10 p-2 text-sm font-sans outline-none focus:border-brand-orange min-h-[60px] text-white"
                    />
                    <div className="flex gap-2">
                       <button 
                         onClick={handleSaveEdit}
                         className="flex-1 bg-green-600 hover:bg-green-700 py-2 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2 text-white"
                       >
                         <Check className="w-3 h-3" /> Salvar
                       </button>
                       <button 
                         onClick={() => setEditingId(null)}
                         className="px-4 py-2 bg-white/5 text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white"
                       >
                         Cancelar
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-brand-orange font-bold text-sm font-sans">{item.label}</span>
                        <h6 className="text-white font-bold font-sans">{item.title}</h6>
                      </div>
                      <p className="text-xs text-white/40 font-sans">{item.description}</p>
                    </div>
                    <div className="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleStartEdit(item)}
                        className="p-2 bg-white/5 hover:bg-brand-orange hover:text-white transition-all rounded-sm text-white/20"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-white/5 hover:bg-red-500 hover:text-white transition-all rounded-sm text-white/20"
                      >
                        <Trash2 className="w-3 h-3" />
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
