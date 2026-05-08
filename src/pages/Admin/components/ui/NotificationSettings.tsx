import React, { useState } from 'react';
import { 
  Users, 
  Loader2, 
  CheckCircle2, 
  Check 
} from 'lucide-react';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
}

interface NotificationSettingsProps {
  title: string;
  description: string;
  profiles: Profile[];
  currentEmails: string;
  onSave: (emails: string) => Promise<void>;
}

export function NotificationSettings({ 
  title, 
  description, 
  profiles, 
  currentEmails, 
  onSave 
}: NotificationSettingsProps) {
  const [saving, setSaving] = useState(false);

  const handleToggleEmail = async (email: string) => {
    const currentList = currentEmails.split(',').map(e => e.trim()).filter(Boolean);
    let newList = currentList.includes(email) 
      ? currentList.filter(e => e !== email) 
      : [...currentList, email];
    
    setSaving(true);
    await onSave(newList.join(', '));
    setSaving(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-sm space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-brand-orange/10 rounded-sm">
          <Users className="w-5 h-5 text-brand-orange" />
        </div>
        <div className="flex-1">
          <h4 className="text-xl font-sans italic text-white">{title}</h4>
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">{description}</p>
        </div>
        <div className="pb-1 hidden md:block">
           {saving ? (
             <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold px-4 py-4">
               <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
             </div>
           ) : (
             <div className="flex items-center gap-2 text-green-500/60 text-[10px] uppercase tracking-widest font-bold px-4 py-4">
               <CheckCircle2 className="w-3 h-3" /> Configuração Ativa
             </div>
           )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Administradores Cadastrados</label>
          <div className="flex flex-wrap gap-3">
            {profiles.map(p => {
              if (!p.email) return null;
              const currentList = currentEmails.split(',').map(e => e.trim()).filter(Boolean);
              const isMaster = p.role === 'master';
              const isSelected = isMaster || currentList.includes(p.email);
              
              return (
                <button
                  key={p.id}
                  disabled={isMaster || saving}
                  onClick={() => handleToggleEmail(p.email!)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-sm transition-all text-[10px] uppercase tracking-widest font-bold ${
                    isSelected 
                      ? (isMaster ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange/70 cursor-not-allowed' : 'bg-brand-orange/20 border-brand-orange text-brand-orange')
                      : 'bg-black/50 border-white/10 text-white/40 hover:border-white/20 hover:text-white'
                  }`}
                  title={isMaster ? "Usuários Master sempre recebem notificações" : ""}
                >
                  <div className={`w-3 h-3 flex items-center justify-center border ${isSelected ? (isMaster ? 'border-brand-orange/50 bg-brand-orange/50' : 'border-brand-orange bg-brand-orange') : 'border-white/20'}`}>
                    {isSelected && <Check className="w-2 h-2 text-white" />}
                  </div>
                  {p.full_name || p.email}
                  {isMaster && <span className="ml-1 text-[8px] opacity-50 font-sans normal-case">(Master)</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Lista de E-mails (separados por vírgula)</label>
          <input 
            key={currentEmails}
            type="text"
            defaultValue={currentEmails}
            onBlur={async (e) => {
              if (e.target.value !== currentEmails) {
                setSaving(true);
                await onSave(e.target.value);
                setSaving(false);
              }
            }}
            className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all font-mono"
            placeholder="admin1@email.com, admin2@email.com"
          />
        </div>
      </div>
    </div>
  );
}
