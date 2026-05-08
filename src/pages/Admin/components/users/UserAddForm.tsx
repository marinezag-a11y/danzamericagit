import React, { useState, useEffect } from 'react';
import { 
  X, 
  Loader2, 
  EyeOff, 
  Eye, 
  Plus 
} from 'lucide-react';

interface UserAddFormProps {
  onAdd: (data: any) => Promise<void>;
  onClose: () => void;
  adding: boolean;
}

export function UserAddForm({ onAdd, onClose, adding }: UserAddFormProps) {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  useEffect(() => {
    generatePassword();
  }, []);

  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-sm shadow-2xl mb-8">
      <form onSubmit={(e) => {
        e.preventDefault();
        onAdd({ email: newEmail, password: newPassword, full_name: newName });
      }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
}
