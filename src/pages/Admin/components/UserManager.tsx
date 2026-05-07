import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  Loader2, 
  Pencil, 
  Trash2,
  CheckCircle2,
  Lock,
  Key,
  Mail
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useProfiles } from '../../../hooks/useProfiles';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { useNavigate } from 'react-router-dom';

interface UserManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
  userRole: string | null;
}

export function UserManager({ onAlert, userRole }: UserManagerProps) {
  const navigate = useNavigate();
  const { profiles, loading, refresh, updateProfile } = useProfiles();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingPermissionsId, setEditingPermissionsId] = useState<string | null>(null);

  const ALL_PERMISSIONS = [
    { id: 'profile', label: 'Perfil' },
    { id: 'analytics', label: 'Estatísticas' },
    { id: 'orders', label: 'Pedidos' },
    { id: 'content', label: 'Conteúdo' },
    { id: 'help', label: 'Compre um sonho' },
    { id: 'gallery', label: 'Galeria' },
    { id: 'sponsorship', label: 'Apoiadores' },
    { id: 'financial', label: 'Financeiro' },
    { id: 'banners', label: 'Banners' },
    { id: 'users', label: 'Administradores' },
  ];

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  useEffect(() => {
    if (isAdding) {
      generatePassword();
    }
  }, [isAdding]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          full_name: newName
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao criar usuário');

      if (result.email_status && !result.email_status.sent) {
        onAlert('Usuário Criado', `O administrador foi criado, mas o e-mail de convite falhou: ${result.email_status.error || 'Erro no servidor de e-mail'}. Passe a senha manualmente.`, 'warning');
      } else {
        setSuccess(true);
        onAlert('Sucesso', 'Novo administrador criado e convidado por e-mail.', 'info');
      }

      setNewEmail('');
      setNewPassword('');
      setNewName('');
      refresh();
      setTimeout(() => {
        setIsAdding(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      onAlert('Erro', err.message, 'danger');
    } finally {
      setAdding(false);
    }
  };

  const handleEditUser = async (id: string) => {
    if (!editName.trim()) return;
    const res = await updateProfile(id, { full_name: editName });
    if (res.success) {
      setEditingId(null);
      refresh();
      onAlert('Sucesso', 'Nome atualizado.', 'info');
    } else {
      onAlert('Erro na Atualização', 'Não foi possível atualizar o perfil: ' + res.error, 'danger');
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

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao deletar usuário');
      }

      onAlert('Excluído', 'Administrador removido com sucesso.', 'info');
      refresh();
    } catch (err: any) {
      onAlert('Erro ao Excluir', err.message, 'danger');
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  };

  const handleChangePassword = async (userId: string, newPass: string) => {
    if (!newPass || newPass.length < 6) {
      onAlert('Erro', 'A senha deve ter pelo menos 6 caracteres.', 'danger');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId, newPassword: newPass }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao alterar senha');

      onAlert('Sucesso', 'Senha alterada com sucesso.', 'info');
      return true;
    } catch (err: any) {
      onAlert('Erro', err.message, 'danger');
      return false;
    }
  };

  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResendEmail = async (p: any) => {
    setResendingId(p.id);
    try {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let pass = '';
      for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId: p.id, email: p.email, full_name: p.full_name, newPassword: pass }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao reenviar e-mail');

      if (result.email_status && !result.email_status.sent) {
        onAlert('Atenção', `Senha redefinida, mas o e-mail falhou: ${result.email_status.error}. Senha: ${pass}`, 'warning');
      } else {
        onAlert('Sucesso', `E-mail de acesso reenviado para ${p.email}.`, 'info');
      }
    } catch (err: any) {
      onAlert('Erro', err.message, 'danger');
    } finally {
      setResendingId(null);
    }
  };

  const handleImpersonate = (p: any) => {
    localStorage.setItem('support_mode', 'true');
    localStorage.setItem('support_user_name', p.full_name || 'Administrador');
    localStorage.setItem('support_user_id', p.id);
    localStorage.setItem('support_permissions', JSON.stringify(p.permissions || []));
    localStorage.setItem('support_role', p.role || 'admin');
    onAlert('Modo Suporte', `Visualizando Painel como ${p.full_name || p.email}.`, 'info');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const [changingPasswordId, setChangingPasswordId] = useState<string | null>(null);
  const [newPassInput, setNewPassInput] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null);

  const handleTogglePermission = async (userId: string, permissionId: string, currentPermissions: string[] | null) => {
    // Safety check: Don't allow self-lockout from UserManager
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId && permissionId === 'users' && currentPermissions?.includes('users')) {
      if (!confirm('AVISO: Você está prestes a remover seu próprio acesso a esta aba de Administradores. Se fizer isso, não poderá gerenciar permissões novamente. Continuar?')) {
        return;
      }
    }

    setUpdatingPermission(`${userId}-${permissionId}`);
    const permissions = currentPermissions || [];
    const isAdding = !permissions.includes(permissionId);
    
    const newPermissions = isAdding
      ? [...permissions, permissionId]
      : permissions.filter(p => p !== permissionId);
    
    // Optimistic update
    const res = await updateProfile(userId, { permissions: newPermissions });
    
    if (!res.success) {
      onAlert('Erro', 'Não foi possível atualizar as permissões.', 'danger');
    }
    setUpdatingPermission(null);
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
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/5 border border-white/10 p-8 rounded-sm shadow-2xl"
          >
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white outline-none focus:border-brand-orange transition-all"
                  placeholder="Nome do Admin"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">E-mail</label>
                <input 
                  required
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white outline-none focus:border-brand-orange transition-all"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Senha</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      required
                      type={showPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 p-4 pr-12 text-sm text-white outline-none focus:border-brand-orange transition-all"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button 
                    type="submit"
                    disabled={adding}
                    className="px-6 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50 min-w-[80px] flex items-center justify-center shadow-lg"
                  >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
                  </button>
                </div>
              </div>
            </form>
            {error && <p className="mt-4 text-xs text-red-500 font-bold">{error}</p>}
            {success && <p className="mt-4 text-xs text-green-500 font-bold">Usuário criado com sucesso!</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/5 border border-white/10 overflow-hidden rounded-sm shadow-xl">
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
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-sm font-sans text-white/80 group-hover:text-white transition-colors">
                    {editingId === p.id ? (
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleEditUser(p.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditUser(p.id)}
                        autoFocus
                        className="bg-black/50 border border-brand-orange/50 p-1 px-2 outline-none text-white text-sm"
                      />
                    ) : (
                      p.full_name || <span className="opacity-30 italic text-xs">Sem nome</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-sans text-white/60">
                    {p.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-brand-orange/10 text-brand-orange text-[9px] uppercase tracking-widest font-bold border border-brand-orange/20 rounded-sm">
                      {p.role || 'admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {userRole === 'master' && (
                        <>
                          <button 
                            onClick={() => {
                              setChangingPasswordId(changingPasswordId === p.id ? null : p.id);
                              setNewPassInput('');
                            }}
                            className={`p-2 transition-colors ${changingPasswordId === p.id ? 'text-brand-orange' : 'text-white/20 hover:text-brand-orange'}`}
                            title="Trocar senha"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setEditingPermissionsId(editingPermissionsId === p.id ? null : p.id)}
                            className={`p-2 transition-colors ${editingPermissionsId === p.id ? 'text-brand-orange' : 'text-white/20 hover:text-brand-orange'}`}
                            title="Editar permissões"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleResendEmail(p)}
                            disabled={resendingId === p.id}
                            className="p-2 text-white/20 hover:text-brand-orange transition-colors disabled:opacity-30"
                            title="Reenviar e-mail com nova senha"
                          >
                            {resendingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                      {userRole === 'master' && (
                        <button 
                          onClick={() => handleImpersonate(p)}
                          className="p-2 text-white/20 hover:text-emerald-500 transition-colors"
                          title="Ver como este usuário"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setEditingId(p.id);
                          setEditName(p.full_name || '');
                        }}
                        className="p-2 text-white/20 hover:text-brand-orange transition-colors"
                        title="Editar nome"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {userRole === 'master' && (
                        <button 
                          onClick={() => setUserToDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="p-2 text-white/20 hover:text-red-500 transition-colors disabled:opacity-30"
                          title="Excluir administrador"
                        >
                          {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
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
                          <button
                            onClick={async () => {
                              setIsChangingPass(true);
                              const success = await handleChangePassword(p.id, newPassInput);
                              if (success) setChangingPasswordId(null);
                              setIsChangingPass(false);
                            }}
                            disabled={isChangingPass || !newPassInput}
                            className="px-6 py-3 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50"
                          >
                            {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Troca'}
                          </button>
                          <button
                            onClick={() => setChangingPasswordId(null)}
                            className="px-6 py-3 bg-white/5 text-white/60 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {editingPermissionsId === p.id && (
                  <tr className="bg-brand-orange/5 border-b border-white/5">
                    <td colSpan={4} className="px-6 py-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Lock className="w-3 h-3 text-brand-orange" />
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white">Gerenciar Acessos de {p.full_name || p.email}</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {ALL_PERMISSIONS.map(perm => (
                            <button
                              key={perm.id}
                              disabled={updatingPermission === `${p.id}-${perm.id}`}
                              onClick={() => handleTogglePermission(p.id, perm.id, p.permissions)}
                              className={`px-4 py-3 text-[9px] uppercase tracking-widest font-bold border transition-all rounded-sm flex items-center justify-between group/perm ${
                                (p.permissions || []).includes(perm.id)
                                  ? 'bg-brand-orange border-brand-orange text-white'
                                  : 'bg-black/40 border-white/10 text-white/40 hover:border-white/20'
                              } ${updatingPermission === `${p.id}-${perm.id}` ? 'opacity-50' : ''}`}
                            >
                              {perm.label}
                              <div className="flex items-center gap-2">
                                {updatingPermission === `${p.id}-${perm.id}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (p.permissions || []).includes(perm.id) ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <div className="w-3 h-3 border border-white/20 rounded-full" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] text-white/30 italic">As mudanças são aplicadas instantaneamente.</p>
                      </div>
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
