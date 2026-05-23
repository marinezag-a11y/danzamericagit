import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, ArrowRight, Loader2, CheckCircle, Copy, RotateCw, Check, Smartphone, ChevronRight, ChevronDown, ArrowLeft, AlertTriangle, Lock, ShieldCheck } from 'lucide-react';
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
  
  // Estados para integração com Mercado Pago
  const [mpPaymentData, setMpPaymentData] = useState<{qr_code?: string, qr_code_base64?: string, ticket_url?: string, payment_id?: string} | null>(null);
  const [pixCode, setPixCode] = useState('');
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'automatic' | 'manual'>('automatic');
  const [isConfirmedAutomatic, setIsConfirmedAutomatic] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300);
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
  }, [isOpen, step, mpPaymentData]);

  useEffect(() => {
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

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
  // Supabase Realtime (WebSocket/Push) - notificação imediata do backend ao frontend
  useEffect(() => {
    if (step !== 'infinitepay_checkout' || !orderId) return;

    console.log(`[Realtime] Subscrevendo ao status do pedido ${orderId}`);
    
    const channel = supabase
      .channel(`order_payment_status:${orderId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: orderId }
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'raffle_orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        console.log('[Realtime] Payload de atualização do pedido:', payload);
        if (payload.new && payload.new.status === 'paid') {
          console.log('[Realtime] Pagamento confirmado via Push/WebSocket! Avançando para a tela de sucesso.');
          setIsConfirmedAutomatic(true);
          showToast('Pagamento confirmado via Pix com sucesso!', 'success');
          setStep('success');
        }
      })
      .subscribe((status) => {
        console.log(`[Realtime] Status da conexão WebSocket: ${status}`);
      });

    return () => {
      console.log(`[Realtime] Removendo subscrição do pedido ${orderId}`);
      supabase.removeChannel(channel);
    };
  }, [step, orderId]);

  // Polling de segurança: banco a cada 1s (leve), API do MP a cada 5s (pesado)
  useEffect(() => {
    if (step !== 'infinitepay_checkout' || !orderId) return;

    let alreadyConfirmed = false;

    const handleConfirmed = () => {
      if (alreadyConfirmed) return;
      alreadyConfirmed = true;
      setIsConfirmedAutomatic(true);
      showToast('Pagamento confirmado via Pix com sucesso!', 'success');
      setStep('success');
    };

    // Polling rápido no banco de dados (1 segundo) - leve
    const checkPaymentStatus = async () => {
      if (alreadyConfirmed) return;
      try {
        const { data } = await supabase
          .from('raffle_orders')
          .select('status')
          .eq('id', orderId)
          .maybeSingle();

        if (data?.status === 'paid') {
          console.log('[Polling 1s] Banco confirmou PAID! Atualizando frontend.');
          handleConfirmed();
        }
      } catch (err) {
        // silencioso
      }
    };

    // Polling direto na API do MP (2 segundos) - mais pesado, só como último recurso
    const pollMercadoPagoAPI = async () => {
      if (alreadyConfirmed || !mpPaymentData?.payment_id) return;
      try {
        const { data, error } = await supabase.functions.invoke('check-mercado-pago-payment', {
          body: { payment_id: mpPaymentData.payment_id, order_id: orderId }
        });
        
        if (error) {
          console.error('[Active Polling MP] Erro da Edge Function:', error);
          showToast(`Erro de comunicação: ${error.message || 'tente novamente'}`, 'warning');
          return;
        }

        if (data?.status === 'approved') {
          console.log('[Active Polling MP] API do Mercado Pago retornou APPROVED!');
          handleConfirmed();
        }
      } catch (err: any) {
        console.error('[Active Polling MP] Exceção:', err);
        showToast(`Erro na consulta: ${err.message}`, 'warning');
      }
    };

    // Inicia imediatamente e depois a cada 1 segundo
    checkPaymentStatus();
    pollMercadoPagoAPI();
    
    const fastInterval = setInterval(checkPaymentStatus, 1000); // 1s - banco de dados
    const slowInterval = setInterval(pollMercadoPagoAPI, 2000);  // 2s - API Mercado Pago (recomendado pelo suporte MP)


    return () => {
      clearInterval(fastInterval);
      clearInterval(slowInterval);
    };
  }, [step, orderId, mpPaymentData?.payment_id]);

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
            .update({ status: 'unconfirmed', updated_at: new Date().toISOString() })
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

      // Nova reserva por 15 minutos
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

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
          console.log('[MercadoPago] Criando cobrança via Edge Function...');
          setIsGeneratingPayment(true);
          try {
            const { data: mpData, error: mpError } = await supabase.functions.invoke('create-mercado-pago-payment', {
              body: {
                order_id: newOrderId,
                total_price: calculatedTotalPrice,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                campaign_name: campaign.name
              }
            });

            if (mpError || !mpData?.payment_id) {
              console.error('[MercadoPago] Erro ao criar PIX:', mpError || mpData);
              showToast('Não foi possível gerar o código Pix. Tente novamente.', 'danger');
              setSubmitting(false);
              setIsGeneratingPayment(false);
              return;
            }

            setMpPaymentData({
              qr_code: mpData.qr_code,
              qr_code_base64: mpData.qr_code_base64,
              ticket_url: mpData.ticket_url,
              payment_id: mpData.payment_id
            });
            setTimeLeft(900);
            setStep('infinitepay_checkout');

          } catch (payException) {
            console.error('[MercadoPago] Exceção ao gerar pagamento:', payException);
            showToast('Erro inesperado ao gerar pagamento. Por favor, tente novamente.', 'danger');
          } finally {
            setIsGeneratingPayment(false);
          }
        } else {
          // Pagamento Pix manual
          setStep('success');
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
    <div 
      ref={scrollContainerRef}
      onScroll={checkScrollability}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
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
          {/* TARJA DE MODO TESTE — visível para o cliente */}
          {campaign.is_test_mode && (
            <div className="flex items-center gap-3 mb-4 p-4 bg-yellow-400 rounded-2xl shadow-lg border-2 border-yellow-500">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-yellow-900">
                  Sistema em Testes — Compras não serão validadas
                </p>
                <p className="text-[10px] text-yellow-800 font-medium mt-0.5">
                  Esta campanha está temporariamente em modo de teste. Não efetue pagamentos reais.
                </p>
              </div>
            </div>
          )}

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
                      ⚡ PIX AUTOMÁTICO MERCADO PAGO
                    </p>
                    <h3 className="text-lg sm:text-xl font-sans font-black text-brand-dark">Pagamento via Pix</h3>
                    <p className="text-[10px] text-brand-dark/50 font-sans leading-tight">
                      Escaneie o QR Code ou copie o código abaixo para pagar no aplicativo do seu banco. A confirmação é automática!
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
                <div className="w-full h-1 bg-black/[0.04] rounded-full overflow-hidden mb-2">
                  <motion.div 
                    className="h-full bg-brand-orange"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / 900) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>

                {/* PROMINENT WAITING BANNER */}
                <div className="flex items-center gap-4 p-5 sm:p-6 bg-brand-orange/10 border-2 border-brand-orange/50 rounded-2xl shadow-lg animate-pulse">
                  <Loader2 size={32} className="text-brand-orange animate-spin shrink-0" />
                  <div className="text-left">
                    <p className="text-sm sm:text-base font-black uppercase tracking-wider text-brand-dark">
                      Aguardando confirmação do pagamento...
                    </p>
                    <p className="text-xs sm:text-sm text-brand-dark/70 mt-1 font-medium leading-tight">
                      Deixe esta tela aberta. Ela atualizará automaticamente na mesma hora em que você pagar o Pix no seu banco!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
                  {/* QR Code and Copy Paste */}
                  <div className="bg-black/[0.02] border border-black/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                    {mpPaymentData?.qr_code_base64 ? (
                      <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm border border-black/5">
                        <img src={`data:image/jpeg;base64,${mpPaymentData.qr_code_base64}`} alt="QR Code Pix" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm border border-black/5 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
                      </div>
                    )}
                    
                    {mpPaymentData?.qr_code && (
                      <div className="w-full space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-brand-dark">Pix Copia e Cola:</p>
                        <div className="flex items-center gap-2 w-full">
                          <input 
                            type="text" 
                            value={mpPaymentData.qr_code} 
                            readOnly 
                            className="flex-1 bg-white border border-black/10 rounded-lg p-3 text-xs text-brand-dark/70 font-mono outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(mpPaymentData.qr_code!);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="bg-brand-dark hover:bg-brand-orange text-white p-3 rounded-lg transition-colors flex-shrink-0"
                          >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                        <div className="w-full bg-white border border-brand-orange/10 rounded-xl p-3 flex flex-col items-center gap-1 mt-3 shadow-sm">
                          <span className="text-[9px] uppercase tracking-widest font-black text-brand-dark/40">Recebedor do PIX / Beneficiário</span>
                          <span className="text-sm font-black text-brand-orange uppercase tracking-wide">James M. Rizo</span>
                          <span className="text-[9px] text-brand-dark/50 leading-none">Intermediado por Mercado Pago</span>
                        </div>
                      </div>
                    )}
                    {mpPaymentData?.ticket_url && (
                      <a href={mpPaymentData.ticket_url} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase font-black tracking-widest text-brand-orange hover:underline">
                        Abrir fatura externa
                      </a>
                    )}
                  </div>

                  {/* Resumo e Status */}
                  <div className="space-y-4 flex flex-col">
                    <div className="bg-brand-dark text-white p-5 rounded-xl space-y-4 flex-1">
                      <div className="space-y-2">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 font-black">SEUS NÚMEROS DA SORTE:</p>
                        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto pr-1">
                          {selectedNumbers.sort((a, b) => a - b).map(n => (
                            <span key={n} className="px-2 py-0.5 bg-white/15 border border-white/5 rounded text-[9px] font-bold text-white/95">#{String(n).padStart(3, '0')}</span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/10 flex justify-between items-center mt-auto">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-black">TOTAL A PAGAR:</span>
                        <span className="text-2xl font-sans font-black text-brand-orange">R$ {(selectedNumbers.length * campaign.price_per_number).toFixed(2)}</span>
                      </div>
                  </div>

                  {/* Mercado Pago Security Banner */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-sm">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={24} className="text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-snug">
                          Compra 100% Protegida & Criptografada
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          Seu pagamento é processado com a tecnologia de segurança e proteção do <strong>Mercado Pago</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm">
                      <span className="text-[8px] tracking-widest font-black uppercase text-slate-400">Garantia</span>
                      <span className="text-[10px] font-black text-brand-dark flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        MERCADO PAGO
                      </span>
                    </div>
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

                <button 
                  onClick={onClose} 
                  className="w-full sm:w-auto px-12 py-5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-2xl text-[11px] uppercase tracking-[0.2em] font-black transition-all shadow-[0_20px_40px_-10px_rgba(249,115,22,0.3)] hover:shadow-[0_20px_40px_-5px_rgba(249,115,22,0.4)] active:scale-95 text-center cursor-pointer mt-4"
                >
                  VOLTAR PARA O SITE
                </button>
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
