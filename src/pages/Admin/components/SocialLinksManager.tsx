import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Plus, X, Settings, Trash2, Save, 
  Link as LinkIcon, ArrowUp, ArrowDown, Copy
} from 'lucide-react';
import { useSocialLinks, SocialLink } from '../../../hooks/useSocialLinks';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

interface SocialLinksManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info' | 'success') => void;
}

export function SocialLinksManager({ onAlert }: SocialLinksManagerProps) {
  const { links, loading, addLink, updateLink, deleteLink, reorderLinks } = useSocialLinks();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIsPix, setNewIsPix] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newTitle || !newUrl) {
      onAlert('Erro', 'Preencha o título e o link/chave.', 'warning');
      return;
    }
    setSaving(true);
    const order = links.length > 0 ? Math.max(...links.map(l => l.order || 0)) + 1 : 0;
    
    const res = await addLink({
      title: newTitle,
      url: newUrl,
      icon: null,
      is_pix: newIsPix,
      is_active: true,
      order
    });

    if (res.success) {
      onAlert('Sucesso', 'Link adicionado.', 'success');
      setIsAdding(false);
      setNewTitle('');
      setNewUrl('');
      setNewIsPix(false);
    } else {
      onAlert('Erro', res.error || 'Falha ao adicionar link', 'danger');
    }
    setSaving(false);
  };

  const handleToggleActive = async (link: SocialLink) => {
    const res = await updateLink(link.id, { is_active: !link.is_active });
    if (res.success) {
      onAlert('Atualizado', 'Status do link atualizado.', 'info');
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newLinks = [...links];
    const temp = newLinks[index - 1];
    newLinks[index - 1] = newLinks[index];
    newLinks[index] = temp;
    await reorderLinks(newLinks.map(l => l.id));
  };

  const moveDown = async (index: number) => {
    if (index === links.length - 1) return;
    const newLinks = [...links];
    const temp = newLinks[index + 1];
    newLinks[index + 1] = newLinks[index];
    newLinks[index] = temp;
    await reorderLinks(newLinks.map(l => l.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-brand-primary" />
            Links Especiais (Linktree)
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie os links exibidos na página /links. Marque como "Copiar PIX" para habilitar a cópia automática.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Link
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/30 p-6 rounded-xl border border-white/10 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Título do Botão</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: WhatsApp, Doar PIX"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Link ou Chave PIX</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://... ou Chave PIX"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-lg border border-white/10 w-max">
              <input
                type="checkbox"
                checked={newIsPix}
                onChange={e => setNewIsPix(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-black/50 text-brand-primary focus:ring-brand-primary focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300">Este botão é um Copiar PIX</span>
            </label>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newTitle || !newUrl}
                className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {links.length === 0 && !isAdding && (
          <div className="text-center py-10 text-gray-500 bg-white/5 rounded-xl border border-white/5">
            Nenhum link cadastrado. Clique em "Novo Link" para adicionar.
          </div>
        )}

        {links.map((link, index) => (
          <motion.div
            key={link.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between p-4 rounded-xl border ${link.is_active ? 'border-white/10 bg-white/5' : 'border-red-900/30 bg-red-900/10'} group transition-all`}
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === links.length - 1}
                  className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-medium">{link.title}</h3>
                  {link.is_pix && (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-full">
                      <Copy className="w-3 h-3" />
                      PIX
                    </span>
                  )}
                  {!link.is_active && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                      Oculto
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate max-w-[300px] md:max-w-[500px]">
                  {link.url}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleToggleActive(link)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  link.is_active 
                    ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-400' 
                    : 'border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10'
                }`}
              >
                {link.is_active ? 'Ocultar' : 'Ativar'}
              </button>
              
              <button
                onClick={() => setDeleteId(link.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {deleteId && (
        <ConfirmModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={async () => {
            await deleteLink(deleteId);
            onAlert('Excluído', 'Link removido com sucesso', 'info');
            setDeleteId(null);
          }}
          title="Excluir Link?"
          message="Tem certeza que deseja excluir este link permanentemente?"
          confirmText="Sim, excluir"
          cancelText="Cancelar"
          isDanger={true}
        />
      )}
    </div>
  );
}
