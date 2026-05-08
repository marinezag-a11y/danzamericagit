import React, { useState } from 'react';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Settings, 
  CheckCircle2, 
  X 
} from 'lucide-react';
import { useTicker } from '../../../hooks/useTicker';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

interface TickerManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function TickerManager({ onAlert }: TickerManagerProps) {
  const { phrases, loading, addPhrase, updatePhrase, deletePhrase } = useTicker();
  const [newPhrase, setNewPhrase] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [phraseToDelete, setPhraseToDelete] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newPhrase.trim()) return;
    setSaving(true);
    const result = await addPhrase(newPhrase);
    if (result.success) {
      onAlert('Sucesso', 'Frase adicionada.', 'info');
      setNewPhrase('');
    } else {
      onAlert('Erro', 'Erro ao adicionar frase.', 'danger');
    }
    setSaving(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editText.trim()) return;
    setSaving(true);
    const result = await updatePhrase(id, editText);
    if (result.success) {
      setEditingId(null);
      onAlert('Sucesso', 'Frase atualizada.', 'info');
    } else {
      onAlert('Erro', 'Erro ao salvar alteração.', 'danger');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!phraseToDelete) return;
    const result = await deletePhrase(phraseToDelete);
    if (result.success) {
      onAlert('Excluído', 'Frase removida.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível excluir a frase.', 'danger');
    }
    setPhraseToDelete(null);
  };

  if (loading && phrases.length === 0) return <div className="py-10 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <h4 className="text-xl font-serif italic text-white/80">Adicionar Nova Frase</h4>
        <div className="flex gap-4">
          <input 
            type="text"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Ex: Novos Vencedores 2026..."
            className="flex-1 bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
          />
          <button 
            onClick={handleAdd}
            disabled={saving || !newPhrase.trim()}
            className="bg-brand-orange text-white px-10 py-5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50 rounded-xl shadow-xl"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-xl font-serif italic text-white/60 ml-1">Frases Ativas no Site</h4>
        <div className="grid gap-4">
          {phrases.map((phrase) => (
            <div key={phrase.id} className="bg-black/20 border border-white/5 p-8 flex items-center justify-between group hover:border-brand-orange/20 transition-all rounded-2xl">
              {editingId === phrase.id ? (
                <div className="flex-1 flex gap-6">
                  <input 
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 bg-black border border-brand-orange/40 p-4 text-sm font-sans outline-none text-white rounded-lg"
                    autoFocus
                  />
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleUpdate(phrase.id)}
                      className="p-3 text-green-500 hover:bg-green-500/10 rounded-xl transition-colors"
                      title="Salvar"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-3 text-white/20 hover:text-white rounded-xl transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-serif italic text-lg text-white/90">{phrase.text}</p>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => {
                        setEditingId(phrase.id);
                        setEditText(phrase.text);
                      }}
                      className="p-3 bg-white/5 hover:bg-brand-orange hover:text-white rounded-xl transition-all text-white/20"
                      title="Editar"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPhraseToDelete(phrase.id)}
                      className="p-3 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl transition-all text-white/20"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {phrases.length === 0 && (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl">
              <p className="text-white/20 font-sans italic">Nenhuma frase cadastrada.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!phraseToDelete}
        onConfirm={handleDelete}
        onCancel={() => setPhraseToDelete(null)}
        title="Excluir Frase?"
        message="Esta frase será removida permanentemente da barra rotativa do site."
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
}
