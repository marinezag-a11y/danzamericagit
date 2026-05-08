import React from 'react';
import { 
  Pencil, 
  Trash2, 
  Key, 
  Lock, 
  Mail, 
  Eye, 
  Loader2 
} from 'lucide-react';

interface UserTableRowProps {
  user: any;
  userRole: string | null;
  onEditName: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onResendEmail: (user: any) => void;
  onImpersonate: (user: any) => void;
  onTogglePermissions: (user: any) => void;
  onTogglePassword: (user: any) => void;
  isResending: boolean;
  isDeleting: boolean;
  isEditingPermissions: boolean;
  isChangingPassword: boolean;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editName: string;
  setEditName: (name: string) => void;
  handleEditName: (id: string) => void;
}

export function UserTableRow({
  user,
  userRole,
  onEditName,
  onDelete,
  onResendEmail,
  onImpersonate,
  onTogglePermissions,
  onTogglePassword,
  isResending,
  isDeleting,
  isEditingPermissions,
  isChangingPassword,
  editingId,
  setEditingId,
  editName,
  setEditName,
  handleEditName
}: UserTableRowProps) {
  
  const ActionTooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 px-3 py-1.5 bg-black border border-white/10 text-[9px] uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl rounded-sm">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/10"></div>
    </div>
  );

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-4 text-sm font-sans text-white/80 group-hover:text-white transition-colors">
        {editingId === user.id ? (
          <input 
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => handleEditName(user.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleEditName(user.id)}
            autoFocus
            className="bg-black/50 border border-brand-orange/50 p-1 px-2 outline-none text-white text-sm"
          />
        ) : (
          user.full_name || <span className="opacity-30 italic text-xs">Sem nome</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm font-sans text-white/60">
        {user.email}
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 bg-brand-orange/10 text-brand-orange text-[9px] uppercase tracking-widest font-bold border border-brand-orange/20 rounded-sm">
          {user.role || 'admin'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          {userRole === 'master' && (
            <>
              <div className="relative group/btn">
                <button 
                  onClick={() => onTogglePassword(user)}
                  className={`p-2 transition-colors ${isChangingPassword ? 'text-brand-orange' : 'text-white/20 hover:text-brand-orange'}`}
                >
                  <Key className="w-3.5 h-3.5" />
                </button>
                <ActionTooltip text="Trocar Senha" />
              </div>

              <div className="relative group/btn">
                <button 
                  onClick={() => onTogglePermissions(user)}
                  className={`p-2 transition-colors ${isEditingPermissions ? 'text-brand-orange' : 'text-white/20 hover:text-brand-orange'}`}
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
                <ActionTooltip text="Editar Permissões" />
              </div>

              <div className="relative group/btn">
                <button
                  onClick={() => onResendEmail(user)}
                  disabled={isResending}
                  className="p-2 text-white/20 hover:text-brand-orange transition-colors disabled:opacity-30"
                >
                  {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                </button>
                <ActionTooltip text="Reenviar E-mail" />
              </div>
            </>
          )}
          
          {userRole === 'master' && (
            <div className="relative group/btn">
              <button 
                onClick={() => onImpersonate(user)}
                className="p-2 text-white/20 hover:text-emerald-500 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <ActionTooltip text="Ver como este usuário" />
            </div>
          )}
          
          <div className="relative group/btn">
            <button 
              onClick={() => {
                setEditingId(user.id);
                setEditName(user.full_name || '');
              }}
              className="p-2 text-white/20 hover:text-brand-orange transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <ActionTooltip text="Editar Nome" />
          </div>

          {userRole === 'master' && (
            <div className="relative group/btn">
              <button 
                onClick={() => onDelete(user.id)}
                disabled={isDeleting}
                className="p-2 text-white/20 hover:text-red-500 transition-colors disabled:opacity-30"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
              <ActionTooltip text="Excluir" />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
