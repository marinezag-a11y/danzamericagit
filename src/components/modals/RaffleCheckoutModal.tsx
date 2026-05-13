import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, ArrowRight, Loader2, CheckCircle, Copy, RotateCw, Check, Smartphone, ChevronRight } from 'lucide-react';
import { RaffleCampaign, useRaffles } from '../../hooks/useRaffles';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { supabase } from '../../lib/supabase';
import { Toast } from '../ui/Toast';
import { LuckyRoulette } from '../ui/LuckyRoulette';

interface RaffleCheckoutModalProps {
  campaign: RaffleCampaign;
  onClose: () => void;
}

type Step = 'quantity' | 'roulette' | 'checkout' | 'success';

export function RaffleCheckoutModal({ campaign, onClose }: RaffleCheckoutModalProps) {
  const { fetchTakenTickets, createOrder } = useRaffles();
  const { settings } = useSiteSettings();
  
  const [step, setStep] = useState<Step>('quantity');
  const [takenTickets, setTakenTickets] = useState<number[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpunOnce, setHasSpunOnce] = useState(false);
  const [fixedIndices, setFixedIndices] = useState<number[]>([]);
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  
  const pixKey = settings?.pix_key_checkout?.value || settings?.pix_key?.value || "ballettatianafigueiredo@gmail.com";
  const pixType = settings?.pix_checkout_type?.value || "E-mail";
  const pixReceiver = settings?.pix_checkout_receiver?.value || "Tatiana Figueiredo";
  const [pixBank, setPixBank] = useState(settings?.pix_checkout_bank?.value || "NuBank");
  const [toast, setToast] = useState<{ show: boolean, message: string, variant: 'success' | 'danger' | 'warning' | 'info' }>({
    show: false,
    message: '',
    variant: 'success'
  });

  const showToast = (message: string, variant: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    setToast({ show: true, message, variant });
  };

  const availableNumbers = useMemo(() => {
    const all = Array.from({ length: campaign.total_numbers }, (_, i) => i + 1);
    return all.filter(n => !takenTickets.includes(n));
  }, [campaign.total_numbers, takenTickets]);

  useEffect(() => {
    const loadTaken = async () => {
      const taken = await fetchTakenTickets(campaign.id);
      setTakenTickets(taken);
    };
    loadTaken();

    // Inscrição em tempo real para atualizações de disponibilidade
    const channel = supabase
      .channel('public:raffle_availability')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'raffle_orders',
        filter: `campaign_id=eq.${campaign.id}`
      }, () => loadTaken())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'raffle_reservations',
        filter: `campaign_id=eq.${campaign.id}`
      }, () => loadTaken())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaign.id]);

  const handleReserve = async (nums: number[]) => {
    if (!campaign || nums.length === 0) return;

    try {
      // Limpar anterior
      await supabase.from('raffle_reservations').delete().eq('session_id', sessionId);

      // Nova reserva por 1 minuto
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 1);

      const { error } = await supabase
        .from('raffle_reservations')
        .insert([{
          campaign_id: campaign.id,
          selected_numbers: nums,
          session_id: sessionId,
          expires_at: expiresAt.toISOString()
        }]);

      if (error) throw error;
      
      const taken = await fetchTakenTickets(campaign.id);
      setTakenTickets(taken);
    } catch (err) {
      console.error('Error reserving numbers:', err);
    }
  };

  const handleNext = () => {
    if (step === 'quantity') setStep('roulette');
    else if (step === 'roulette') setStep('checkout');
  };

  const handleBack = () => {
    if (step === 'roulette') {
      setStep('quantity');
      setHasSpunOnce(false);
      setFixedIndices([]);
    }
    else if (step === 'checkout') setStep('roulette');
  };

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

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNumbers.length === 0) return;

    setSubmitting(true);
    try {
      const newOrderId = crypto.randomUUID();
      const orderData = {
        id: newOrderId,
        campaign_id: campaign.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        selected_numbers: selectedNumbers,
        total_price: selectedNumbers.length * campaign.price_per_number,
        session_id: sessionId
      };

      const result = await createOrder(orderData);

      if (result.success) {
        await supabase.from('raffle_reservations').delete().eq('session_id', sessionId);
        setStep('success');
        
        if (supabase) {
          supabase.functions.invoke('send-order', {
            body: {
              ...orderData,
              order_id: newOrderId,
              type: 'raffle_order',
              campaign_name: campaign.name,
              items: [
                { 
                  name: `Rifa: ${campaign.name}`, 
                  price: orderData.total_price,
                  description: `Números: ${selectedNumbers.join(', ')}`
                }
              ],
              pix_key: pixKey,
              pix_type: pixType,
              pix_receiver: pixReceiver,
              pix_bank: pixBank,
              contact_whatsapp: settings?.contact_whatsapp?.value
            }
          }).catch(e => console.error('Background email error:', e));
        }
      } else {
        // Se houver erro de redundância ou outro erro
        if (result.error?.includes('redundancy') || result.error?.includes('vendidos') || result.error?.includes('RESERVADOS')) {
          showToast('Ops! Um ou mais números selecionados acabaram de ser reservados por outra pessoa. Por favor, escolha outros números.', 'danger');
          // Atualizar lista de números ocupados
          const taken = await fetchTakenTickets(campaign.id);
          setTakenTickets(taken);
          setSelectedNumbers([]);
          setStep('roulette');
          setHasSpunOnce(false);
        } else {
          showToast(result.error || 'Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.', 'danger');
        }
      }
    } catch (err) {
      console.error('Order error:', err);
      showToast('Ocorreu um erro inesperado. Por favor, tente novamente.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-dark/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="modal-container relative z-10 w-full max-w-4xl"
      >
        {/* Progress Bar */}
        {step !== 'success' && (
          <div className="absolute top-0 left-0 w-full h-2 bg-black/5">
            <motion.div 
              className="h-full bg-brand-orange"
              initial={{ width: '0%' }}
              animate={{ 
                width: step === 'quantity' ? '33%' : 
                       step === 'roulette' ? '66%' : '100%' 
              }}
            />
          </div>
        )}

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-50 p-2 bg-white/80 rounded-full text-brand-dark/20 hover:text-brand-orange transition-all shadow-lg"
        >
          <X size={20} />
        </button>

        <div className="modal-content p-6 sm:p-12">
          <AnimatePresence mode="wait">
            {step === 'quantity' && (
              <motion.div 
                key="step-qty"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center gap-8 py-8"
              >
                <div className="text-center space-y-2">
                  <p className="text-brand-orange text-[10px] uppercase tracking-[0.3em] font-black">ETAPA 1 DE 3</p>
                  <h2 className="text-3xl sm:text-5xl font-serif italic text-brand-dark">{campaign.name}</h2>
                  <p className="text-sm text-brand-dark/40 font-serif italic">Quantos números da sorte você deseja?</p>
                </div>

                <div className="flex items-center gap-8 sm:gap-12 bg-black/[0.02] p-8 sm:p-12 rounded-[3rem] border border-black/5">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl font-light hover:bg-brand-dark hover:text-white transition-all active:scale-90"
                  >
                    -
                  </button>
                  <div className="text-center min-w-[100px]">
                    <span className="text-6xl sm:text-8xl font-serif italic text-brand-dark">{quantity}</span>
                    <p className="text-[10px] uppercase tracking-widest text-brand-dark/20 font-black mt-2">NÚMEROS</p>
                  </div>
                  <button 
                    onClick={() => setQuantity(Math.min(campaign.numbers_per_order || 20, availableNumbers.length, quantity + 1))}
                    className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl font-light hover:bg-brand-dark hover:text-white transition-all active:scale-90"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-col items-center gap-6 w-full">
                  <button 
                    onClick={handleNext}
                    className="w-full sm:w-auto px-16 py-6 bg-brand-dark text-white rounded-[2rem] text-[12px] uppercase tracking-[0.4em] font-black hover:bg-brand-orange transition-all shadow-2xl flex items-center justify-center gap-4 group"
                  >
                    CONTINUAR PARA SORTEIO <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                  <p className="text-[10px] font-black text-brand-dark/20 uppercase tracking-widest">
                    Investimento Total: R$ {(quantity * campaign.price_per_number).toFixed(2)}
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'roulette' && (
              <motion.div 
                key="step-roulette"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-8 py-4"
              >
                <div className="text-center space-y-2">
                  <p className="text-brand-orange text-[10px] uppercase tracking-[0.3em] font-black">ETAPA 2 DE 3</p>
                  <h2 className="text-3xl font-serif italic text-brand-dark">Sorteio da Sorte</h2>
                </div>

                <LuckyRoulette 
                  availableNumbers={availableNumbers}
                  quantityToSelect={quantity}
                  onNumbersSelected={(nums) => {
                    setSelectedNumbers(nums);
                    setHasSpunOnce(true);
                    handleReserve(nums);
                  }}
                  isSpinning={isSpinning}
                  setIsSpinning={setIsSpinning}
                  fixedIndices={fixedIndices}
                  onToggleFix={(idx) => setFixedIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                  selectedNumbers={selectedNumbers}
                  hasSpunOnce={hasSpunOnce}
                />

                <div className="flex flex-col items-center gap-6 w-full pt-4">
                  {!hasSpunOnce ? (
                    <button 
                      onClick={() => setIsSpinning(true)}
                      disabled={isSpinning}
                      className="w-full sm:w-auto px-20 py-7 bg-brand-orange text-white rounded-[2rem] text-[13px] uppercase tracking-[0.4em] font-black hover:bg-brand-dark transition-all shadow-2xl flex items-center justify-center gap-4"
                    >
                      <RotateCw size={18} className={isSpinning ? 'animate-spin' : ''} />
                      {isSpinning ? 'SORTEANDO...' : 'GIRAR SORTE'}
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button 
                        onClick={() => setIsSpinning(true)}
                        disabled={isSpinning}
                        className="px-10 py-5 border-2 border-brand-orange text-brand-orange rounded-[2rem] text-[11px] uppercase tracking-widest font-black hover:bg-brand-orange/5 transition-all flex items-center gap-3"
                      >
                        <RotateCw size={14} className={isSpinning ? 'animate-spin' : ''} /> RE-SORTEAR
                      </button>
                      <button 
                        onClick={handleNext}
                        className="px-16 py-6 bg-brand-dark text-white rounded-[2rem] text-[11px] uppercase tracking-widest font-black hover:bg-brand-orange transition-all shadow-xl flex items-center gap-3"
                      >
                        CONFIRMAR NÚMEROS <Check size={18} />
                      </button>
                    </div>
                  )}
                  <button onClick={handleBack} className="text-[9px] uppercase tracking-widest font-black text-brand-dark/20 hover:text-brand-dark italic">Alterar Quantidade</button>
                </div>
              </motion.div>
            )}

            {step === 'checkout' && (
              <motion.div 
                key="step-checkout"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12"
              >
                <div className="bg-brand-dark text-white p-10 rounded-[3rem] space-y-8">
                  <div className="space-y-2">
                    <p className="text-brand-orange text-[9px] uppercase tracking-[0.4em] font-black">RESUMO DO PEDIDO</p>
                    <h3 className="text-2xl font-serif italic">{campaign.name}</h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">NÚMEROS SORTEADOS:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedNumbers.map(n => (
                        <span key={n} className="px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white/90">#{String(n).padStart(3, '0')}</span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[11px] uppercase tracking-widest text-white/30 font-black">TOTAL:</span>
                    <span className="text-4xl font-serif italic text-brand-orange">R$ {(selectedNumbers.length * campaign.price_per_number).toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleOrder} className="space-y-6 py-4">
                  <div className="space-y-4">
                    <input 
                      type="text" required placeholder="Seu Nome Completo"
                      value={customerName} onChange={e => setCustomerName(e.target.value)}
                      className="w-full p-6 bg-black/[0.04] border border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium"
                    />
                    <input 
                      type="email" required placeholder="E-mail para contato"
                      value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full p-6 bg-black/[0.04] border border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium"
                    />
                    <input 
                      type="tel" required placeholder="WhatsApp (00) 00000-0000"
                      value={customerPhone} onChange={e => setCustomerPhone(maskPhone(e.target.value))}
                      className="w-full p-6 bg-black/[0.04] border border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium"
                    />
                  </div>

                  <div className="pt-6 space-y-4">
                    <button 
                      type="submit" disabled={submitting}
                      className="w-full py-7 bg-brand-orange text-white rounded-2xl text-[13px] uppercase tracking-[0.4em] font-black hover:bg-brand-dark transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Check size={20} strokeWidth={3} /> FINALIZAR E APOIAR</>}
                    </button>
                    <button type="button" onClick={handleBack} className="w-full text-[10px] uppercase tracking-widest font-black text-brand-dark/20 hover:text-brand-dark italic">Revisar Sorteio</button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="step-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-8 py-8"
              >
                <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl rotate-12">
                  <Check size={48} strokeWidth={4} />
                </div>

                <div className="space-y-3">
                  <h3 className="text-3xl font-serif italic text-brand-dark">Pedido de Rifa Recebido!</h3>
                  <p className="text-sm text-brand-dark/50 italic max-w-md mx-auto">
                    Seus números foram reservados com sucesso. Agora realize o pagamento via PIX para oficializar sua participação.
                  </p>
                </div>

                <div className="w-full max-w-sm bg-white p-8 rounded-[3rem] border border-black/5 shadow-2xl space-y-8">
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-brand-dark/30 font-black">CHAVE PIX ({pixType})</p>
                    <div className="bg-black/[0.04] p-6 rounded-[2rem] border border-transparent">
                      <p className="font-mono text-sm text-brand-dark break-all font-black">{pixKey}</p>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(pixKey);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 3000);
                      }}
                      className="w-full py-4 bg-brand-orange/10 text-brand-orange text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-brand-orange hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      {copied ? <><Check size={12} /> COPIADO!</> : <><Copy size={12} /> COPIAR CHAVE PIX</>}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-left border-t border-black/5 pt-8">
                    <div>
                      <p className="text-[8px] uppercase tracking-widest text-brand-dark/30 font-black mb-1">BANCO</p>
                      <p className="text-xs font-black text-brand-dark">{pixBank}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-widest text-brand-dark/30 font-black mb-1">RECEBEDOR</p>
                      <p className="text-xs font-black text-brand-dark">{pixReceiver}</p>
                    </div>
                  </div>

                  <a 
                    href={`https://wa.me/55${(settings?.contact_whatsapp?.value || '31992127292').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Fiz minha participação na rifa ${campaign.name} e quero enviar o comprovante.`)}`}
                    target="_blank"
                    className="w-full py-6 bg-[#25D366] text-white rounded-[2rem] text-[11px] uppercase tracking-[0.4em] font-black hover:shadow-green-500/40 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Smartphone size={20} /> ENVIAR COMPROVANTE
                  </a>
                </div>

                <button onClick={onClose} className="px-12 py-4 text-[10px] uppercase tracking-widest font-black text-brand-dark/20 hover:text-brand-dark italic">Concluir e Fechar</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <Toast 
        show={toast.show} 
        message={toast.message} 
        variant={toast.variant} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
}
