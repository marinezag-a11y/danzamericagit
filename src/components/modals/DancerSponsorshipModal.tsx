import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Ticket, Loader2, Smartphone, Mail, User, RotateCw, Check } from 'lucide-react';
import { WheelPicker } from '../ui/WheelPicker';
import { LuckyRoulette } from '../ui/LuckyRoulette';
import { useDancers, Dancer } from '../../hooks/useDancers';
import { useRaffles, RaffleCampaign } from '../../hooks/useRaffles';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { supabase } from '../../lib/supabase';

interface DancerSponsorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string; // If null, we'll try to find an active one
}

type Step = 'dancer' | 'quantity' | 'roulette' | 'checkout' | 'success';

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
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

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
    if (isOpen && activeCampaign) {
      fetchTakenTickets(activeCampaign.id).then(setTakenNumbers);
    }
  }, [isOpen, activeCampaign]);

  useEffect(() => {
    if (dancers.length > 0 && !selectedDancer) {
      const active = dancers.find(d => d.is_active);
      if (active) setSelectedDancer(active);
    }
  }, [dancers]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || selectedNumbers.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderData = {
        campaign_id: activeCampaign.id,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        selected_numbers: selectedNumbers,
        total_price: selectedNumbers.length * activeCampaign.price_per_number,
        dancer_name: selectedDancer?.name || 'Geral'
      };

      const res = await createOrder(orderData);
      
      if (res.success) {
        setStep('success'); // Transição instantânea
        
        // Dispara o e-mail em segundo plano
        supabase.functions.invoke('send-order-v2-updated-v2', {
          body: {
            ...orderData,
            type: 'raffle_order',
            campaign_name: activeCampaign.name,
            items: [
              { 
                name: `Apoio ao Talento: ${selectedDancer?.name || 'Geral'}`, 
                price: activeCampaign.price_per_number * selectedNumbers.length,
                description: `Campanha: ${activeCampaign.name} | Números: ${selectedNumbers.join(', ')}`
              }
            ],
            pix_key: settings['pix_key_checkout']?.value,
            pix_receiver: settings['pix_checkout_receiver']?.value,
            pix_bank: settings['pix_checkout_bank']?.value,
            pix_type: settings['pix_checkout_type']?.value
          }
        }).catch(e => console.error('Background email error:', e));
      }
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-dark/95 backdrop-blur-md"
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

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-10 right-10 z-20 p-5 bg-black/5 hover:bg-black/10 rounded-full text-brand-dark/30 hover:text-brand-dark transition-all transform hover:rotate-90"
        >
          <X size={24} />
        </button>

        <div className="modal-content relative">
          {/* Header */}
          <div className="mb-6 sm:mb-16 text-center">
            <motion.h2 
              key={step}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-4xl font-serif italic text-brand-dark leading-tight"
            >
              {step === 'dancer' ? 'Escolha seu Talento' : 
               step === 'quantity' ? 'Quantidade de Números' :
               step === 'roulette' ? 'Sorteio da Sorte' :
               step === 'checkout' ? 'Finalizar Apoio' : 'Sonho Realizado!'}
              <span className="text-brand-orange">.</span>
            </motion.h2>
            <p className="text-[9px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.5em] text-brand-dark/30 font-black mt-4 sm:mt-6 italic">
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

                  <div className="flex flex-col items-center gap-8 pt-6 border-t border-black/5">
                    <button 
                      onClick={handleNext}
                      disabled={!selectedDancer}
                      className="px-20 py-7 bg-brand-dark text-white rounded-[2.5rem] text-[12px] uppercase tracking-[0.4em] font-black hover:bg-brand-orange transition-all shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] hover:shadow-brand-orange/40 active:scale-95 disabled:opacity-50 flex items-center gap-4"
                    >
                      CONTINUAR PARA VALORES <ChevronRight size={18} />
                    </button>
                    <button onClick={onClose} className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-dark/20 hover:text-brand-dark transition-all italic">Desistir do Apoio</button>
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
                  </div>
                  
                  <div className="w-full max-w-sm bg-black/[0.03] p-12 rounded-[4rem] border border-black/5 space-y-10 shadow-inner">
                    <div className="flex items-center justify-between gap-10">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-brand-dark hover:bg-brand-dark hover:text-white transition-all text-2xl sm:text-4xl font-light border border-black/5 active:scale-90"
                      >
                        -
                      </button>
                      <div className="text-center">
                        <span className="text-6xl sm:text-8xl font-serif italic text-brand-dark tabular-nums tracking-tighter">{quantity}</span>
                        <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-brand-dark/30 font-black mt-1 sm:mt-2">NÚMEROS</p>
                      </div>
                      <button 
                        onClick={() => setQuantity(Math.min(
                          activeCampaign?.numbers_per_order || 20, 
                          availableNumbers.length,
                          quantity + 1
                        ))}
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-brand-dark hover:bg-brand-dark hover:text-white transition-all text-2xl sm:text-4xl font-light border border-black/5 active:scale-90"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="pt-6 sm:pt-10 border-t border-black/5 flex items-center justify-between px-2 sm:px-4">
                      <span className="text-[9px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-brand-dark/40 font-black">Investimento:</span>
                      <span className="text-2xl sm:text-3xl font-serif italic text-brand-orange">
                        R$ {activeCampaign ? (activeCampaign.price_per_number * quantity).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full flex flex-col items-center gap-8">
                    <button 
                      onClick={handleNext}
                      className="px-20 py-7 bg-brand-dark text-white rounded-[2.5rem] text-[12px] uppercase tracking-[0.4em] font-black hover:bg-brand-orange transition-all shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] flex items-center gap-4 active:scale-95 group"
                    >
                      SORTEAR MEUS NÚMEROS <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    <button onClick={handleBack} className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-dark/20 hover:text-brand-dark transition-all italic">Alterar Talentoso</button>
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
                  <div className="flex items-center gap-6 bg-white shadow-2xl px-10 py-5 rounded-[2.5rem] border border-black/5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0 bg-white">
                      {selectedDancer?.photo_url ? (
                        <img 
                          src={selectedDancer.photo_url} 
                          className="w-full h-full object-cover scale-[1.8]" 
                          alt="" 
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-orange/5 flex items-center justify-center"><User className="w-6 h-6 text-brand-orange/20" /></div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-brand-dark/30 font-black">PROJETO DE APOIO</p>
                      <p className="text-lg font-serif italic text-brand-dark leading-none mt-1">{selectedDancer?.name}</p>
                    </div>
                  </div>

                  <LuckyRoulette 
                    availableNumbers={availableNumbers}
                    quantityToSelect={quantity}
                    onNumbersSelected={(nums) => {
                      setSelectedNumbers(nums);
                      setHasSpunOnce(true);
                    }}
                    isSpinning={isSpinning}
                    setIsSpinning={setIsSpinning}
                    fixedIndices={fixedIndices}
                    onToggleFix={toggleFixNumber}
                    selectedNumbers={selectedNumbers}
                    hasSpunOnce={hasSpunOnce}
                  />

                  <div className="w-full flex flex-col items-center gap-8 pt-8">
                    {!hasSpunOnce ? (
                      <button 
                        onClick={() => setIsSpinning(true)}
                        disabled={isSpinning}
                        className="px-24 py-8 bg-brand-orange text-white rounded-[2.5rem] text-[13px] uppercase tracking-[0.5em] font-black hover:bg-brand-dark transition-all shadow-[0_32px_64px_-16px_rgba(204,0,0,0.5)] active:scale-95 disabled:opacity-50 flex items-center gap-4"
                      >
                        <RotateCw size={20} className={isSpinning ? 'animate-spin' : ''} />
                        {isSpinning ? 'SORTEANDO...' : 'GIRAR SORTE'}
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <button 
                          onClick={() => setIsSpinning(true)}
                          disabled={isSpinning}
                          className="px-12 py-6 bg-white border-2 border-brand-orange/20 text-brand-orange rounded-[2rem] text-[11px] uppercase tracking-[0.4em] font-black hover:bg-brand-orange/5 transition-all flex items-center gap-3 active:scale-95"
                        >
                          <RotateCw size={16} className={isSpinning ? 'animate-spin' : ''} />
                          SORTEAR RESTANTES
                        </button>
                        <button 
                          onClick={handleNext}
                          disabled={isSpinning}
                          className="px-16 py-6 bg-brand-dark text-white rounded-[2rem] text-[11px] uppercase tracking-[0.4em] font-black hover:bg-brand-orange transition-all shadow-2xl flex items-center gap-3 active:scale-95"
                        >
                          CONFIRMAR NÚMEROS <Check size={18} />
                        </button>
                      </div>
                    )}
                    <button onClick={handleBack} disabled={isSpinning} className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-dark/20 hover:text-brand-dark transition-all italic">Refazer Escolha</button>
                  </div>
                </motion.div>
              )}

              {step === 'checkout' && (
                <motion.div 
                  key="step-checkout"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-12"
                >
                  {/* Summary Side */}
                  <div className="bg-brand-dark text-white p-12 rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-1000" />
                    
                    <div className="relative z-10 h-full flex flex-col justify-between gap-12">
                      <div className="space-y-10">
                        <div className="flex items-center gap-8">
                          <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl flex-shrink-0 rotate-3 bg-white">
                            {selectedDancer?.photo_url ? (
                              <img 
                                src={selectedDancer.photo_url} 
                                className="w-full h-full object-cover scale-[1.8]" 
                                alt="" 
                              />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center"><User className="w-10 h-10 text-white/10" /></div>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-black">BENEFICIÁRIO</p>
                            <h4 className="text-3xl font-serif italic text-white leading-tight mt-1">{selectedDancer?.name}</h4>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-black">NÚMEROS RESERVADOS:</p>
                          <div className="flex flex-wrap gap-3 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedNumbers.map(n => (
                              <span key={n} className="px-4 py-2 bg-white/10 text-white rounded-2xl text-[12px] font-black border border-white/5 shadow-lg tabular-nums">#{n}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-12 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-[0.5em] text-white/30 font-black">TOTAL DO APOIO:</span>
                        <span className="text-5xl font-serif italic text-brand-orange tracking-tighter">
                          R$ {activeCampaign ? (activeCampaign.price_per_number * quantity).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Side */}
                  <form onSubmit={handleSubmit} className="flex flex-col justify-between py-4">
                    <div className="space-y-8">
                      <div className="space-y-2">
                         <p className="text-[10px] uppercase tracking-[0.5em] text-brand-dark/30 font-black ml-4">SEUS DADOS <span className="text-brand-orange">*</span></p>
                         <div className="space-y-4">
                            <div className="relative group">
                              <input 
                                type="text" 
                                required 
                                placeholder="Nome Completo *"
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})}
                                className="w-full bg-black/[0.04] border border-transparent p-6 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] text-sm outline-none focus:bg-white focus:border-brand-orange/30 focus:shadow-2xl transition-all font-medium placeholder:text-brand-dark/20 text-brand-dark"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input 
                                type="tel" 
                                required 
                                placeholder="WhatsApp *"
                                value={form.phone} 
                                onChange={e => setForm({...form, phone: e.target.value})}
                                className="w-full bg-black/[0.04] border border-transparent p-6 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] text-sm outline-none focus:bg-white focus:border-brand-orange/30 focus:shadow-2xl transition-all font-medium placeholder:text-brand-dark/20 text-brand-dark"
                              />
                              <input 
                                type="email" 
                                required 
                                placeholder="E-mail *"
                                value={form.email} 
                                onChange={e => setForm({...form, email: e.target.value})}
                                className="w-full bg-black/[0.04] border border-transparent p-6 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] text-sm outline-none focus:bg-white focus:border-brand-orange/30 focus:shadow-2xl transition-all font-medium placeholder:text-brand-dark/20 text-brand-dark"
                              />
                            </div>
                         </div>
                      </div>

                      <div className="p-8 bg-brand-orange/5 border border-brand-orange/10 rounded-[2.5rem] flex gap-6">
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
                        className="w-full py-8 bg-brand-orange text-white rounded-[2.5rem] text-[13px] uppercase tracking-[0.5em] font-black hover:bg-brand-dark transition-all shadow-[0_32px_64px_-16px_rgba(204,0,0,0.5)] flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check size={24} strokeWidth={3} />}
                        CONFIRMAR E APOIAR
                      </button>
                      <button type="button" onClick={handleBack} className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-dark/20 hover:text-brand-dark transition-all italic">Revisar Números</button>
                    </div>
                  </form>
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

                  <div className="space-y-3">
                    <h3 className="text-3xl font-serif italic text-brand-dark leading-tight">Pedido Recebido!</h3>
                    <p className="text-xs text-brand-dark/50 max-w-sm mx-auto leading-relaxed italic">
                      Sua reserva para apoiar <span className="text-brand-dark font-black underline decoration-brand-orange/40 decoration-2 underline-offset-4">{selectedDancer?.name}</span> foi processada. Agora falta pouco!
                    </p>
                  </div>

                  <div className="w-full max-w-sm bg-white p-6 rounded-[2rem] border border-black/5 shadow-xl space-y-6">
                    <div className="space-y-4">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-brand-dark/30 font-black">CHAVE PIX ({settings['pix_checkout_type']?.value || 'E-mail'})</p>
                      <div className="relative group">
                        <div className="bg-black/[0.04] p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-transparent hover:border-brand-orange/30 transition-all shadow-inner">
                          <p className="font-mono text-xs sm:text-sm text-brand-dark break-all font-black tracking-tight">{settings['pix_key_checkout']?.value || 'ballettatianafigueiredo@gmail.com'}</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(settings['pix_key_checkout']?.value || 'ballettatianafigueiredo@gmail.com');
                            alert('Chave PIX copiada!');
                          }}
                          className="mt-3 w-full py-3 bg-brand-orange/10 text-brand-orange text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-brand-orange hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Copy size={12} /> COPIAR CHAVE PIX
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 text-left border-t border-black/5 pt-8">
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.3em] text-brand-dark/30 font-black mb-1">BANCO</p>
                        <p className="text-sm font-black text-brand-dark tracking-tight">{settings['pix_checkout_bank']?.value || 'SICOOB'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.3em] text-brand-dark/30 font-black mb-1">RECEBEDOR</p>
                        <p className="text-sm font-black text-brand-dark tracking-tight">{settings['pix_checkout_receiver']?.value || 'Tatiana Figueiredo'}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        const msg = encodeURIComponent(`Olá! Quero oficializar meu apoio para ${selectedDancer?.name}.`);
                        window.open(`https://wa.me/5531992127292?text=${msg}`);
                      }}
                      className="w-full py-5 bg-[#25D366] text-white rounded-[1.5rem] text-[11px] uppercase tracking-[0.3em] font-black hover:shadow-[0_15px_30px_-5px_rgba(37,211,102,0.4)] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                    >
                      <Smartphone size={18} />
                      ENVIAR COMPROVANTE AGORA
                    </button>
                  </div>

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
    </div>
  );
}
