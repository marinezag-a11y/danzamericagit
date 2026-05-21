import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Ticket, Loader2, Smartphone, Mail, User, RotateCw, Check, Copy } from 'lucide-react';
import { WheelPicker } from '../ui/WheelPicker';
import { LuckyRoulette } from '../ui/LuckyRoulette';
import { Toast } from '../ui/Toast';
import { useDancers, Dancer } from '../../hooks/useDancers';
import { useRaffles, RaffleCampaign } from '../../hooks/useRaffles';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { supabase } from '../../lib/supabase';

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

interface DancerSponsorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string; // If null, we'll try to find an active one
}

type Step = 'dancer' | 'quantity' | 'roulette' | 'checkout' | 'infinitepay_checkout' | 'success';

export function DancerSponsorshipModal({ isOpen, onClose, campaignId }: DancerSponsorshipModalProps) {
  const { dancers, loading: loadingDancers } = useDancers();
  const { campaigns, loading: loadingCampaigns, fetchTakenTickets, createOrder } = useRaffles();
  const { settings } = useSiteSettings();

  const [step, setStep] = useState<Step>('dancer');
  const [selectedDancer, setSelectedDancer] = useState<Dancer | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [fixedIndices, setFixedIndices] = useState<number[]>([]);
  const [takenNumbers, setTakenNumbers] = useState<number[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpunOnce, setHasSpunOnce] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [lastReservedNumbers, setLastReservedNumbers] = useState<number[]>([]);

  // Estados para integração com InfinitePay
  const [infinitePayUrl, setInfinitePayUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'automatic' | 'manual'>('automatic');
  const [isConfirmedAutomatic, setIsConfirmedAutomatic] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [copied, setCopied] = useState(false);

  const [toast, setToast] = useState<{ show: boolean, message: string, variant: 'success' | 'danger' | 'warning' | 'info' }>({
    show: false,
    message: '',
    variant: 'success'
  });

  const showToast = (message: string, variant: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    setToast({ show: true, message, variant });
  };

  const toggleFixNumber = (index: number) => {
    if (isSpinning) return;
    setFixedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const activeCampaign = useMemo(() => {
    if (campaignId) return campaigns.find(c => c.id === campaignId);
    return campaigns.find(c => c.is_active);
  }, [campaigns, campaignId]);

  const availableNumbers = useMemo(() => {
    if (!activeCampaign) return [];
    const all = Array.from({ length: activeCampaign.total_numbers }, (_, i) => i + 1);
    return all.filter(n => !takenNumbers.includes(n));
  }, [activeCampaign, takenNumbers]);

  useEffect(() => {
    if (!isOpen || !activeCampaign) return;

    const loadTaken = async () => {
      const taken = await fetchTakenTickets(activeCampaign.id);
      setTakenNumbers(taken);
    };
    loadTaken();

    // Inscrição em tempo real para atualizações de disponibilidade
    const channel = supabase
      .channel('public:dancer_sponsorship_availability')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'raffle_orders',
        filter: `campaign_id=eq.${activeCampaign.id}`
      }, () => loadTaken())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'raffle_reservations',
        filter: `campaign_id=eq.${activeCampaign.id}`
      }, () => loadTaken())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, activeCampaign]);

  useEffect(() => {
    if (dancers.length > 0 && !selectedDancer) {
      const active = dancers.find(d => d.is_active);
      if (active) setSelectedDancer(active);
    }
  }, [dancers]);

  // Escutar a confirmação do pagamento via Pix automático em tempo real
  useEffect(() => {
    if (step !== 'infinitepay_checkout' || !orderId) return;

    console.log(`[Realtime] Subscrevendo ao status do pedido ${orderId}`);
    
    const channel = supabase
      .channel(`sponsorship_order_payment_status:${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'raffle_orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        console.log('[Realtime] Payload de atualização do pedido:', payload);
        if (payload.new && payload.new.status === 'paid') {
          console.log('[Realtime] Pagamento confirmado! Avançando para a tela de sucesso.');
          setIsConfirmedAutomatic(true);
          showToast('Pagamento confirmado via Pix com sucesso!', 'success');
          setStep('success');
        }
      })
      .subscribe();

    return () => {
      console.log(`[Realtime] Removendo subscrição do pedido ${orderId}`);
      supabase.removeChannel(channel);
    };
  }, [step, orderId]);

  // Timer de 60 segundos com cancelamento automático de ordens expiradas no Supabase
  useEffect(() => {
    if (step !== 'infinitepay_checkout' || !orderId) return;

    if (timeLeft <= 0) {
      const cancelExpiredOrder = async () => {
        try {
          console.log(`[Timer] Tempo esgotado para o pedido ${orderId}. Cancelando no banco...`);
          await supabase
            .from('raffle_orders')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', orderId);

          showToast('Tempo limite de 1 minuto excedido. Seus números foram liberados.', 'danger');
          
          setStep('roulette');
          setHasSpunOnce(false);
          setSelectedNumbers([]);
          setTimeLeft(60);
        } catch (error) {
          console.error('[Timer] Erro ao cancelar pedido expirado:', error);
        }
      };
      cancelExpiredOrder();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, orderId, timeLeft]);

  const handleNext = () => {
    if (step === 'dancer') setStep('quantity');
    else if (step === 'quantity') setStep('roulette');
    else if (step === 'roulette') setStep('checkout');
  };

  const handleBack = () => {
    if (step === 'quantity') setStep('dancer');
    else if (step === 'roulette') {
      setStep('quantity');
      setHasSpunOnce(false);
      setFixedIndices([]);
    }
    else if (step === 'checkout') setStep('roulette');
  };

  const handleReserve = async (nums: number[]) => {
    if (!activeCampaign || nums.length === 0) return;

    try {
      // Remover reserva anterior se existir
      if (lastReservedNumbers.length > 0) {
        await supabase
          .from('raffle_reservations')
          .delete()
          .eq('session_id', sessionId);
      }

      // Criar nova reserva válida por 1 minuto
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 1);

      const { error } = await supabase
        .from('raffle_reservations')
        .insert([{
          campaign_id: activeCampaign.id,
          selected_numbers: nums,
          session_id: sessionId,
          expires_at: expiresAt.toISOString()
        }]);

      if (error) throw error;
      setLastReservedNumbers(nums);
      
      // Atualizar lista de números tomados localmente para refletir a reserva
      fetchTakenTickets(activeCampaign.id).then(setTakenNumbers);
    } catch (err) {
      console.error('Error reserving numbers:', err);
    }
  };

  // Limpar reserva ao fechar o modal
  useEffect(() => {
    return () => {
      if (sessionId && activeCampaign) {
        supabase
          .from('raffle_reservations')
          .delete()
          .eq('session_id', sessionId)
          .then(() => {});
      }
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeCampaign) {
      showToast('Nenhuma campanha ativa encontrada. Por favor, tente novamente mais tarde.', 'danger');
      return;
    }

    if (selectedNumbers.length === 0) {
      showToast('Por favor, sorteie seus números antes de confirmar.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Fallback para UUID caso crypto.randomUUID não esteja disponível
      const newOrderId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      setOrderId(newOrderId);

      const orderData = {
        id: newOrderId,
        campaign_id: activeCampaign.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        selected_numbers: selectedNumbers,
        total_price: selectedNumbers.length * activeCampaign.price_per_number,
        dancer_name: selectedDancer?.name || 'Geral',
        session_id: sessionId
      };

      const res = await createOrder(orderData);
      
      if (res && res.success) {
        // Limpar reserva imediatamente ao ter sucesso no pedido
        await supabase
          .from('raffle_reservations')
          .delete()
          .eq('session_id', sessionId);

        const pixKey = settings?.pix_key_checkout?.value || settings?.pix_key?.value || 'ballettatianafigueiredo@gmail.com';
        const pixReceiver = settings?.pix_checkout_receiver?.value || 'Tatiana Aparecida Figueiredo';
        const pixBank = settings?.pix_checkout_bank?.value || 'SICOOB';
        const pixType = settings?.pix_checkout_type?.value || 'E-mail';
        const contactWhatsapp = settings?.contact_whatsapp?.value || '31992127292';

        if (paymentMethod === 'automatic') {
          console.log('[Payment] Generating InfinitePay Pix link for Dancer Sponsorship...');
          try {
            const { data: payData, error: payError } = await supabase.functions.invoke('create-infinitepay-payment', {
              body: {
                order_id: newOrderId,
                total_price: orderData.total_price,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                campaign_name: `${activeCampaign.name} (Apoio: ${selectedDancer?.name || 'Geral'})`
              }
            });

            if (payError || !payData?.url) {
              console.error('[Payment] InfinitePay creation error:', payError);
              const errorDetails = payError?.message || (payError ? JSON.stringify(payError) : 'Sem URL retornada');
              showToast(`Não foi possível iniciar o Pix automático: ${errorDetails}. Redirecionando para Pix manual.`, 'warning');
              setStep('success'); // Fallback para Pix manual
            } else {
              console.log('[Payment] InfinitePay link generated successfully:', payData.url);
              setInfinitePayUrl(payData.url);
              setIframeLoading(true);
              setTimeLeft(60); // Inicia o contador de 1 minuto
              setStep('infinitepay_checkout');

              // Background notification
              if (supabase) {
                supabase.functions.invoke('send-order', {
                  body: {
                    ...orderData,
                    order_id: newOrderId,
                    type: 'raffle_order',
                    campaign_name: activeCampaign.name,
                    dancer_name: selectedDancer?.name || 'Geral',
                    items: [
                      { 
                        name: `Apoio ao Talento: ${selectedDancer?.name || 'Geral'}`, 
                        price: activeCampaign.price_per_number * selectedNumbers.length,
                        description: `Campanha: ${activeCampaign.name} | Números: ${selectedNumbers.join(', ')}`
                      }
                    ],
                    pix_key: pixKey,
                    pix_receiver: pixReceiver,
                    pix_bank: pixBank,
                    pix_type: pixType,
                    contact_whatsapp: contactWhatsapp
                  }
                }).catch(e => console.error('Background email error:', e));
              }
            }
          } catch (payException) {
            console.error('[Payment] Payment integration exception:', payException);
            setStep('success'); // Fallback
          }
        } else {
          // Pagamento Pix manual
          setStep('success');
          
          // Background notification
          if (supabase) {
            supabase.functions.invoke('send-order', {
              body: {
                ...orderData,
                order_id: newOrderId,
                type: 'raffle_order',
                campaign_name: activeCampaign.name,
                dancer_name: selectedDancer?.name || 'Geral',
                items: [
                  { 
                    name: `Apoio ao Talento: ${selectedDancer?.name || 'Geral'}`, 
                    price: activeCampaign.price_per_number * selectedNumbers.length,
                    description: `Campanha: ${activeCampaign.name} | Números: ${selectedNumbers.join(', ')}`
                  }
                ],
                pix_key: pixKey,
                pix_receiver: pixReceiver,
                pix_bank: pixBank,
                pix_type: pixType,
                contact_whatsapp: contactWhatsapp
              }
            }).catch(e => console.error('Background email error:', e));
          }
        }
      } else {
        if (res?.error?.includes('redundancy') || res?.error?.includes('vendidos') || res?.error?.includes('RESERVADOS')) {
          showToast('Ops! Um ou mais números selecionados acabaram de ser reservados por outra pessoa. Por favor, escolha outros números.', 'danger');
          const taken = await fetchTakenTickets(activeCampaign.id);
          setTakenNumbers(taken);
          setSelectedNumbers([]);
          setStep('roulette');
          setHasSpunOnce(false);
        } else {
          console.error('Order creation failed:', res?.error);
          showToast(res?.error || 'Erro ao criar pedido. Por favor, tente novamente.', 'danger');
        }
      }
    } catch (error: any) {
      console.error('Error submitting order:', error);
      showToast(error.message || 'Ocorreu um erro inesperado.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
        className="modal-container relative z-10"
      >
        {/* Progress Bar */}
        {step !== 'success' && (
          <div className="absolute top-0 left-0 w-full h-2 bg-black/5">
            <motion.div 
              className="h-full bg-brand-orange shadow-[0_0_15px_rgba(204,0,0,0.4)]"
              initial={{ width: '0%' }}
              animate={{ 
                width: step === 'dancer' ? '25%' : 
                       step === 'quantity' ? '50%' : 
                       step === 'roulette' ? '75%' : '100%' 
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        )}

        {/* Close Button - Moved and styled for better mobile fit */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50 p-3 bg-white/80 hover:bg-white rounded-full text-brand-dark/40 hover:text-brand-orange transition-all shadow-lg border border-black/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="modal-content relative">
          {/* Header - Compact for Mobile */}
          <div className="mb-4 sm:mb-12 text-center px-6 pt-6 sm:pt-4">
            <motion.h2 
              key={step}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg sm:text-4xl font-serif italic text-brand-dark leading-tight"
            >
              {step === 'dancer' ? 'Escolha seu Talento' : 
               step === 'quantity' ? 'Quantidade de Números' :
               step === 'roulette' ? 'Sorteio da Sorte' :
               step === 'checkout' ? 'Finalizar Apoio' : 'Sonho Realizado!'}
              <span className="text-brand-orange">.</span>
            </motion.h2>
            <p className="text-[8px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.5em] text-brand-dark/20 font-black mt-2 sm:mt-4 italic">
              {step === 'success' ? 'OBRIGADO PELA SUA GENEROSIDADE' : 'INVESTINDO NO FUTURO DA DANÇA'}
            </p>
          </div>

          <div className="min-h-[400px] sm:min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">
              {step === 'dancer' && (
                <motion.div 
                  key="step-dancer"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex-1 flex flex-col gap-6 sm:gap-12"
                >
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                    {loadingDancers ? (
                      <div className="col-span-full py-20 flex flex-col items-center gap-6">
                        <Loader2 className="w-12 h-12 text-brand-orange animate-spin" />
                        <p className="text-[10px] uppercase tracking-widest font-black text-brand-dark/20">Carregando o Elenco...</p>
                      </div>
                    ) : (
                      dancers.filter(d => d.is_active).map((dancer) => (
                        <button
                          key={dancer.id}
                          onClick={() => setSelectedDancer(dancer)}
                          className={`group relative aspect-[3/4] rounded-[3rem] overflow-hidden transition-all duration-700 border-2 bg-white ${
                            selectedDancer?.id === dancer.id 
                              ? 'border-brand-orange shadow-[0_32px_64px_-16px_rgba(204,0,0,0.4)] scale-[1.05] z-10' 
                              : 'border-brand-orange/10 hover:border-brand-orange/30 shadow-xl'
                          }`}
                        >
                          {/* Full-bleed photo with aggressive zoom to hide black borders */}
                          <div className="absolute inset-0 bg-white overflow-hidden">
                            {dancer.photo_url ? (
                              <img 
                                src={dancer.photo_url} 
                                className="w-full h-full object-cover transition-all duration-1000 scale-[1.8] group-hover:scale-[2.0]" 
                                alt={dancer.name} 
                              />
                            ) : (
                              <div className="w-full h-full bg-brand-orange/5 flex flex-col items-center justify-center">
                                <User className="w-12 h-12 text-brand-orange/10" strokeWidth={1} />
                              </div>
                            )}
                          </div>
                          
                          {/* Permanent Light Overlay for Name - Works on Mobile and Desktop */}
                          <div className={`absolute inset-x-0 bottom-0 p-3 sm:p-4 pt-8 sm:pt-12 bg-gradient-to-t from-white/98 via-white/80 to-transparent transition-all duration-500`}>
                            <p className="text-brand-dark font-serif italic text-xs sm:text-sm leading-tight">{dancer.name}</p>
                            <p className="text-brand-orange text-[6px] sm:text-[7px] uppercase tracking-[0.2em] font-black mt-1">Destaque</p>
                          </div>
                            {selectedDancer?.id === dancer.id && (
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                className="h-1 bg-brand-orange mt-3 sm:mt-4 rounded-full shadow-[0_0_15px_rgba(204,0,0,0.3)]" 
                              />
                            )}

                          {selectedDancer?.id === dancer.id && (
                            <div className="absolute top-4 right-4 w-12 h-12 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                              <Check size={24} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-6 pt-4 border-t border-black/5">
                    <button 
                      onClick={handleNext}
                      disabled={!selectedDancer}
                      className="w-full sm:w-auto px-10 sm:px-20 py-5 sm:py-7 bg-brand-dark text-white rounded-2xl sm:rounded-[2.5rem] text-[10px] sm:text-[12px] uppercase tracking-[0.4em] font-black hover:bg-brand-orange transition-all shadow-xl sm:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] hover:shadow-brand-orange/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                    >
                      CONTINUAR PARA VALORES <ChevronRight size={18} />
                    </button>
                    <button onClick={onClose} className="text-[9px] uppercase tracking-[0.3em] font-black text-brand-dark/20 hover:text-brand-dark transition-all italic">Desistir do Apoio</button>
                  </div>
                </motion.div>
              )}

              {step === 'quantity' && (
                <motion.div 
                  key="step-quantity"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-12"
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-brand-orange/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative w-24 h-24 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-4 sm:border-8 border-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] rotate-3 group-hover:rotate-0 transition-transform duration-700 bg-white">
                      {selectedDancer?.photo_url ? (
                        <img 
                          src={selectedDancer.photo_url} 
                          className="w-full h-full object-cover scale-[1.8] group-hover:scale-[2.0] transition-transform duration-700" 
                          alt="" 
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-orange/5 flex items-center justify-center"><User className="w-8 h-8 sm:w-12 sm:h-12 text-brand-orange/10" /></div>
                      )}
                    </div>
                    <motion.div 
                      animate={{ y: [0, -10, 0], rotate: [12, 5, 12] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute -bottom-4 -right-4 bg-brand-orange text-white p-4 rounded-3xl shadow-2xl z-20"
                    >
                      <Ticket size={24} strokeWidth={2.5} />
                    </motion.div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-3xl font-serif italic text-brand-dark">{selectedDancer?.name}</h3>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-brand-orange font-black mt-3 italic opacity-60">Talento Selecionado</p>
                    
                    {activeCampaign && (
                      <div className="mt-8 pt-6 border-t border-black/5 max-w-xs mx-auto">
                        <p className="text-[8px] uppercase tracking-[0.3em] text-brand-dark/20 font-black mb-2">Ação em Participação</p>
                        <p className="text-sm font-serif italic text-brand-dark/70 leading-tight">{activeCampaign.name}</p>
                        {activeCampaign.description && (
                          <p className="text-[10px] text-brand-dark/40 font-serif italic mt-2 leading-relaxed whitespace-pre-line">
                            {activeCampaign.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full max-w-sm bg-black/[0.02] p-8 sm:p-12 rounded-[3rem] sm:rounded-[4rem] border border-black/5 space-y-6 sm:space-y-10 shadow-inner">
                    <div className="flex items-center justify-between gap-6 sm:gap-10">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-brand-dark hover:bg-brand-dark hover:text-white transition-all text-xl sm:text-4xl font-light border border-black/5 active:scale-90"
                      >
                        -
                      </button>
                      <div className="text-center">
                        <span className="text-5xl sm:text-8xl font-serif italic text-brand-dark tabular-nums tracking-tighter">{quantity}</span>
                        <p className="text-[7px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-brand-dark/30 font-black mt-1 sm:mt-2">NÚMEROS</p>
                      </div>
                      <button 
                        onClick={() => setQuantity(Math.min(
                          activeCampaign?.numbers_per_order || 20, 
                          availableNumbers.length,
                          quantity + 1
                        ))}
                        className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-brand-dark hover:bg-brand-dark hover:text-white transition-all text-xl sm:text-4xl font-light border border-black/5 active:scale-90"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="pt-4 sm:pt-10 border-t border-black/5 flex items-center justify-between px-2 sm:px-4">
                      <span className="text-[8px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.4em] text-brand-dark/40 font-black">Investimento:</span>
                      <span className="text-xl sm:text-3xl font-serif italic text-brand-orange">
                        R$ {activeCampaign ? (activeCampaign.price_per_number * quantity).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full flex flex-col items-center gap-6">
                    <button 
                      onClick={handleNext}
                      className="w-full sm:w-auto px-12 sm:px-20 py-5 sm:py-7 bg-brand-dark text-white rounded-2xl sm:rounded-[2.5rem] text-[10px] sm:text-[12px] uppercase tracking-[0.4em] font-black hover:bg-brand-orange transition-all shadow-xl sm:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] flex items-center justify-center gap-4 active:scale-95 group"
                    >
                      SORTEAR MEUS NÚMEROS <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    <button onClick={handleBack} className="text-[9px] uppercase tracking-[0.3em] font-black text-brand-dark/20 hover:text-brand-dark transition-all italic">Alterar Talentoso</button>
                  </div>
                </motion.div>
              )}

              {step === 'roulette' && (
                <motion.div 
                  key="step-roulette"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="flex-1 flex flex-col items-center gap-6 sm:gap-12"
                >
                  <div className="flex items-center gap-4 sm:gap-6 bg-white shadow-xl sm:shadow-2xl px-6 sm:px-10 py-3 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] border border-black/5">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0 bg-white">
                      {selectedDancer?.photo_url ? (
                        <img 
                          src={selectedDancer.photo_url} 
                          className="w-full h-full object-cover scale-[1.8]" 
                          alt="" 
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-orange/5 flex items-center justify-center"><User className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange/20" /></div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-brand-dark/30 font-black">PROJETO DE APOIO</p>
                      <p className="text-sm sm:text-lg font-serif italic text-brand-dark leading-none mt-0.5 sm:mt-1">{selectedDancer?.name}</p>
                    </div>
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
                    onToggleFix={toggleFixNumber}
                    selectedNumbers={selectedNumbers}
                    hasSpunOnce={hasSpunOnce}
                  />

                  <div className="w-full flex flex-col items-center gap-4 sm:gap-8 pt-4 sm:pt-8">
                    {!hasSpunOnce ? (
                      <button 
                        onClick={() => setIsSpinning(true)}
                        disabled={isSpinning}
                        className="w-full sm:w-auto px-12 sm:px-24 py-6 sm:py-8 bg-brand-orange text-white rounded-2xl sm:rounded-[2.5rem] text-[11px] sm:text-[13px] uppercase tracking-[0.4em] sm:tracking-[0.5em] font-black hover:bg-brand-dark transition-all shadow-xl sm:shadow-[0_32px_64px_-16px_rgba(204,0,0,0.5)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                      >
                        <RotateCw size={18} className={isSpinning ? 'animate-spin' : ''} />
                        {isSpinning ? 'SORTEANDO...' : 'GIRAR SORTE'}
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <button 
                          onClick={() => setIsSpinning(true)}
                          disabled={isSpinning}
                          className="w-full sm:w-auto px-10 sm:px-12 py-5 sm:py-6 bg-white border-2 border-brand-orange/20 text-brand-orange rounded-xl sm:rounded-[2rem] text-[10px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.4em] font-black hover:bg-brand-orange/5 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                          <RotateCw size={14} className={isSpinning ? 'animate-spin' : ''} />
                          SORTEAR RESTANTES
                        </button>
                        <button 
                          onClick={handleNext}
                          disabled={isSpinning}
                          className="w-full sm:w-auto px-10 sm:px-16 py-5 sm:py-6 bg-brand-dark text-white rounded-xl sm:rounded-[2rem] text-[10px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.4em] font-black hover:bg-brand-orange transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                        >
                          CONFIRMAR <Check size={18} />
                        </button>
                      </div>
                    )}
                    <button onClick={handleBack} disabled={isSpinning} className="text-[9px] uppercase tracking-[0.3em] font-black text-brand-dark/20 hover:text-brand-dark transition-all italic">Refazer Escolha</button>
                  </div>
                </motion.div>
              )}

              {step === 'checkout' && (
                <motion.div 
                  key="step-checkout"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-12"
                >
                  {/* Summary Side */}
                  <div className="bg-brand-dark text-white p-4 sm:p-12 rounded-[2rem] sm:rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-1000" />
                    
                    <div className="relative z-10 h-full flex flex-col justify-between gap-12">
                      <div className="space-y-10">
                        <div className="flex items-center gap-3 sm:gap-8">
                          <div className="w-12 h-12 sm:w-24 sm:h-24 rounded-xl sm:rounded-3xl overflow-hidden border-2 sm:border-4 border-white/10 shadow-2xl flex-shrink-0 rotate-3 bg-white">
                            {selectedDancer?.photo_url ? (
                              <img 
                                src={selectedDancer.photo_url} 
                                className="w-full h-full object-cover scale-[1.8]" 
                                alt="" 
                              />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center"><User className="w-6 h-6 sm:w-10 sm:h-10 text-white/10" /></div>
                            )}
                          </div>
                          <div>
                            <p className="text-[7px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/30 font-black">BENEFICIÁRIO</p>
                            <h4 className="text-base sm:text-3xl font-serif italic text-white leading-tight mt-0.5 sm:mt-1">{selectedDancer?.name}</h4>
                            {activeCampaign && (
                              <p className="text-[10px] text-white/40 font-serif italic mt-2 leading-relaxed whitespace-pre-line">
                                {activeCampaign.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 sm:space-y-6">
                          <p className="text-[7px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/30 font-black">NÚMEROS RESERVADOS:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedNumbers.map(n => (
                              <span key={n} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/90">#{String(n).padStart(3, '0')}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 sm:pt-12 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[8px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/30 font-black">TOTAL:</span>
                        <span className="text-2xl sm:text-5xl font-serif italic text-brand-orange tracking-tighter">
                          R$ {activeCampaign ? (activeCampaign.price_per_number * quantity).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col justify-between py-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                         <p className="text-[10px] uppercase tracking-[0.5em] text-brand-dark/30 font-black ml-4">SEUS DADOS <span className="text-brand-orange">*</span></p>
                         <div className="space-y-3">
                            <input 
                              type="text" 
                              required 
                              placeholder="Nome Completo *"
                              value={customerName} 
                              onChange={e => setCustomerName(e.target.value)}
                              className="w-full bg-black/[0.04] border border-transparent p-4 sm:p-7 rounded-xl sm:rounded-[2.5rem] text-sm outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium placeholder:text-brand-dark/20 text-brand-dark"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input 
                                type="tel" 
                                required 
                                placeholder="WhatsApp *"
                                value={customerPhone} 
                                onChange={e => setCustomerPhone(maskPhone(e.target.value))}
                                className="w-full bg-black/[0.04] border border-transparent p-4 sm:p-7 rounded-xl sm:rounded-[2.5rem] text-sm outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium placeholder:text-brand-dark/20 text-brand-dark"
                              />
                              <input 
                                type="email" 
                                required 
                                placeholder="E-mail *"
                                value={customerEmail} 
                                onChange={e => setCustomerEmail(e.target.value)}
                                className="w-full bg-black/[0.04] border border-transparent p-4 sm:p-7 rounded-xl sm:rounded-[2.5rem] text-sm outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium placeholder:text-brand-dark/20 text-brand-dark"
                              />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <label className="text-[9px] uppercase tracking-[0.3em] text-brand-orange font-black block italic opacity-60 ml-4">
                          Forma de Pagamento
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('automatic')}
                            className={`p-5 rounded-2xl border text-left transition-all flex flex-col gap-2 outline-none cursor-pointer ${
                              paymentMethod === 'automatic'
                                ? 'border-brand-orange bg-brand-orange/[0.04] text-brand-dark shadow-md'
                                : 'border-black/5 bg-black/[0.02] text-brand-dark/60 hover:border-black/10'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-black italic">⚡ Pix Automático</span>
                              {paymentMethod === 'automatic' && (
                                <span className="w-3.5 h-3.5 rounded-full bg-brand-orange flex items-center justify-center text-white text-[8px] font-black">✓</span>
                              )}
                            </div>
                            <p className="text-[9px] opacity-70 leading-tight">Gera QR Code exclusivo e confirma na tela na hora, sem precisar de comprovante.</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('manual')}
                            className={`p-5 rounded-2xl border text-left transition-all flex flex-col gap-2 outline-none cursor-pointer ${
                              paymentMethod === 'manual'
                                ? 'border-brand-orange bg-brand-orange/[0.04] text-brand-dark shadow-md'
                                : 'border-black/5 bg-black/[0.02] text-brand-dark/60 hover:border-black/10'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-black italic">🔑 Pix Manual</span>
                              {paymentMethod === 'manual' && (
                                <span className="w-3.5 h-3.5 rounded-full bg-brand-orange flex items-center justify-center text-white text-[8px] font-black">✓</span>
                              )}
                            </div>
                            <p className="text-[9px] opacity-70 leading-tight">Chave Pix tradicional. Exige a transferência e o envio do comprovante via WhatsApp.</p>
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-brand-orange/5 border border-brand-orange/10 rounded-2xl flex gap-4">
                         <div className="w-1 h-auto bg-brand-orange rounded-full shrink-0" />
                         <p className="text-[10px] text-brand-orange font-black italic leading-relaxed uppercase tracking-[0.2em] opacity-70">
                            Ao clicar em confirmar, você será direcionado para os detalhes do pagamento via PIX para oficializar sua ajuda.
                         </p>
                      </div>
                    </div>

                    <div className="pt-10 flex flex-col items-center gap-6">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 sm:py-8 bg-brand-orange text-white rounded-xl sm:rounded-[2.5rem] text-[11px] sm:text-[13px] uppercase tracking-[0.3em] sm:tracking-[0.5em] font-black hover:bg-brand-dark transition-all shadow-xl sm:shadow-[0_32px_64px_-16px_rgba(204,0,0,0.5)] flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" /> : <Check size={20} strokeWidth={3} />}
                        CONFIRMAR E APOIAR
                      </button>
                      <button type="button" onClick={handleBack} className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-dark/20 hover:text-brand-dark transition-all italic">Revisar Números</button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 'infinitepay_checkout' && (
                <motion.div 
                  key="step-infinitepay-checkout"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col gap-6 w-full"
                >
                  {/* Header Compacto com Contagem Regressiva */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/5">
                    <div className="text-left space-y-1">
                      <p className="text-brand-orange text-[9px] uppercase tracking-[0.2em] font-black flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
                        ⚡ PIX AUTOMÁTICO INSTANTÂNEO
                      </p>
                      <h3 className="text-xl sm:text-2xl font-serif italic text-brand-dark">Aguardando Pagamento</h3>
                      <p className="text-[10px] text-brand-dark/50 italic leading-tight">
                        Seus números estão reservados! Finalize o pagamento em até 1 minuto.
                      </p>
                    </div>
                    
                    {/* Timer de Expirar em vermelho piscante */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border border-red-500/10 rounded-full w-full sm:w-auto justify-center">
                      <span className="text-[10px] uppercase tracking-widest font-black text-red-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        Reserva expira em: 00:{String(timeLeft).padStart(2, '0')}s
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso do Timer */}
                  <div className="w-full h-1 bg-black/[0.04] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-brand-orange"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(timeLeft / 60) * 100}%` }}
                      transition={{ duration: 1, ease: 'linear' }}
                    />
                  </div>

                  {/* Split Grid Layout responsivo focado na vertical */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    {/* Coluna 1: Ações de Pagamento e Copia e Cola (PC & Mobile) */}
                    <div className="md:col-span-6 flex flex-col justify-between bg-brand-dark text-white p-6 sm:p-8 rounded-[2rem] space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 bg-white shrink-0">
                            {selectedDancer?.photo_url ? (
                              <img src={selectedDancer.photo_url} className="w-full h-full object-cover scale-[1.8]" alt="" />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center"><User className="w-5 h-5 text-white/10" /></div>
                            )}
                          </div>
                          <div>
                            <p className="text-brand-orange text-[7px] uppercase tracking-[0.2em] font-black">APOIO DIRECIONADO</p>
                            <h4 className="text-sm font-serif italic text-white/95">{selectedDancer?.name}</h4>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/10">
                          <p className="text-[8px] uppercase tracking-widest text-white/30 font-black mb-1">CAMPANHA</p>
                          <p className="text-xs text-white/80 font-serif italic">{activeCampaign.name}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[8px] uppercase tracking-widest text-white/30 font-black">SEUS NÚMEROS DA SORTE:</p>
                          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
                            {selectedNumbers.sort((a, b) => a - b).map(n => (
                              <span key={n} className="px-2 py-0.5 bg-white/15 border border-white/5 rounded text-[10px] font-bold text-white/95">#{String(n).padStart(3, '0')}</span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                          <span className="text-[8px] uppercase tracking-widest text-white/30 font-black">TOTAL A PAGAR:</span>
                          <span className="text-2xl font-serif italic text-brand-orange">R$ {activeCampaign ? (selectedNumbers.length * activeCampaign.price_per_number).toFixed(2) : '0.00'}</span>
                        </div>
                      </div>

                      {/* Botões Copia e Cola & Pagar no Banco */}
                      <div className="space-y-3 pt-4 border-t border-white/10">
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(infinitePayUrl);
                            setCopied(true);
                            showToast('Link de pagamento copiado com sucesso! Abra o app do seu banco para pagar.', 'success');
                            setTimeout(() => setCopied(false), 3000);
                          }}
                          className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer active:scale-95"
                        >
                          {copied ? <><Check size={14} /> COPIADO COM SUCESSO!</> : <><Copy size={14} /> COPIAR LINK DE PAGAMENTO</>}
                        </button>

                        <a 
                          href={infinitePayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-4 bg-brand-orange hover:bg-brand-orange/95 text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-orange/20 active:scale-95 text-center"
                        >
                          ⚡ ABRIR PAGAMENTO NO BANCO
                        </a>
                        
                        <p className="text-[8px] text-white/40 text-center italic leading-tight">
                          * Use o botão copiar para colar o link no seu navegador ou enviar ao celular.
                        </p>
                      </div>
                    </div>

                    {/* Coluna 2: Status do Realtime e Orientações */}
                    <div className="md:col-span-6 bg-black/[0.02] border border-black/5 p-6 sm:p-8 rounded-[2rem] flex flex-col justify-between space-y-6 text-left">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                          <Loader2 size={16} className="text-brand-orange animate-spin" />
                          <span className="text-xs font-black uppercase tracking-wider text-brand-dark">Confirmando em Tempo Real...</span>
                        </div>
                        <p className="text-[10px] text-brand-dark/60 leading-relaxed font-medium">
                          Assim que você concluir a transferência Pix no app do seu banco, nosso system receberá a notificação da InfinitePay e esta tela mudará sozinha na mesma hora.
                        </p>
                      </div>

                      <div className="p-4 bg-green-500/[0.04] border border-green-500/10 rounded-2xl text-[9px] text-green-700 leading-normal space-y-1">
                        <p className="font-bold flex items-center gap-1">✓ Sem envio de comprovante</p>
                        <p>O Pix é identificado automaticamente. Não precisa falar no WhatsApp nem tirar print do recibo.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          showToast('Redirecionando para o Pix manual.', 'info');
                          setStep('success');
                          setPaymentMethod('manual');
                        }}
                        className="w-full text-center text-brand-dark/40 hover:text-brand-orange transition-colors text-[9px] font-black uppercase tracking-widest italic cursor-pointer outline-none"
                      >
                        Desejo pagar via Pix manual tradicional
                      </button>
                    </div>
                  </div>

                  {/* Seção 3: Visualizador Iframe Integrado para PC/Tablet */}
                  <div className="w-full flex flex-col gap-2 pt-2 border-t border-black/5">
                    <div className="flex items-center justify-between text-[10px] text-brand-dark/40 px-1 font-bold">
                      <span>SE PREFERIR, PAGUE DIRETAMENTE ABAIXO:</span>
                      <span>(InfinitePay Checkout Seguro)</span>
                    </div>
                    
                    <div className="w-full h-[360px] sm:h-[450px] rounded-2xl overflow-hidden border border-black/10 shadow-inner relative bg-[#F5F5F5] flex items-center justify-center">
                      {iframeLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F5F5F5] z-10">
                          <Loader2 size={36} className="text-brand-orange animate-spin" />
                          <p className="text-xs font-black uppercase tracking-widest text-brand-dark/40">Carregando painel de pagamento...</p>
                        </div>
                      )}
                      <iframe
                        src={infinitePayUrl}
                        className="w-full h-full border-0 rounded-2xl"
                        title="InfinitePay Checkout"
                        allow="clipboard-write"
                        onLoad={() => setIframeLoading(false)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div 
                  key="step-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-4"
                >
                  <div className="relative">
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 12 }}
                      transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.2 }}
                      className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)]"
                    >
                      <Check size={36} strokeWidth={4} />
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="absolute -bottom-3 -right-3 w-14 h-14 rounded-[1.5rem] border-4 border-white overflow-hidden shadow-2xl -rotate-12"
                    >
                      {selectedDancer?.photo_url ? (
                        <img src={selectedDancer.photo_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full bg-brand-dark/5 flex items-center justify-center"><User className="w-10 h-10 text-brand-dark/10" /></div>
                      )}
                    </motion.div>
                  </div>

                  {isConfirmedAutomatic ? (
                    // Layout Premium para confirmação automática instantânea (WOW factor!)
                    <div className="space-y-6 max-w-lg">
                      <div className="space-y-2">
                        <h3 className="text-2xl sm:text-3xl font-serif italic text-brand-dark leading-tight">Apoio Confirmado via Pix!</h3>
                        <p className="text-xs text-brand-dark/50 max-w-md mx-auto leading-relaxed italic">
                          Seu pagamento foi compensado de forma instantânea em nosso sistema. Seu apoio a <span className="text-brand-dark font-black underline decoration-brand-orange/40 decoration-2 underline-offset-4">{selectedDancer?.name}</span> é oficial!
                        </p>
                      </div>

                      <div className="w-full max-w-md mx-auto bg-white p-6 rounded-[2rem] border border-black/5 shadow-xl space-y-6">
                        <div className="text-center bg-green-500/5 border border-green-500/10 p-4 rounded-[1.5rem] space-y-1">
                          <span className="text-[9px] uppercase tracking-[0.2em] font-black text-green-600 block">⚡ STATUS DA TRANSAÇÃO</span>
                          <strong className="text-xs font-black text-green-700 italic block">PAGO & APOIADO</strong>
                        </div>

                        <div className="bg-brand-dark text-white p-5 rounded-[2rem] text-left space-y-3">
                          <p className="text-[8px] uppercase tracking-widest text-white/30 font-black">NÚMEROS OFICIAIS ADQUIRIDOS:</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {selectedNumbers.sort((a, b) => a - b).map(n => (
                              <span key={n} className="px-2.5 py-0.5 bg-white/15 border border-white/10 rounded text-[10px] font-bold text-white">#{String(n).padStart(3, '0')}</span>
                            ))}
                          </div>
                          <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[10px]">
                            <span className="text-white/40 font-bold">VALOR DOADO:</span>
                            <span className="font-serif italic text-brand-orange text-sm">R$ {activeCampaign ? (selectedNumbers.length * activeCampaign.price_per_number).toFixed(2) : '0.00'}</span>
                          </div>
                        </div>

                        <div className="text-left space-y-1.5 p-4 bg-black/[0.02] rounded-xl text-[9px] text-brand-dark/60 leading-relaxed">
                          <p className="font-bold text-brand-dark">💡 O que acontece agora?</p>
                          <p>✓ Não é necessário enviar nenhum comprovante por WhatsApp.</p>
                          <p>✓ Seus números foram permanentemente ocupados em nosso painel.</p>
                          <p>✓ Um e-mail formal de confirmação de pagamento contendo seus números já foi disparado para a sua caixa de entrada.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Layout Tradicional para Pix manual
                    <>
                      <div className="space-y-3">
                        <h3 className="text-2xl sm:text-3xl font-serif italic text-brand-dark leading-tight">Pedido Recebido!</h3>
                        <p className="text-xs text-brand-dark/50 max-w-sm mx-auto leading-relaxed italic">
                          Sua reserva para apoiar <span className="text-brand-dark font-black underline decoration-brand-orange/40 decoration-2 underline-offset-4">{selectedDancer?.name}</span> foi processada. Agora falta pouco!
                        </p>
                      </div>

                      <div className="w-full max-w-sm bg-white p-6 rounded-[2rem] border border-black/5 shadow-xl space-y-6">
                        <div className="space-y-4">
                          <p className="text-[9px] uppercase tracking-[0.4em] text-brand-dark/30 font-black">CHAVE PIX ({settings?.pix_checkout_type?.value || 'E-mail'})</p>
                          <div className="relative group">
                            <div className="bg-black/[0.04] p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-transparent hover:border-brand-orange/30 transition-all shadow-inner">
                              <p className="font-mono text-xs sm:text-sm text-brand-dark break-all font-black tracking-tight">
                                {settings?.pix_key_checkout?.value || settings?.pix_key?.value || 'ballettatianafigueiredo@gmail.com'}
                              </p>
                            </div>
                            <button 
                              onClick={() => {
                                const key = settings?.pix_key_checkout?.value || settings?.pix_key?.value || 'ballettatianafigueiredo@gmail.com';
                                navigator.clipboard.writeText(key);
                                setCopied(true);
                                showToast('Chave PIX copiada!', 'success');
                                setTimeout(() => setCopied(false), 3000);
                              }}
                              className="mt-3 w-full py-3 bg-brand-orange/10 text-brand-orange text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-brand-orange hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                              {copied ? <><Check size={12} /> COPIADO!</> : <><Copy size={12} /> COPIAR CHAVE PIX</>}
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 text-left border-t border-black/5 pt-8">
                          <div>
                            <p className="text-[8px] uppercase tracking-[0.3em] text-brand-dark/30 font-black mb-1">BANCO</p>
                            <p className="text-sm font-black text-brand-dark tracking-tight">{settings?.pix_checkout_bank?.value || 'SICOOB'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] uppercase tracking-[0.3em] text-brand-dark/30 font-black mb-1">RECEBEDOR</p>
                            <p className="text-sm font-black text-brand-dark tracking-tight">{settings?.pix_checkout_receiver?.value || 'Tatiana Aparecida Figueiredo'}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            const whatsapp = settings['contact_whatsapp']?.value || '31992127292';
                            const msg = encodeURIComponent(`Olá! Fiz minha participação na rifa para apoiar ${selectedDancer?.name} e quero enviar o comprovante.`);
                            window.open(`https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${msg}`);
                          }}
                          className="w-full py-5 bg-[#25D366] text-white rounded-[1.5rem] text-[11px] uppercase tracking-[0.3em] font-black hover:shadow-[0_15px_30px_-5px_rgba(37,211,102,0.4)] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                        >
                          <Smartphone size={18} />
                          ENVIAR COMPROVANTE AGORA
                        </button>
                      </div>
                    </>
                  )}

                  <button 
                    onClick={onClose}
                    className="px-10 py-4 text-[9px] uppercase tracking-[0.4em] font-black text-brand-dark/20 hover:text-brand-dark transition-all italic"
                  >
                    CONCLUIR E FECHAR
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
