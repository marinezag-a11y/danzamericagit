import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Save, 
  User, 
  CheckCircle2 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useProfiles, Profile } from '../../../hooks/useProfiles';

export function ProfileManager() {
  const { profiles, updateProfile, refresh } = useProfiles();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user && profiles.length > 0) {
        setProfile(profiles.find(p => p.id === user.id) || null);
      }
    };
    checkUser();
  }, [profiles]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !currentUser) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Update Profile Metadata
      const res = await updateProfile(currentUser.id, {
        full_name: profile.full_name,
        phone: profile.phone
      });
      
      if (!res.success) throw new Error(res.error);

      // 2. Update Password if provided
      if (newPassword) {
        if (newPassword.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');
        
        const { error: pwdError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (pwdError) throw pwdError;

        // 3. Notify user via email about the password change
        try {
          await supabase.functions.invoke('notify-password-change', {
            body: {
              email: profile.email,
              full_name: profile.full_name,
              new_password: newPassword
            }
          });
        } catch (err) {
          console.error('Erro ao enviar e-mail de notificação de senha:', err);
        }

        setNewPassword('');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-2xl bg-white/5 border border-white/10 p-12 rounded-sm shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <User className="w-64 h-64" />
      </div>

      <div className="flex items-center gap-6 mb-12">
        <div className="w-20 h-20 bg-brand-orange/10 border border-brand-orange/20 rounded-full flex items-center justify-center text-3xl font-serif italic text-brand-orange shadow-inner">
          {profile.full_name?.[0] || profile.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <h3 className="text-2xl font-serif italic text-white mb-1">{profile.full_name || 'Seu Nome'}</h3>
          <p className="text-xs text-white/30 font-sans tracking-widest uppercase">{profile.email}</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Nome Completo</label>
            <input 
              type="text" 
              value={profile.full_name || ''}
              onChange={(e) => setProfile({...profile, full_name: e.target.value})}
              className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white outline-none focus:border-brand-orange transition-all placeholder:text-white/10"
              placeholder="Como você quer ser chamado?"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">WhatsApp / Telefone</label>
            <input 
              type="text" 
              value={profile.phone || ''}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white outline-none focus:border-brand-orange transition-all placeholder:text-white/10"
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="space-y-4 p-6 bg-brand-orange/5 border border-brand-orange/10 rounded-sm">
          <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Trocar Senha (Deixe em branco para manter)</label>
          <input 
            type="password" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white outline-none focus:border-brand-orange transition-all placeholder:text-white/10"
            placeholder="Nova senha segura"
          />
          <p className="text-[10px] text-white/20 italic">A senha deve ter no mínimo 6 caracteres.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-bold">
            {error}
          </div>
        )}

        <div className="pt-6">
          <button 
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-12 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-sm shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Perfil atualizado com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
