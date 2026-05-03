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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-brand-dark border border-white/10 p-8 md:p-12 max-w-xl w-full relative overflow-hidden shadow-2xl"
        >
          <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>

          <div className="mb-12">
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Solicitação de Proposta</p>
            <h3 className="text-3xl md:text-4xl text-white font-serif italic">{tierName}</h3>
            <div className="h-[1px] w-12 bg-brand-orange mt-6"></div>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h4 className="text-2xl font-serif text-white mb-4">Solicitação Enviada!</h4>
                <p className="text-white/40 font-serif leading-relaxed">
                  Obrigado pelo seu interesse. Enviamos uma confirmação para seu e-mail e nossa equipe entrará em contato em breve.
                </p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Seu Nome</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        required
                        name="name"
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm font-serif focus:border-brand-orange outline-none transition-all text-white"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Empresa/Pessoa física</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        name="company"
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm font-serif focus:border-brand-orange outline-none transition-all text-white"
                        placeholder="Razão Social ou Nome"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        required
                        name="phone"
                        type="tel" 
                        className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm font-serif focus:border-brand-orange outline-none transition-all text-white"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">E-mail para Contato</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        required
                        name="email"
                        type="email" 
                        className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm font-serif focus:border-brand-orange outline-none transition-all text-white"
                        placeholder="exemplo@email.com"
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs font-serif italic">{error}</p>}

                <button 
                  disabled={loading}
                  className="w-full bg-brand-orange text-white py-5 font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-lg"
                >
                  {loading ? 'Enviando...' : 'Solicitar Proposta Comercial'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
