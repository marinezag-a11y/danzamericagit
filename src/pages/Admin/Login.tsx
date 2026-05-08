import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Detect recovery mode from URL hash
    if (window.location.hash.includes('type=recovery') || window.location.href.includes('type=recovery')) {
      setMode('reset');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!supabase) {
      setMessage({ text: 'Erro de conexão com o servidor. Verifique as configurações.', type: 'error' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ text: error.message === 'Invalid login credentials' ? 'Credenciais Inválidas' : error.message, type: 'error' });
      setLoading(false);
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin#type=recovery`,
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Link de recuperação enviado! Verifique seu e-mail.', type: 'success' });
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Senha alterada com sucesso! Você já pode entrar.', type: 'success' });
      setTimeout(() => setMode('login'), 2000);
    }
    setLoading(false);
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
          {mode === 'login' && (
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
                <div className="flex justify-between items-center mb-3 ml-1">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40">Senha</label>
                  <button 
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] uppercase tracking-widest font-bold text-brand-orange hover:text-white transition-colors"
                  >
                    Esqueceu?
                  </button>
                </div>
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

              {message && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-[10px] uppercase font-bold tracking-widest text-center py-3 border ${message.type === 'error' ? 'text-brand-orange bg-brand-orange/10 border-brand-orange/20' : 'text-green-500 bg-green-500/10 border-green-500/20'}`}
                >
                  {message.text}
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
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="mb-8">
                <h3 className="text-xl font-serif text-white italic mb-2">Recuperar Senha</h3>
                <p className="text-white/40 text-xs leading-relaxed font-serif">Digite seu e-mail para receber um link de redefinição.</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 ml-1">Seu E-mail</label>
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

              {message && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-[10px] uppercase font-bold tracking-widest text-center py-3 border ${message.type === 'error' ? 'text-brand-orange bg-brand-orange/10 border-brand-orange/20' : 'text-green-500 bg-green-500/10 border-green-500/20'}`}
                >
                  {message.text}
                </motion.p>
              )}

              <div className="flex flex-col gap-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange text-white py-5 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar Link de Reset'}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
                </button>
                <button 
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors"
                >
                  Voltar para Login
                </button>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="mb-8">
                <h3 className="text-xl font-serif text-white italic mb-2">Nova Senha</h3>
                <p className="text-white/40 text-xs leading-relaxed font-serif">Defina sua nova senha de acesso.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 ml-1">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="No mínimo 6 caracteres"
                      className="w-full bg-white/5 border border-white/10 px-12 py-4 text-white placeholder:text-white/10 focus:border-brand-orange focus:outline-none transition-all text-sm font-serif"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 ml-1">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full bg-white/5 border border-white/10 px-12 py-4 text-white placeholder:text-white/10 focus:border-brand-orange focus:outline-none transition-all text-sm font-serif"
                      required
                    />
                  </div>
                </div>
              </div>

              {message && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-[10px] uppercase font-bold tracking-widest text-center py-3 border ${message.type === 'error' ? 'text-brand-orange bg-brand-orange/10 border-brand-orange/20' : 'text-green-500 bg-green-500/10 border-green-500/20'}`}
                >
                  {message.text}
                </motion.p>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange text-white py-5 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
              >
                {loading ? 'Alterando...' : 'Redefinir e Entrar'}
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-white/10 flex justify-center">
            <a href="/" className="text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors">Voltar para o site público</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
