import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, ArrowRight, Loader2, CheckCircle, Copy, RotateCw, Check, Smartphone, ChevronRight, ChevronDown, ArrowLeft, AlertTriangle } from 'lucide-react';
import { RaffleCampaign, useRaffles } from '../../hooks/useRaffles';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { supabase } from '../../lib/supabase';
import { Toast } from '../ui/Toast';
import { LuckyRoulette } from '../ui/LuckyRoulette';

function cleanString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/gi, '')
    .toUpperCase();
}

function generatePixPayload(key: string, amount: number, name: string, city: string = 'BELO HORIZONTE'): string {
  const parts = {
    payloadIndicator: '000201',
    merchantAccount: '',
    merchantCategory: '52040000',
    currency: '5303986',
    amount: '',
    country: '5802BR',
    name: '',
    city: '',
    additionalData: '62070503***',
  };

  const cleanKey = key.trim();
  const merchantAccountSub = '0014br.gov.bcb.pix' + '01' + String(cleanKey.length).padStart(2, '0') + cleanKey;
  parts.merchantAccount = '26' + String(merchantAccountSub.length).padStart(2, '0') + merchantAccountSub;

  const amountStr = Number(amount).toFixed(2);
  parts.amount = '54' + String(amountStr.length).padStart(2, '0') + amountStr;

  const cleanName = cleanString(name).substring(0, 25);
  parts.name = '59' + String(cleanName.length).padStart(2, '0') + cleanName;

  const cleanCity = cleanString(city).substring(0, 15);
  parts.city = '60' + String(cleanCity.length).padStart(2, '0') + cleanCity;

  const payloadBase = 
    parts.payloadIndicator +
    parts.merchantAccount +
    parts.merchantCategory +
    parts.currency +
    parts.amount +
    parts.country +
    parts.name +
    parts.city +
    parts.additionalData +
    '6304';

  let crc = 0xFFFF;
  for (let c = 0; c < payloadBase.length; c++) {
    crc ^= payloadBase.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return payloadBase + crcHex;
}

interface RaffleCheckoutModalProps {
  campaign: RaffleCampaign;
  onClose: () => void;
}

type Step = 'quantity' | 'roulette' | 'checkout' | 'infinitepay_checkout' | 'success';

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
  
  // Estados para integração com InfinitePay
  const [infinitePayUrl, setInfinitePayUrl] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'automatic' | 'manual'>('automatic');
  const [isConfirmedAutomatic, setIsConfirmedAutomatic] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    if (step === 'checkout') {
      setShowScrollIndicator(true);
    }
  }, [step]);

  const pixKey = settings?.infinitepay_pix_key?.value || '';
  const pixReceiver = settings?.infinitepay_receiver?.value || 'NUCLEO DE DANCA TATIANA FIGUEIREDO';
  const pixType = settings?.pix_checkout_type?.value || 'CNPJ';
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

  // Escutar a confirmação do pagamento via Pix automático em tempo real
  useEffect(() => {
    if (step !== 'infinitepay_checkout' || !orderId) return;

    console.log(`[Realtime] Subscrevendo ao status do pedido ${orderId}`);
    
    const channel = supabase
      .channel(`order_payment_status:${orderId}`)
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

  // Timer de 5 minutos com cancelamento automático de ordens expiradas no Supabase
  useEffect(() => {
    if (step !== 'infinitepay_checkout' || !orderId) return;

    if (timeLeft <= 0) {
      const cancelExpiredOrder = async () => {
        try {
          console.log(`[Timer] Tempo esgotado para o pedido ${orderId}. Cancelando no banco...`);
          // Cancela o pedido no banco de dados para liberar os números de forma instantânea
          await supabase
            .from('raffle_orders')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', orderId);

          showToast('Tempo limite de 5 minutos excedido. Seus números foram liberados.', 'danger');
          
          // Reseta o passo de volta para a roleta
          setStep('roulette');
          setHasSpunOnce(false);
          setSelectedNumbers([]);
          setTimeLeft(300); // Reseta o timer
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
      setOrderId(newOrderId);
      
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
        
        const calculatedTotalPrice = selectedNumbers.length * campaign.price_per_number;

        if (paymentMethod === 'automatic') {
          console.log('[InfinitePay] Criando cobrança via Edge Function...');
          setIsGeneratingPayment(true);
          try {
            const { data: ipData, error: ipError } = await supabase.functions.invoke('create-infinitepay-payment', {
              body: {
                order_id: newOrderId,
                total_price: calculatedTotalPrice,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                campaign_name: campaign.name,
                redirect_url: window.location.href
              }
            });

            if (ipError || !ipData?.url) {
              console.error('[InfinitePay] Erro ao criar link de pagamento:', ipError || ipData);
              showToast('Não foi possível gerar o link de pagamento. Tente novamente.', 'danger');
              setSubmitting(false);
              setIsGeneratingPayment(false);
              return;
            }

            setInfinitePayUrl(ipData.url);
            setTimeLeft(300);
            setStep('infinitepay_checkout');

            // Abre a página da InfinitePay em nova aba automaticamente
            window.open(ipData.url, '_blank', 'noopener,noreferrer');

            // Notificação de reserva em background
            supabase.functions.invoke('send-order', {
              body: {
                ...orderData,
                order_id: newOrderId,
                type: 'raffle_order',
                campaign_name: campaign.name,
                items: [{ 
                  name: `Rifa: ${campaign.name}`, 
                  price: calculatedTotalPrice,
                  description: `Números: ${selectedNumbers.join(', ')}`
                }],
                payment_url: ipData.url,
                contact_whatsapp: settings?.contact_whatsapp?.value
              }
            }).catch(e => console.error('Background send-order error:', e));

          } catch (payException) {
            console.error('[InfinitePay] Exceção ao gerar pagamento:', payException);
            showToast('Erro inesperado ao gerar pagamento. Por favor, tente novamente.', 'danger');
          } finally {
            setIsGeneratingPayment(false);
          }
        } else {
          // Pagamento Pix manual
          setStep('success');
          supabase.functions.invoke('send-order', {
            body: {
              ...orderData,
              order_id: newOrderId,
              type: 'raffle_order',
              campaign_name: campaign.name,
              items: [{ 
                name: `Rifa: ${campaign.name}`, 
                price: calculatedTotalPrice,
                description: `Números: ${selectedNumbers.join(', ')}`
              }],
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
        className={`modal-container relative z-10 transition-all duration-500 ${
          (step === 'checkout' || step === 'infinitepay_checkout') ? 'sm:!max-w-4xl' : ''
        }`}
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

        {/* Close Button - Styled for consistency */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50 p-3 bg-white/80 hover:bg-white rounded-full text-brand-dark/40 hover:text-brand-orange transition-all shadow-lg border border-black/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div 
          className="modal-content p-4 sm:p-6"
          onScroll={(e) => {
            if (e.currentTarget.scrollTop > 20) {
              setShowScrollIndicator(false);
            }
          }}
        >
          <AnimatePresence mode="wait">
            {step === 'quantity' && (
              <motion.div 
                key="step-qty"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center gap-4 py-2"
              >
                <div className="text-center space-y-1">
                  <p className="text-brand-orange text-[9px] uppercase tracking-[0.3em] font-black">ETAPA 1 DE 3</p>
                  <h2 className="text-2xl sm:text-3xl font-sans font-black text-brand-dark tracking-tight">{campaign.name}</h2>
                  <p className="text-xs text-brand-dark/50 font-sans">Quantos números da sorte você deseja?</p>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 bg-black/[0.02] p-4 sm:p-6 rounded-2xl border border-black/5">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl font-light hover:bg-brand-dark hover:text-white transition-all active:scale-90"
                  >
                    -
                  </button>
                  <div className="text-center min-w-[100px]">
                    <span className="text-5xl sm:text-6xl font-sans font-black text-brand-dark">{quantity}</span>
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
                    className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white rounded-xl text-[10px] uppercase tracking-[0.2em] font-black hover:bg-brand-orange transition-all shadow-md flex items-center justify-center gap-2 group"
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
                className="flex flex-col items-center gap-4 py-2"
              >
                <div className="text-center space-y-1">
                  <p className="text-brand-orange text-[9px] uppercase tracking-[0.3em] font-black">ETAPA 2 DE 3</p>
                  <h2 className="text-2xl font-sans font-black text-brand-dark">Sorteio da Sorte</h2>
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
                      className="w-full sm:w-auto px-10 py-3.5 bg-brand-orange text-white rounded-xl text-[11px] uppercase tracking-[0.2em] font-black hover:bg-brand-dark transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <RotateCw size={18} className={isSpinning ? 'animate-spin' : ''} />
                      {isSpinning ? 'SORTEANDO...' : 'GIRAR SORTE'}
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <button
                        onClick={() => setStep('quantity')}
                        className="px-6 py-2.5 border-2 border-brand-orange text-brand-orange rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-brand-orange/5 transition-all flex items-center gap-2"
                      >
                        <ArrowLeft size={14} /> VOLTAR
                      </button>
                      <button
                        onClick={() => {
                          setStep('checkout');
                        }}
                        className="px-8 py-2.5 bg-brand-dark text-white rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-brand-orange transition-all shadow-md flex items-center gap-2"
                      >
                        CONFIRMAR NÚMEROS <Check size={14} />
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
                className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
              >
                <div className="bg-brand-dark text-white p-6 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <p className="text-brand-orange text-[9px] uppercase tracking-[0.4em] font-black">RESUMO DO PEDIDO</p>
                    <h3 className="text-xl font-sans font-black">{campaign.name}</h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">NÚMEROS SORTEADOS:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedNumbers.map(n => (
                        <span key={n} className="px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white/90">#{String(n).padStart(3, '0')}</span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-black">TOTAL:</span>
                    <span className="text-2xl font-sans font-black text-brand-orange">R$ {(selectedNumbers.length * campaign.price_per_number).toFixed(2)}</span>
                  </div>

                  {/* Indicador de Scroll no Mobile com desvanecimento suave */}
                  <AnimatePresence>
                    {showScrollIndicator && (
                      <motion.div 
                        className="sm:hidden flex flex-col items-center gap-1 mt-4 text-brand-orange/80"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: [0, 5, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                          opacity: { duration: 0.3 },
                          y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                        }}
                      >
                        <span className="text-[8px] uppercase tracking-widest font-black opacity-80">Preencha seus dados abaixo</span>
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <form onSubmit={handleOrder} className="space-y-4 py-1">
                  <div className="space-y-3">
                    <input 
                      type="text" required placeholder="Seu Nome Completo"
                      value={customerName} onChange={e => setCustomerName(e.target.value)}
                      className="w-full p-4 bg-black/[0.04] border border-transparent rounded-xl outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium text-sm"
                    />
                    <input 
                      type="email" required placeholder="E-mail para contato"
                      value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full p-4 bg-black/[0.04] border border-transparent rounded-xl outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium text-sm"
                    />
                    <input 
                      type="tel" required placeholder="WhatsApp (00) 00000-0000"
                      value={customerPhone} onChange={e => setCustomerPhone(maskPhone(e.target.value))}
                      className="w-full p-4 bg-black/[0.04] border border-transparent rounded-xl outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium text-sm"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-brand-dark/30 font-black">FORMA DE PAGAMENTO</p>
                    <div className="p-3 rounded-xl border border-brand-orange bg-brand-orange/[0.02] text-brand-dark flex flex-col gap-1">
                      <span className="text-[11px] font-black italic text-brand-orange">⚡ Pix Automático Instantâneo</span>
                      <p className="text-[9px] opacity-70 leading-tight">Gera QR Code exclusivo e confirma na tela na hora, sem precisar de comprovante.</p>
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <button 
                      type="submit" disabled={submitting}
                      className="w-full py-4 bg-brand-orange text-white rounded-xl text-[11px] uppercase tracking-[0.2em] font-black hover:bg-brand-dark transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check size={16} strokeWidth={3} /> FINALIZAR E APOIAR</>}
                    </button>
                    <button type="button" onClick={handleBack} className="w-full text-[9px] uppercase tracking-widest font-black text-brand-dark/20 hover:text-brand-dark italic">Revisar Sorteio</button>
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
                {/* Header com Contagem Regressiva */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/5">
                  <div className="text-left space-y-1">
                    <p className="text-brand-orange text-[9px] uppercase tracking-[0.2em] font-black flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
                      ⚡ PIX VIA INFINITEPAY
                    </p>
                    <h3 className="text-lg sm:text-xl font-sans font-black text-brand-dark">Aguardando Pagamento</h3>
                    <p className="text-[9px] text-brand-dark/50 font-sans leading-tight">
                      A página de pagamento InfinitePay foi aberta em uma nova aba. Finalize o Pix por lá.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border border-red-500/10 rounded-full w-full sm:w-auto justify-center">
                    <span className="text-[10px] uppercase tracking-widest font-black text-red-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      Expira em: {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-black/[0.04] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-brand-orange"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / 300) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>

                {/* Resumo do Pedido */}
                <div className="bg-brand-dark text-white p-5 rounded-xl space-y-4">
                  <div className="space-y-2">
                    <p className="text-[8px] uppercase tracking-widest text-white/30 font-black">SEUS NÚMEROS DA SORTE:</p>
                    <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto pr-1">
                      {selectedNumbers.sort((a, b) => a - b).map(n => (
                        <span key={n} className="px-2 py-0.5 bg-white/15 border border-white/5 rounded text-[9px] font-bold text-white/95">#{String(n).padStart(3, '0')}</span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-black">TOTAL:</span>
                    <span className="text-2xl font-sans font-black text-brand-orange">R$ {(selectedNumbers.length * campaign.price_per_number).toFixed(2)}</span>
                  </div>
                </div>

                {/* Status e Ações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Botão re-abrir InfinitePay */}
                  <a
                    href={infinitePayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 bg-brand-orange text-white rounded-xl text-[11px] uppercase tracking-widest font-black hover:bg-brand-dark transition-all shadow-lg active:scale-95"
                  >
                    <ArrowRight size={14} />
                    ABRIR PÁGINA DE PAGAMENTO
                  </a>

                  {/* Status Realtime */}
                  <div className="flex items-center gap-3 p-4 bg-black/[0.03] border border-black/5 rounded-xl">
                    <Loader2 size={18} className="text-brand-orange animate-spin shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-brand-dark">Aguardando confirmação...</p>
                      <p className="text-[9px] text-brand-dark/50 leading-tight mt-0.5">
                        Esta tela muda automaticamente assim que o pagamento for confirmado pela InfinitePay.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instruções */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 text-left">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-brand-dark">Como pagar:</p>
                    <p className="text-[9px] text-brand-dark/60 leading-relaxed">
                      1. Clique em <strong>"ABRIR PÁGINA DE PAGAMENTO"</strong> acima (ou use a aba já aberta).<br/>
                      2. Na página da InfinitePay, escolha <strong>Pix</strong> e copie o código ou escaneie o QR Code.<br/>
                      3. Pague no app do seu banco. A confirmação aparece aqui automaticamente.
                    </p>
                  </div>
                </div>
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

                {isConfirmedAutomatic ? (
                  // Layout Premium para confirmação automática instantânea (WOW factor!)
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-1">
                      <h3 className="text-2xl sm:text-3xl font-sans font-black text-brand-dark">Apoio Confirmado via Pix!</h3>
                      <p className="text-xs text-brand-dark/50 max-w-md mx-auto">
                        Seu pagamento foi compensado de forma instantânea em nosso sistema. Sua participação é oficial!
                      </p>
                    </div>

                    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-2xl border border-black/5 shadow-xl space-y-4">
                      <div className="text-center bg-green-500/5 border border-green-500/10 p-5 rounded-[2rem] space-y-2">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-black text-green-600 block">⚡ STATUS DA TRANSAÇÃO</span>
                        <strong className="text-sm font-black text-green-700 italic block">PAGO & PARTICIPADO</strong>
                      </div>

                      <div className="bg-brand-dark text-white p-4 rounded-xl text-left space-y-3">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 font-black">NÚMEROS OFICIAIS ADQUIRIDOS:</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedNumbers.sort((a, b) => a - b).map(n => (
                            <span key={n} className="px-2 py-0.5 bg-white/15 border border-white/10 rounded text-[10px] font-bold text-white">#{String(n).padStart(3, '0')}</span>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                          <span className="text-white/40 font-bold">VALOR DOADO:</span>
                          <span className="font-sans font-black text-brand-orange text-base">R$ {(selectedNumbers.length * campaign.price_per_number).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="text-left space-y-2 p-4 bg-black/[0.02] rounded-2xl text-[10px] text-brand-dark/60 leading-relaxed">
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
                    <div className="space-y-2">
                      <h3 className="text-2xl font-sans font-black text-brand-dark">Pedido de Rifa Recebido!</h3>
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
                          <p className="text-xs font-black text-brand-dark">InfinitePay</p>
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
                  </>
                )}

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
