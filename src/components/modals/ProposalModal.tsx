import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, User, Building2, Phone, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProposalModalProps {
  tierName: string;
  tierPrice: string;
  tierBenefits: string[];
  onClose: () => void;
}

export function ProposalModal({ tierName, tierPrice, tierBenefits, onClose }: ProposalModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      tier_name: tierName,
      tier_price: tierPrice,
      tier_benefits: tierBenefits
    };

    try {
      const { error: insertError } = await supabase
        .from('proposal_requests')
        .insert([{
          name: data.name,
          company: data.company,
          phone: data.phone,
          email: data.email,
          tier_name: data.tier_name
        }]);

      if (insertError) throw insertError;

      // Call Edge Function
      await supabase.functions.invoke('send-proposal', { body: data });

      setSuccess(true);
      setTimeout(onClose, 4000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-brand-dark/90 border border-white/10 w-full max-w-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative rounded-[3.5rem] overflow-hidden"
        >
          <div className="p-10 md:p-14 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div>
              <p className="text-brand-orange text-[9px] uppercase tracking-[0.5em] font-black mb-3">PARCERIA COMERCIAL</p>
              <h3 className="text-3xl font-serif italic text-white leading-tight">{tierName}</h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all transform hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-10 md:p-14">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-emerald-500/20 shadow-2xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-3xl font-serif text-white mb-6 italic leading-tight">Solicitação Enviada!</h4>
                  <p className="text-white/40 font-serif leading-relaxed italic px-4">
                    Recebemos seu interesse com entusiasmo. Em breve, nossa equipe entrará em contato para detalhar os próximos passos desta parceria.
                  </p>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="space-y-10"
                >
                  <div className="space-y-6">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-black ml-2">DADOS DE CONTATO</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative group">
                          <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                          <input 
                            required name="name" type="text" 
                            className="w-full bg-white/5 border border-white/5 p-6 pl-14 rounded-2xl text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium"
                            placeholder="Nome Completo"
                          />
                        </div>
                        <div className="relative group">
                          <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                          <input 
                            name="company" type="text" 
                            className="w-full bg-white/5 border border-white/5 p-6 pl-14 rounded-2xl text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium"
                            placeholder="Empresa / Razão"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative group">
                          <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                          <input 
                            required name="phone" type="tel" 
                            className="w-full bg-white/5 border border-white/5 p-6 pl-14 rounded-2xl text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium"
                            placeholder="WhatsApp"
                          />
                        </div>
                        <div className="relative group">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                          <input 
                            required name="email" type="email" 
                            className="w-full bg-white/5 border border-white/5 p-6 pl-14 rounded-2xl text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium"
                            placeholder="E-mail Corporativo"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-brand-orange/10 border-l-4 border-brand-orange text-brand-orange text-[10px] uppercase font-black tracking-widest italic">
                      {error}
                    </motion.p>
                  )}

                  <div className="space-y-6">
                    <button 
                      disabled={loading}
                      className="w-full bg-brand-orange text-white py-7 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-brand-dark transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95"
                    >
                      {loading ? 'PROCESSANDO...' : 'SOLICITAR PROPOSTA COMERCIAL'}
                    </button>
                    <p className="text-center text-[8px] uppercase tracking-widest font-black text-white/10 italic">
                      NOSSA EQUIPE ANALISARÁ E RESPONDERÁ EM ATÉ 24 HORAS
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
