import React from 'react';
import { 
  Lock, 
  Key, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

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
  { id: 'dancers', label: 'Bailarinos' },
  { id: 'users', label: 'Administradores' },
  { id: 'energy', label: 'Injeção de Energia' },
];

interface UserPermissionsEditorProps {
  localRole: string;
  setLocalRole: (role: string) => void;
  localPermissions: string[];
  onTogglePermission: (id: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function UserPermissionsEditor({
  localRole,
  setLocalRole,
  localPermissions,
  onTogglePermission,
  onSave,
  onCancel,
  isSaving
}: UserPermissionsEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 p-6 border border-white/10 rounded-sm mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-brand-orange" />
            <h4 className="text-xs uppercase tracking-widest font-bold text-white">Nível Hierárquico</h4>
          </div>
          <p className="text-[10px] text-white/40 font-sans">Mestres (Masters) têm acesso irrestrito e gerenciam outros administradores.</p>
        </div>
        <div className="flex gap-2 bg-black/50 p-1.5 rounded-sm border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setLocalRole('admin')}
            className={`px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-all ${localRole !== 'master' ? 'bg-white/20 text-white shadow-lg border border-white/20' : 'text-white/40 hover:text-white'}`}
          >
            Admin Padrão
          </button>
          <button
            type="button"
            onClick={() => setLocalRole('master')}
            className={`px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-all ${localRole === 'master' ? 'bg-brand-orange text-white shadow-lg border border-brand-orange' : 'text-white/40 hover:text-white'}`}
          >
            Master
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-8 mb-4">
        <Key className="w-4 h-4 text-brand-orange" />
        <h4 className="text-xs uppercase tracking-widest font-bold text-white">Permissões Específicas</h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {ALL_PERMISSIONS.map(perm => {
          const isSelected = localPermissions.includes(perm.id);
          return (
            <button
              key={perm.id}
              type="button"
              onClick={() => onTogglePermission(perm.id)}
              className={`px-4 py-4 text-[9px] uppercase tracking-widest font-bold border transition-all rounded-sm flex items-center justify-between group/perm ${
                isSelected
                  ? 'bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/20'
                  : 'bg-black/40 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
            >
              {perm.label}
              <div className="flex items-center gap-2">
                {isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <div className="w-3.5 h-3.5 border border-white/20 rounded-full" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <p className="text-[10px] text-white/30 italic">As mudanças serão salvas ao confirmar abaixo.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-white/5 text-white/60 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-all rounded-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-8 py-3 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all rounded-sm shadow-xl flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
