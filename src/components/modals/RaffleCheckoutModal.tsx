import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Ticket, ArrowRight, Loader2, CheckCircle, Copy } from 'lucide-react';
import { RaffleCampaign, useRaffles } from '../../hooks/useRaffles';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { supabase } from '../../lib/supabase';

interface RaffleCheckoutModalProps {
  campaign: RaffleCampaign;
  onClose: () => void;
}

export function RaffleCheckoutModal({ campaign, onClose }: RaffleCheckoutModalProps) {
  const { fetchTakenTickets, createOrder } = useRaffles();
  
  const [takenTickets, setTakenTickets] = useState<number[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { settings } = useSiteSettings();
  const pixKey = settings?.pix_key_checkout?.value || settings?.pix_key?.value || "ballettatianafigueiredo@gmail.com";
  const pixType = settings?.pix_checkout_type?.value || "E-mail";
  const pixReceiver = settings?.pix_checkout_receiver?.value || "Tatiana Figueiredo";
  const pixBank = settings?.pix_checkout_bank?.value || "NuBank";

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  useEffect(() => {
    const loadTaken = async () => {
      setLoading(true);
      const taken = await fetchTakenTickets(campaign.id);
      setTakenTickets(taken);
      setLoading(false);
    };
    loadTaken();
  }, [campaign.id]);

  const toggleNumber = (num: number) => {
    if (takenTickets.includes(num)) return;
    setSelectedNumbers(prev => 
      prev.includes(num) 
        ? prev.filter(n => n !== num)
        : [...prev, num]
    );
  };

  const totalPrice = selectedNumbers.length * campaign.price_per_number;

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
        total_price: totalPrice
      };

      const result = await createOrder(orderData);

      if (result.success) {
        setSuccess(true); // Sucesso imediato

        // Notificação em segundo plano
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
                  price: totalPrice,
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
      }
    } catch (err) {
      console.error('Order error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6 py-10 overflow-hidden">
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
        <button onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-brand-dark/20 hover:text-brand-orange transition-colors z-20">
          <X className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1} />
        </button>

        <div className="modal-content">

        {success ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-xl shadow-green-500/20">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-brand-dark mb-4 italic">Pedido de Rifa Recebido!</h3>
            <div className="bg-brand-grey p-6 border border-brand-dark/5 mb-6 text-left rounded-2xl">
              <p className="text-brand-orange text-[9px] uppercase tracking-widest font-bold mb-3">Próximo Passo: Pagamento</p>
              <p className="text-xs text-brand-dark/70 font-serif mb-4 leading-relaxed">
                Seus números <strong>({selectedNumbers.join(', ')})</strong> foram reservados. 
                Faça o PIX de <strong>R$ {totalPrice.toFixed(2)}</strong> e envie o comprovante.
              </p>
                <div className="bg-white p-4 border border-brand-dark/5 flex flex-col gap-4 rounded-xl">
                  <div className="text-center">
                    <span className="text-[9px] uppercase tracking-[0.1em] text-brand-orange font-bold block mb-1">Chave PIX para Pagamento</span>
                    <code className="text-brand-dark font-bold text-sm md:text-base break-all">{pixKey}</code>
                    <button 
                      onClick={handleCopyPix}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-brand-orange/10 text-brand-orange text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-brand-orange hover:text-white transition-all mt-3"
                    >
                      {copied ? (
                        <span className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-3 h-3" /> Copiado!
                        </span>
                      ) : (
                        <>
                          <Copy size={12} /> COPIAR CHAVE PIX
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-dark/5 text-left text-brand-dark">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-brand-dark/40 font-bold mb-1">Tipo</p>
                      <p className="text-xs font-serif capitalize">{pixType}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-brand-dark/40 font-bold mb-1">Banco</p>
                      <p className="text-xs font-serif">{pixBank}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] uppercase tracking-widest text-brand-dark/40 font-bold mb-1">Recebedor</p>
                      <p className="text-xs font-serif">{pixReceiver}</p>
                    </div>
                  </div>
                </div>
            </div>
            <div className="space-y-4 max-w-sm mx-auto">
              <a 
                href={`https://wa.me/55${(settings?.contact_whatsapp?.value || '31992127292').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Realizei uma participação na rifa ${campaign.name} e gostaria de enviar o comprovante. Nome: ${customerName}`)}`}
                target="_blank"
                className="w-full py-5 bg-[#25D366] text-white rounded-[1.5rem] text-[11px] uppercase tracking-[0.3em] font-black hover:shadow-[#25D366]/40 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
              >
                ENVIAR COMPROVANTE AGORA
              </a>
              <button onClick={onClose} className="w-full px-12 py-4 bg-brand-dark text-white font-bold uppercase tracking-widest text-[10px] hover:bg-brand-orange transition-all rounded-xl">
                Fechar Janela
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="flex flex-col">
              <div className="mb-4 sm:mb-8">
                <p className="text-brand-orange text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold mb-1 sm:mb-2">Seleção de Números</p>
                <h2 className="text-xl sm:text-3xl font-serif text-brand-dark italic">{campaign.name}</h2>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {Array.from({ length: campaign.total_numbers }, (_, i) => i + 1).map(num => {
                      const isTaken = takenTickets.includes(num);
                      const isSelected = selectedNumbers.includes(num);
                      return (
                        <button
                          key={num}
                          disabled={isTaken}
                          onClick={() => toggleNumber(num)}
                          className={`aspect-square flex items-center justify-center text-[10px] font-bold transition-all border ${
                            isTaken ? 'bg-brand-dark/5 border-transparent text-brand-dark/20 cursor-not-allowed' :
                            isSelected ? 'bg-brand-orange border-brand-orange text-white shadow-lg' :
                            'bg-brand-grey border-brand-dark/5 text-brand-dark hover:border-brand-orange hover:text-brand-orange'
                          }`}
                        >
                          {String(num).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 p-4 bg-brand-grey border border-brand-dark/5 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-grey border border-brand-dark/10" />
                    <span className="text-[8px] uppercase font-bold text-brand-dark/40">Livre</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-orange" />
                    <span className="text-[8px] uppercase font-bold text-brand-dark/40">Selecionado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-dark/5" />
                    <span className="text-[8px] uppercase font-bold text-brand-dark/40">Vendido</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-grey p-8 md:p-12 flex flex-col h-full text-brand-dark">
              {/* Instruções sempre visíveis no topo */}
              <div className="mb-12">
                <p className="text-brand-orange text-[10px] uppercase tracking-[0.3em] font-bold mb-6">Como Participar</p>
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-xs text-brand-dark/70 font-serif leading-relaxed">Escolha um ou mais números da sorte na tabela ao lado.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-xs text-brand-dark/70 font-serif leading-relaxed">Preencha seus dados para realizarmos a sua reserva.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-xs text-brand-dark/70 font-serif leading-relaxed">Finalize e envie o comprovante do PIX para o nosso WhatsApp.</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {selectedNumbers.length > 0 ? (
                  <div className="space-y-8">
                    <div>
                      <p className="text-brand-orange text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Números Selecionados</p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {selectedNumbers.map(n => (
                          <span key={n} className="px-3 py-1 bg-brand-orange text-white text-[10px] font-bold">#{String(n).padStart(2, '0')}</span>
                        ))}
                      </div>
                      <div className="flex justify-between items-center py-4 sm:py-6 border-y border-brand-dark/10">
                        <span className="text-brand-dark font-serif font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">Total a Pagar</span>
                        <span className="text-2xl sm:text-3xl font-display text-brand-orange">R$ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <form onSubmit={handleOrder} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-brand-dark/40 font-bold">Seu Nome</label>
                        <input 
                          type="text" required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full p-4 bg-white border border-brand-dark/5 outline-none focus:border-brand-orange transition-all font-serif text-brand-dark"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-brand-dark/40 font-bold">E-mail</label>
                        <input 
                          type="email" required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full p-4 bg-white border border-brand-dark/5 outline-none focus:border-brand-orange transition-all font-serif text-brand-dark"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-brand-dark/40 font-bold">WhatsApp</label>
                        <input 
                          type="tel" required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(maskPhone(e.target.value))}
                          className="w-full p-4 bg-white border border-brand-dark/5 outline-none focus:border-brand-orange transition-all font-serif text-brand-dark"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-brand-orange text-white py-6 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-dark transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Finalizar Reserva <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" /></>}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <Ticket className="w-12 h-12 text-brand-dark/20 mb-6" strokeWidth={1} />
                    <h4 className="text-xl font-serif italic mb-2 text-brand-dark/40">Nenhum número selecionado</h4>
                    <p className="text-sm font-serif max-w-[240px] text-brand-dark/30">Clique nos números disponíveis na tabela ao lado para escolher seus números da sorte.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </motion.div>
    </div>
  );
}
