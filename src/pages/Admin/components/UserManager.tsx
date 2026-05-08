import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  X, 
  Loader2 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useProfiles } from '../../../hooks/useProfiles';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { UserAddForm } from './users/UserAddForm';
import { UserTableRow } from './users/UserTableRow';
import { UserPermissionsEditor } from './users/UserPermissionsEditor';

interface UserManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
  userRole: string | null;
}

export function UserManager({ onAlert, userRole }: UserManagerProps) {
  const { profiles, loading, refresh, updateProfile } = useProfiles();
  const [isAdding, setIsAdding] = useState(false);
  const [adding, setAdding] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingPermissionsId, setEditingPermissionsId] = useState<string | null>(null);
  const [localPermissions, setLocalPermissions] = useState<string[]>([]);
  const [localRole, setLocalRole] = useState<string>('admin');
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const [changingPasswordId, setChangingPasswordId] = useState<string | null>(null);
  const [newPassInput, setNewPassInput] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleAddUser = async (data: any) => {
    setAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao criar usuário');

      if (result.email_status && !result.email_status.sent) {
        onAlert('Usuário Criado', `O administrador foi criado, mas o e-mail de convite falhou. Senha gerada: ${data.password}`, 'warning');
      } else {
        onAlert('Sucesso', 'Novo administrador criado e convidado por e-mail.', 'info');
      }

      setIsAdding(false);
      refresh();
    } catch (err: any) {
      onAlert('Erro', err.message, 'danger');
    } finally {
      setAdding(false);
    }
  };

  const handleEditName = async (id: string) => {
    if (!editName.trim()) return;
    const res = await updateProfile(id, { full_name: editName });
    if (res.success) {
      setEditingId(null);
      refresh();
      onAlert('Sucesso', 'Nome atualizado.', 'info');
    } else {
      onAlert('Erro', res.error, 'danger');
    }
  };

  const handleDeleteUser = async (id: string) => {
    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId: id }),
      });

      if (!response.ok) throw new Error('Erro ao deletar usuário');

      onAlert('Excluído', 'Administrador removido com sucesso.', 'info');
      refresh();
    } catch (err: any) {
      onAlert('Erro', err.message, 'danger');
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  };

  const handleSavePermissions = async (userId: string) => {
    setIsSavingPermissions(true);
    const res = await updateProfile(userId, { 
      role: localRole as 'admin' | 'master',
      permissions: localPermissions 
    });
    
    if (res.success) {
      onAlert('Sucesso', 'Configurações de acesso atualizadas.', 'info');
      setEditingPermissionsId(null);
      refresh();
    } else {
      onAlert('Erro', res.error, 'danger');
    }
    setIsSavingPermissions(false);
  };

  const handleChangePassword = async (userId: string) => {
    if (!newPassInput || newPassInput.length < 6) {
      onAlert('Erro', 'A senha deve ter pelo menos 6 caracteres.', 'danger');
      return;
    }

    setIsChangingPass(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId, newPassword: newPassInput }),
      });

      if (!response.ok) throw new Error('Erro ao alterar senha');

      onAlert('Sucesso', 'Senha alterada com sucesso.', 'info');
      setChangingPasswordId(null);
    } catch (err: any) {
      onAlert('Erro', err.message, 'danger');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleResendEmail = async (p: any) => {
    setResendingId(p.id);
    try {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let pass = '';
      for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId: p.id, email: p.email, full_name: p.full_name, newPassword: pass }),
      });

      if (!response.ok) throw new Error('Erro ao reenviar e-mail');
      onAlert('Sucesso', `E-mail de acesso reenviado para ${p.email}.`, 'info');
    } catch (err: any) {
      onAlert('Erro', err.message, 'danger');
    } finally {
      setResendingId(null);
    }
  };

  if (loading && profiles.length === 0) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <p className="text-xs text-white/40 font-sans max-w-md">Gerencie os administradores do sistema. Usuários criados aqui terão acesso total ao painel.</p>
        {userRole === 'master' && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-brand-dark transition-all rounded-sm shadow-lg"
          >
            {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {isAdding ? 'Cancelar' : 'Convidar Administrador'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <UserAddForm onAdd={handleAddUser} onClose={() => setIsAdding(false)} adding={adding} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/5 border border-white/10 rounded-sm shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-brand-orange font-bold">Nome</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-brand-orange font-bold">E-mail</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-brand-orange font-bold">Cargo</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-brand-orange font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <React.Fragment key={p.id}>
                <UserTableRow 
                  user={p}
                  userRole={userRole}
                  onEditName={setEditName}
                  onDelete={setUserToDelete}
                  onResendEmail={handleResendEmail}
                  onImpersonate={(user) => {
                    localStorage.setItem('support_mode', 'true');
                    localStorage.setItem('support_user_name', user.full_name || 'Admin');
                    localStorage.setItem('support_user_id', user.id);
                    localStorage.setItem('support_permissions', JSON.stringify(user.permissions || []));
                    localStorage.setItem('support_role', user.role || 'admin');
                    onAlert('Modo Suporte', `Visualizando Painel como ${user.full_name || user.email}.`, 'info');
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                  onTogglePermissions={(user) => {
                    if (editingPermissionsId === user.id) {
                      setEditingPermissionsId(null);
                    } else {
                      setEditingPermissionsId(user.id);
                      setLocalPermissions(user.permissions || []);
                      setLocalRole(user.role || 'admin');
                    }
                  }}
                  onTogglePassword={(user) => {
                    setChangingPasswordId(changingPasswordId === user.id ? null : user.id);
                    setNewPassInput('');
                  }}
                  isResending={resendingId === p.id}
                  isDeleting={deletingId === p.id}
                  isEditingPermissions={editingPermissionsId === p.id}
                  isChangingPassword={changingPasswordId === p.id}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  editName={editName}
                  setEditName={setEditName}
                  handleEditName={handleEditName}
                />

                {changingPasswordId === p.id && (
                  <tr className="bg-brand-orange/5 border-b border-white/5">
                    <td colSpan={4} className="px-6 py-6">
                      <div className="flex items-end gap-6">
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Nova Senha para {p.full_name || p.email}</label>
                          <input 
                            type="text" 
                            value={newPassInput}
                            onChange={(e) => setNewPassInput(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 p-3 text-sm text-white outline-none focus:border-brand-orange transition-all"
                            placeholder="Mínimo 6 caracteres"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleChangePassword(p.id)} disabled={isChangingPass || !newPassInput} className="px-6 py-3 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50">
                            {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Troca'}
                          </button>
                          <button onClick={() => setChangingPasswordId(null)} className="px-6 py-3 bg-white/5 text-white/60 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-all">Cancelar</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {editingPermissionsId === p.id && (
                  <tr className="bg-brand-orange/5 border-b border-white/5">
                    <td colSpan={4} className="px-6 py-6">
                      <UserPermissionsEditor 
                        localRole={localRole}
                        setLocalRole={setLocalRole}
                        localPermissions={localPermissions}
                        onTogglePermission={(id) => setLocalPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])}
                        onSave={() => handleSavePermissions(p.id)}
                        onCancel={() => setEditingPermissionsId(null)}
                        isSaving={isSavingPermissions}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={!!userToDelete}
        title="Excluir Administrador"
        message="Tem certeza que deseja excluir este administrador? Esta ação removerá o acesso dele ao sistema de forma irreversível."
        confirmLabel="Sim, Excluir"
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete)}
        onCancel={() => setUserToDelete(null)}
        variant="danger"
      />
    </div>
  );
}
