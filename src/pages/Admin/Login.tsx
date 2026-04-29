import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <img src="/logo_branca.png" alt="Danzamerica" className="h-20 mx-auto mb-8" />
          <h1 className="text-3xl font-serif text-white italic">Acesso Administrativo</h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] mt-4 font-display">Gerencie o futuro de Minas</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/10 px-12 py-4 text-white placeholder:text-white/10 focus:border-brand-orange focus:outline-none transition-all text-sm font-serif"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 px-12 py-4 text-white placeholder:text-white/10 focus:border-brand-orange focus:outline-none transition-all text-sm font-serif"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-brand-orange text-[10px] uppercase font-bold tracking-widest text-center bg-brand-orange/10 py-3 border border-brand-orange/20"
              >
                {error === 'Invalid login credentials' ? 'Credenciais Inválidas' : error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange text-white py-5 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar no Painel'}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 flex justify-center">
            <a href="/" className="text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors">Voltar para o site público</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
