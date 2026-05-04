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
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 p-8 rounded-sm">
        <h3 className="text-xl font-sans italic mb-6 text-white/80">Adicionar Nova Frase</h3>
        <div className="flex gap-4">
          <input 
            type="text"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Ex: Novos Vencedores 2026..."
            className="flex-1 bg-black/50 border border-white/10 p-4 text-sm font-sans focus:border-brand-orange outline-none transition-all text-white"
          />
          <button 
            onClick={handleAdd}
            disabled={saving || !newPhrase.trim()}
            className="bg-brand-orange text-white px-8 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-sans italic text-white/60">Frases Atuais</h3>
        <div className="grid gap-4">
          {phrases.map((phrase) => (
            <div key={phrase.id} className="bg-white/5 border border-white/10 p-6 flex items-center justify-between group hover:border-white/20 transition-all">
              {editingId === phrase.id ? (
                <div className="flex-1 flex gap-4 mr-4">
                  <input 
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 bg-black/50 border border-brand-orange p-3 text-sm font-sans outline-none text-white"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdate(phrase.id)}
                      className="p-2 text-green-500 hover:text-white transition-colors"
                      title="Salvar"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-2 text-white/20 hover:text-white transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-sans italic text-lg text-white/90">{phrase.text}</p>
                  <div className="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingId(phrase.id);
                        setEditText(phrase.text);
                      }}
                      className="p-2 text-white/20 hover:text-brand-orange transition-colors"
                      title="Editar"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPhraseToDelete(phrase.id)}
                      className="p-2 text-white/20 hover:text-red-500 transition-colors"
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
            <div className="text-center py-12 border border-dashed border-white/10">
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
        variant="danger"
      />
    </div>
  );
}
