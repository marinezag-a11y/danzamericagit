import React, { useState } from 'react';
import { 
  Users, 
  Loader2, 
  CheckCircle2, 
  Check,
  ChevronDown,
  Settings,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isOpen, setIsOpen] = useState(false);
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
    <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
      isOpen 
        ? 'bg-black/30 border-white/10 shadow-2xl' 
        : 'bg-black/10 border-white/5 hover:border-white/20'
    }`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-10 flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-2xl border transition-all duration-500 ${
            isOpen 
              ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange' 
              : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'
          }`}>
            <Bell className={`w-6 h-6 transition-transform duration-500 ${isOpen ? 'rotate-12' : ''}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-4">
              <h3 className={`text-2xl font-serif italic transition-all duration-500 ${
                isOpen ? 'text-white' : 'text-white/40 group-hover:text-white/60'
              }`}>
                {title}
              </h3>
              {!isOpen && (
                <div className="flex items-center gap-2 text-green-500/40 text-[9px] uppercase tracking-widest font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Ativa
                </div>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">
              {description}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/10 group-hover:text-white/40 transition-all duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-12 pb-12">
              <div className="pt-8 border-t border-white/5 space-y-10">
                <div className="space-y-6">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1 italic">Administradores que receberão cópia dos pedidos:</label>
                  <div className="flex flex-wrap gap-4">
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
                          className={`flex items-center gap-3 px-5 py-4 border rounded-xl transition-all text-[10px] uppercase tracking-widest font-bold ${
                            isSelected 
                              ? (isMaster ? 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange/50 cursor-not-allowed' : 'bg-brand-orange/20 border-brand-orange text-brand-orange')
                              : 'bg-black/40 border-white/5 text-white/20 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <div className={`w-4 h-4 flex items-center justify-center rounded-md border ${isSelected ? 'border-brand-orange bg-brand-orange' : 'border-white/20'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {p.full_name || p.email}
                          {isMaster && <span className="ml-1 text-[8px] opacity-40 lowercase italic">(master)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold italic">Configuração Manual (e-mails externos):</label>
                    {saving && <div className="flex items-center gap-2 text-brand-orange animate-pulse text-[9px] font-bold uppercase tracking-widest"><Loader2 className="w-3 h-3 animate-spin" /> Atualizando...</div>}
                  </div>
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
                    className="w-full bg-black/40 border border-white/10 p-6 text-sm text-white/80 focus:border-brand-orange/40 outline-none transition-all rounded-2xl shadow-inner font-mono"
                    placeholder="separar@emails.com, por@virgula.com"
                  />
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                   <button 
                     onClick={() => setIsOpen(false)}
                     className="px-10 py-4 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all rounded-xl text-[10px] uppercase tracking-widest font-bold"
                   >
                     Fechar Configurações
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
