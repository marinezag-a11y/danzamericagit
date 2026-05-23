import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, HelpCircle, Sparkles, Zap, Award, ArrowRight, Building2, User, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useEventTracking } from '../../hooks/useEventTracking';

interface EnergyAdesaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string | null;
  initialBillValue?: string;
}

export function EnergyAdesaoModal({ isOpen, onClose, campaignId, initialBillValue = '' }: EnergyAdesaoModalProps) {
  const { trackEvent } = useEventTracking();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [averageBill, setAverageBill] = useState(initialBillValue);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const hasScrollbar = container.scrollHeight > container.clientHeight + 10;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 30;
    setShowScrollIndicator(hasScrollbar && !isNearBottom);
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        checkScrollability();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, success]);

  useEffect(() => {
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  useEffect(() => {
    if (isOpen) {
      trackEvent('Abrir Modal Adesão Energia', 'view');
      setName('');
      setCpf('');
      setWhatsapp('');
      setAverageBill(initialBillValue);
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, initialBillValue]);

  const maskPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/g, '$1-$2')
        .substring(0, 15);
    }
    return numbers.substring(0, 11);
  };

  const maskCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const isValidCpf = (cpfStr: string) => {
    const cpfNum = cpfStr.replace(/[^\d]+/g, '');
    if (cpfNum.length !== 11 || !!cpfNum.match(/(\d)\1{10}/)) return false;
    let split = cpfNum.split('').map(Number);
    let rest = (split.slice(0, 9).reduce((acc, curr, i) => acc + curr * (10 - i), 0) * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== split[9]) return false;
    rest = (split.slice(0, 10).reduce((acc, curr, i) => acc + curr * (11 - i), 0) * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    return rest === split[10];
  };

  const handleBillChange = (value: string) => {
    const sanitized = value.replace(/[^0-9,.]/g, '');
    setAverageBill(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setError('Erro de inicialização do banco de dados.');
      return;
    }

    if (!name || !whatsapp || !cpf || !averageBill) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!isValidCpf(cpf)) {
      setError('CPF inválido. Verifique os números digitados.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const numericBill = parseFloat(averageBill.replace(',', '.'));
    if (isNaN(numericBill) || numericBill <= 0) {
      setError('Por favor, insira um valor válido para a conta de luz.');
      setSubmitting(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('energy_leads')
        .insert({
          person_type: 'fisica',
          name,
          cpf: cpf.replace(/\D/g, ''),
          cnpj: null,
          consumer_unit: '000000',
          email: `${whatsapp.replace(/\D/g, '')}@tatienergy.com`,
          whatsapp: whatsapp.replace(/\D/g, ''),
          city: 'Belo Horizonte',
          average_bill: numericBill,
          status: 'pending',
          campaign_id: campaignId || null
        });

      if (insertError) {
        console.error('Error inserting lead:', insertError);
        setError('Ocorreu um erro ao processar sua adesão. Por favor, tente novamente.');
      } else {
        setSuccess(true);
        trackEvent('Adesão Plano Energia Concluída', 'conversion', { average_bill: numericBill });
      }
    } catch (err: any) {
      console.error('Unexpected error inserting lead:', err);
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={checkScrollability}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-dark/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="modal-container relative z-10 w-full max-w-xl bg-white text-zinc-900 overflow-hidden flex flex-col rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-white/20"
      >
        {/* Header */}
        <div className="modal-header border-b border-zinc-100 px-8 py-6 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 fill-emerald-600" />
            </div>
            <div>
              <p className="text-emerald-600 text-[10px] uppercase tracking-[0.2em] font-black mb-0.5">
                Economia Inteligente
              </p>
              <h2 className="text-xl font-bold text-zinc-800 leading-tight">
                Adesão ao Plano de Energia
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-black/5 hover:bg-black/10 rounded-full text-brand-dark/40 hover:text-brand-dark transition-all transform hover:rotate-90"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content overflow-y-auto max-h-[70vh] px-8 py-8">
          {!success ? (
            <div className="space-y-8">
              {/* Introduction Card */}
              <div className="p-6 bg-emerald-50/60 rounded-[1.8rem] border border-emerald-100 flex gap-4 items-start">
                <Zap className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-bold text-emerald-950 leading-tight">Como funciona?</h4>
                  <p className="text-emerald-900/70 text-xs leading-relaxed italic">
                    Ao preencher os dados abaixo, você solicita a injeção de energia limpa na sua conta. Nosso time analisará seu histórico e aplicará um desconto garantido sem qualquer alteração na sua instalação física ou cobrança de taxa de adesão!
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 block mb-2 px-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: João Silva Santos"
                        className="w-full p-4 bg-zinc-100/50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500/30 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 block mb-2 px-1">WhatsApp *</label>
                        <input
                          type="tel"
                          required
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                          placeholder="Ex: (31) 98888-8888"
                          className="w-full p-4 bg-zinc-100/50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500/30 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 block mb-2 px-1">CPF *</label>
                        <input
                          type="text"
                          required
                          value={cpf}
                          onChange={(e) => setCpf(maskCpf(e.target.value))}
                          placeholder="Ex: 123.456.789-00"
                          className="w-full p-4 bg-zinc-100/50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500/30 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 block mb-2 px-1">Valor Médio da Conta *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">R$</span>
                        <input
                          type="text"
                          required
                          value={averageBill}
                          onChange={(e) => handleBillChange(e.target.value)}
                          placeholder="Ex: 250,00"
                          className="w-full p-4 pl-10 bg-zinc-100/50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500/30 transition-all font-bold placeholder:text-zinc-400 text-zinc-900 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-xl"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg hover:shadow-emerald-600/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-95"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-current" />
                          Aderir ao Plano de Energia
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] rotate-12">
                  <CheckCircle className="w-10 h-10 animate-bounce" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg border border-black/5 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
                </div>
              </div>

              <h3 className="text-3xl font-serif text-brand-dark mb-4 italic leading-tight">Adesão Registrada!</h3>
              <p className="text-xs text-brand-dark/50 font-serif leading-relaxed max-w-sm mb-8 italic">
                Parabéns, {name.split(' ')[0]}! Seus dados foram salvos com sucesso e constam como <span className="text-emerald-600 font-bold font-display uppercase tracking-widest text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Pendente</span> para análise.
              </p>

              <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 max-w-md mx-auto text-left space-y-4 mb-10">
                <div className="flex gap-3 items-center">
                  <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-900">Benefícios Ativados</p>
                </div>
                <ul className="space-y-2 text-xs text-emerald-950/70 font-serif list-disc pl-5 leading-relaxed italic">
                  <li>Análise rápida do consumo médio informado de R$ {averageBill}.</li>
                  <li>Injeção direta de créditos de energia renovável.</li>
                  <li>Sem cobrança de taxa de adesão ou fidelidade.</li>
                  <li>Aviso e novidades via e-mail e WhatsApp informados.</li>
                </ul>
                <div className="mt-4 p-3 bg-emerald-100/50 rounded-xl border border-emerald-200/50">
                  <p className="text-xs text-emerald-800 font-medium text-center">
                    Próximo passo: <strong>Um especialista da nossa equipe entrará em contato em breve</strong> pelo seu WhatsApp para finalizar o processo de ativação.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-12 py-4 bg-brand-dark text-white rounded-[1.5rem] text-[10px] uppercase tracking-[0.3em] font-black hover:bg-emerald-600 transition-all shadow-md active:scale-95"
              >
                Concluir e Fechar
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-[10005] flex items-center gap-2 bg-brand-orange text-white px-5 py-2.5 rounded-full shadow-[0_20px_50px_rgba(204,0,0,0.3)] pointer-events-none border border-white/20 select-none animate-pulse"
            style={{ transform: 'translateX(-50%)' }}
          >
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider font-sans">
              Role para ver mais conteúdo
            </span>
            <ChevronDown size={14} className="animate-bounce" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
