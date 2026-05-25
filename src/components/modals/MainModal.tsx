import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowRight, Loader2, CheckCircle, Phone, Instagram, Mail, MapPin, Plus, Minus, Copy, ChevronDown } from 'lucide-react';
import { useHelpOrders } from '../../hooks/useHelpOrders';
import { HelpItem } from '../../hooks/useHelpItems';
import { usePageTracking } from '../../hooks/usePageTracking';
import { useEventTracking } from '../../hooks/useEventTracking';
import { supabase } from '../../lib/supabase';
import { useSiteSettings } from '../../hooks/useSiteSettings';

export type ModalType = 'store' | 'raffle' | 'event' | 'donation' | 'contact' | null;

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  options?: string[];
}

interface MainModalProps {
  activeModal: ModalType;
  selectedItemId?: string | null;
  onClose: () => void;
  helpItems: HelpItem[];
}

export function MainModal({ activeModal, selectedItemId, onClose, helpItems }: MainModalProps) {
  const { addOrder } = useHelpOrders();
  const { trackEvent } = useEventTracking();
  
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    if (activeModal) {
      const timer = setTimeout(() => {
        checkScrollability();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeModal, quantities, success]);

  useEffect(() => {
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  useEffect(() => {
    if (activeModal === 'store') {
      trackEvent('Abrir Carrinho', 'view');
    }
    if (activeModal) {
      setSuccess(false);
      setError(null);
    }
  }, [activeModal]);

  const products = useMemo(() => {
    if (!helpItems || !Array.isArray(helpItems)) return [];
    return helpItems
      .filter(item => item.is_active !== false)
      .map(item => ({
      id: item?.id || Math.random().toString(),
      name: item?.title || 'Item sem nome',
      price: Number(item?.price) || 0,
      description: item?.description || '',
      image: item?.image_url || 'https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=800&auto=format&fit=crop',
      options: item?.options || []
    }));
  }, [helpItems]);

  const selectedProducts = useMemo(() => 
    products.filter(p => !!quantities[p.id]),
    [products, quantities]
  );

  const totalPrice = useMemo(() => 
    selectedProducts.reduce((sum, p) => sum + (p.price * (quantities[p.id] || 0)), 0),
    [selectedProducts, quantities]
  );

  useEffect(() => {
    if (selectedItemId && !quantities[selectedItemId]) {
      setQuantities(prev => ({ ...prev, [selectedItemId]: 1 }));
    }
  }, [selectedItemId]);

  const toggleProduct = (id: string) => {
    setQuantities(prev => {
      const newQuantities = { ...prev };
      if (newQuantities[id]) {
        delete newQuantities[id];
        setSelectedOptions(opts => {
          const newOpts = { ...opts };
          delete newOpts[id];
          return newOpts;
        });
      } else {
        newQuantities[id] = 1;
        const product = products.find(p => p.id === id);
        if (product?.options?.length) {
          setSelectedOptions(opts => ({ ...opts, [id]: product.options![0] }));
        }
      }
      return newQuantities;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const newValue = current + delta;
      if (newValue <= 0) {
        const newQuantities = { ...prev };
        delete newQuantities[id];
        return newQuantities;
      }
      return { ...prev, [id]: newValue };
    });
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

  const resetForm = () => {
    setQuantities({});
    setSelectedOptions({});
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setSuccess(false);
    setSubmitting(false);
    setError(null);
    setCopied(false);
  };

  const { settings } = useSiteSettings();
  const pixKey = settings?.pix_key_checkout?.value || settings?.pix_key?.value || "ballettatianafigueiredo@gmail.com";
  const pixType = settings?.pix_checkout_type?.value || "E-mail";
  const pixReceiver = settings?.pix_checkout_receiver?.value || "NUCLEO DE DANCA TATIANA FIGUEIREDO";
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

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const newOrderId = crypto.randomUUID();
      const orderData = {
        id: newOrderId,
        customer_name: customerName || 'Cliente sem nome',
        customer_email: customerEmail || '',
        customer_phone: customerPhone || '',
        product_name: selectedProducts.map(p => `${quantities[p.id] || 1}x ${p.name || 'Produto'}${selectedOptions[p.id] ? ` (${selectedOptions[p.id]})` : ''}`).join(', '),
        product_price: totalPrice,
        total_price: totalPrice,
        items: selectedProducts.map(p => ({ 
          id: p.id, 
          name: p.name || 'Produto', 
          price: p.price || 0,
          quantity: quantities[p.id] || 1,
          option: selectedOptions[p.id] || null
        })),
        status: 'pending' as const
      };

      // 1. Save to Database
      const result = await addOrder(orderData);

      if (result.success) {
        setSuccess(true); // Mostra sucesso imediatamente
        trackEvent('Finalizar Pedido', 'conversion', { total: totalPrice });
      } else {
        setError('Ocorreu um erro ao salvar seu pedido. Por favor, tente novamente ou nos chame no WhatsApp.');
      }
    } catch (err: any) {
      console.error('Error adding order:', err);
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeModal) return null;

  return (
    <div 
      key="modal-container" 
      ref={scrollContainerRef}
      onScroll={checkScrollability}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <motion.div 
        key="modal-backdrop"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-dark/90 backdrop-blur-sm"
        onClick={() => {
          onClose();
          resetForm();
        }}
      />
      <motion.div 
        key="modal-content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="modal-container relative z-10"
      >
        {/* Header Bar */}
        <div className="modal-header">
          <div className="flex items-center gap-4">
             <div className="w-2 h-12 bg-brand-orange rounded-full" />
             <div>
                <p className="text-brand-orange text-[10px] uppercase tracking-[0.5em] font-black mb-1">
                  {activeModal === 'store' ? 'CARRINHO SOLIDÁRIO' : 
                   activeModal === 'contact' ? 'FALE CONOSCO' : 'PATROCÍNIO DIRETO'}
                </p>
                <h2 className="text-3xl font-serif text-brand-dark italic leading-tight">
                  {activeModal === 'store' ? 'Itens de Apoio' : 
                   activeModal === 'contact' ? 'Nossos Contatos' : 'Contribuição'}
                </h2>
             </div>
          </div>
          <button 
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-4 bg-black/5 hover:bg-black/10 rounded-full text-brand-dark/30 hover:text-brand-dark transition-all transform hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="modal-content">
          {(activeModal === 'store' || activeModal === 'raffle' || activeModal === 'event' || activeModal === 'donation') && (
            <div className={`${success ? 'max-w-2xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24'}`}>
              <div className={success ? 'w-full' : ''}>
                {!success ? (
                  <div className="space-y-6">
                    {products.map(product => {
                      const isSelected = !!quantities[product.id];
                      return (
                        <div 
                          key={product.id} 
                          className={`p-8 rounded-[3rem] flex flex-col gap-8 transition-all border group relative overflow-hidden ${isSelected ? 'bg-brand-orange/[0.03] border-brand-orange shadow-[0_20px_40px_-12px_rgba(204,0,0,0.1)]' : 'bg-black/[0.02] border-transparent hover:border-black/5 hover:bg-black/[0.04]'}`}
                        >
                          {isSelected && (
                            <div className="absolute top-0 right-0 p-6">
                               <div className="w-8 h-8 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-lg">
                                  <CheckCircle className="w-5 h-5" />
                               </div>
                            </div>
                          )}

                          <div 
                            className="flex gap-8 items-start cursor-pointer w-full"
                            onClick={() => toggleProduct(product.id)}
                          >
                            <div className="relative w-28 h-28 overflow-hidden rounded-[2.5rem] bg-white border border-black/5 shrink-0 shadow-xl group-hover:rotate-3 transition-transform">
                              <img 
                                src={product.image} 
                                className="w-full h-full object-cover transition-all duration-1000 scale-[1.6] group-hover:scale-[1.8]" 
                                alt={product.name}
                              />
                            </div>
                            <div className="flex-1 min-w-0 pt-2">
                              <h4 className="font-serif text-2xl text-brand-dark leading-tight mb-2">{product.name}</h4>
                              <p className="text-brand-orange font-serif italic text-xl">R$ {product.price.toFixed(2)}</p>
                              {product.description && (
                                <p className="text-brand-dark/40 text-xs mt-3 line-clamp-2 leading-relaxed italic">{product.description}</p>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pt-8 border-t border-black/5"
                            >
                              {product.options && product.options.length > 0 ? (
                                <div className="flex-1">
                                  <label className="text-[9px] uppercase tracking-[0.3em] text-brand-orange font-black block mb-4 italic opacity-60">VARIAÇÃO DISPONÍVEL</label>
                                  <div className="flex flex-row flex-wrap items-center gap-3">
                                    {product.options.map(opt => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedOptions(prev => ({ ...prev, [product.id]: opt }));
                                        }}
                                        className={`h-12 min-w-[50px] px-6 flex items-center justify-center text-[11px] uppercase tracking-widest font-black border transition-all rounded-2xl ${
                                          selectedOptions[product.id] === opt
                                            ? 'bg-brand-orange border-brand-orange text-white shadow-xl scale-105'
                                            : 'bg-white border-black/5 text-brand-dark/30 hover:border-brand-orange/30 hover:text-brand-orange'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1"></div>
                              )}

                              <div className="flex items-center gap-4 shrink-0">
                                <div className="flex items-center bg-white border border-black/5 rounded-full p-2 shadow-xl">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-brand-dark/40 hover:text-brand-orange"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-12 text-center text-lg font-serif italic text-brand-dark tabular-nums">{quantities[product.id]}</span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-brand-dark/40 hover:text-brand-orange"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-[0_15px_30px_-10px_rgba(16,185,129,0.5)] rotate-12">
                        <CheckCircle className="w-8 h-8" strokeWidth={1.5} />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-[1rem] shadow-xl flex items-center justify-center">
                         <ShoppingBag className="w-5 h-5 text-brand-orange" strokeWidth={1.5} />
                      </div>
                    </div>

                    <h3 className="text-2xl font-serif text-brand-dark mb-4 italic leading-tight">Pedido Recebido com Sucesso!</h3>
                    
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-black/5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] mb-8 max-w-sm mx-auto text-left space-y-6">
                      <div className="space-y-2">
                        <p className="text-brand-orange text-[9px] uppercase tracking-[0.3em] font-black italic opacity-60">CONFIRMAÇÃO VIA PIX</p>
                        <p className="text-xs text-brand-dark/60 font-serif leading-relaxed italic">
                          Para confirmar seu apoio, realize o PIX e envie o comprovante para nosso WhatsApp.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="bg-black/5 p-5 rounded-2xl border border-transparent shadow-inner">
                            <span className="text-[8px] uppercase tracking-[0.2em] text-brand-dark/30 font-black block mb-2">CHAVE PIX ({pixType})</span>
                            <p className="text-brand-dark font-mono font-black text-sm break-all tracking-tight leading-none">{pixKey}</p>
                          </div>
                          <button 
                            onClick={handleCopyPix}
                            className="w-full py-3 bg-brand-orange/10 text-brand-orange text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-brand-orange hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <Copy size={12} /> COPIAR CHAVE PIX
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 px-2">
                          <div className="space-y-0.5">
                            <p className="text-[8px] uppercase tracking-widest text-brand-dark/30 font-black">BANCO</p>
                            <p className="text-xs font-black text-brand-dark">{pixBank}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[8px] uppercase tracking-widest text-brand-dark/30 font-black">RECEBEDOR</p>
                            <p className="text-xs font-black text-brand-dark">{pixReceiver}</p>
                          </div>
                        </div>
                      </div>

                      <a 
                        href={`https://wa.me/55${(settings?.contact_whatsapp?.value || '31992127292').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Realizei um pedido de apoio e gostaria de enviar o comprovante. Nome: ${customerName}`)}`}
                        target="_blank"
                        className="w-full py-4 bg-[#25D366] text-white rounded-[1.5rem] text-[10px] uppercase tracking-[0.3em] font-black hover:shadow-[#25D366]/40 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                      >
                        <Phone size={16} />
                        Enviar Comprovante
                      </a>
                    </div>

                    <button 
                      onClick={onClose}
                      className="px-10 py-4 border border-black/5 text-brand-dark/20 rounded-[1.5rem] text-[9px] uppercase tracking-[0.3em] font-black hover:border-brand-dark hover:text-brand-dark transition-all"
                    >
                      CONCLUIR E FECHAR
                    </button>
                  </motion.div>
                )}
              </div>

              {!success && (
                <div className="flex flex-col min-h-[500px]">
                  {selectedProducts.length > 0 ? (
                    <div className="h-full flex flex-col gap-12">
                      <div className="bg-brand-dark text-white p-6 md:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-1000" />
                        
                        <div className="relative z-10 space-y-10">
                          <div className="space-y-2">
                             <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-black">RESUMO DO APOIO</p>
                             <div className="space-y-4 pt-4 max-h-[160px] overflow-y-auto custom-scrollbar pr-4">
                               {selectedProducts.map(p => (
                                 <div key={p.id} className="flex justify-between items-center text-sm font-serif italic text-white/60">
                                   <div className="flex gap-4 items-center">
                                     <span className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center text-[10px] text-white font-black not-italic tabular-nums">{quantities[p.id]}x</span>
                                     <span className="text-white/90">{p.name} {selectedOptions[p.id] && <span className="text-[10px] text-brand-orange font-black not-italic ml-2 tracking-widest uppercase">[{selectedOptions[p.id]}]</span>}</span>
                                   </div>
                                   <span className="text-white/40 tabular-nums">R$ {(p.price * (quantities[p.id] || 0)).toFixed(2)}</span>
                                 </div>
                               ))}
                             </div>
                          </div>

                          <div className="pt-10 border-t border-white/10 flex items-center justify-between">
                            <span className="text-white/30 font-black uppercase tracking-[0.4em] text-[10px]">TOTAL FINAL</span>
                            <span className="text-4xl md:text-5xl font-serif italic text-brand-orange tabular-nums">R$ {totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleOrder} className="space-y-10 flex-1">
                        <div className="space-y-6 px-4">
                          <p className="text-[10px] uppercase tracking-[0.4em] text-brand-dark/30 font-black">INFORMAÇÕES PESSOAIS <span className="text-brand-orange">*</span></p>
                          <div className="space-y-4">
                            <div className="relative group">
                              <input 
                                type="text" required value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Nome Completo *"
                                className="w-full p-4 bg-black/5 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium placeholder:text-brand-dark/20 text-brand-dark"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input 
                                type="email" required value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="E-mail *"
                                className="w-full p-4 bg-black/5 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium placeholder:text-brand-dark/20 text-brand-dark"
                              />
                              <input 
                                type="tel" required value={customerPhone}
                                onChange={(e) => setCustomerPhone(maskPhone(e.target.value))}
                                placeholder="WhatsApp *"
                                className="w-full p-4 bg-black/5 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-brand-orange/30 transition-all font-medium placeholder:text-brand-dark/20 text-brand-dark"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {error && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-6 bg-brand-orange/10 border-l-4 border-brand-orange text-brand-orange text-xs font-black tracking-widest uppercase">
                            {error}
                          </motion.div>
                        )}
                        
                        <div className="space-y-6">
                           <button 
                             type="submit"
                             disabled={submitting}
                             className="w-full bg-brand-dark text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-brand-orange transition-all shadow-xl flex items-center justify-center gap-4 group disabled:opacity-50 active:scale-95"
                           >
                             {submitting ? (
                               <Loader2 className="w-6 h-6 animate-spin" />
                             ) : (
                               <>
                                 FINALIZAR APOIO <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
                               </>
                             )}
                           </button>
                           <p className="text-center text-[9px] uppercase tracking-[0.2em] text-brand-dark/20 font-black italic">
                              Pagamento Seguro via PIX • Seus dados estão protegidos
                           </p>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                      <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-28 h-28 bg-black/5 rounded-[3rem] flex items-center justify-center mb-8 border border-black/5"
                      >
                        <ShoppingBag className="w-10 h-10 text-brand-dark/20" strokeWidth={1} />
                      </motion.div>
                      <h4 className="text-2xl font-serif italic text-brand-dark/40 mb-4 leading-tight">Sua sacola de apoio<br/>está vazia</h4>
                      <p className="text-[10px] uppercase tracking-widest font-black text-brand-dark/20 max-w-[240px] leading-relaxed">
                        Escolha um ou mais itens ao lado para iniciar sua contribuição com nossa equipe.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeModal === 'contact' && (
            <div className="max-w-5xl mx-auto space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { icon: Phone, label: 'Contato Checkout', value: settings?.contact_whatsapp?.value ? maskPhone(settings.contact_whatsapp.value) : '(31) 99212-7292', href: `https://wa.me/55${(settings?.contact_whatsapp?.value || '31992127292').replace(/\D/g, '')}`, color: '#25D366' },
                  { icon: Instagram, label: 'Instagram', value: '@nucleodedanca', href: 'https://instagram.com/nucleodedanca', color: '#E1306C' },
                  { icon: Mail, label: 'E-mail', value: 'nucleodedanca@yahoo.com.br', href: 'mailto:nucleodedanca@yahoo.com.br', color: '#EA4335' },
                  { icon: MapPin, label: 'Endereço', value: 'Av. Abílio Machado, 3997 – BH', href: 'https://www.google.com/maps/search/?api=1&query=Av.+Abílio+Machado,+3997+–+Belo+Horizonte,+MG', color: '#4285F4' }
                ].map((item, idx) => (
                  <motion.a 
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    href={item.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 xs:gap-6 sm:gap-8 p-6 xs:p-8 sm:p-10 bg-black/[0.02] hover:bg-white hover:shadow-2xl hover:scale-[1.02] border border-transparent hover:border-black/5 rounded-[3rem] group transition-all duration-500"
                  >
                    <div className="w-16 h-16 bg-white shadow-xl flex items-center justify-center rounded-[1.8rem] group-hover:rotate-12 transition-transform shrink-0">
                      <item.icon className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-[9px] uppercase font-black tracking-[0.3em] text-brand-dark/20 group-hover:text-brand-orange transition-colors truncate">{item.label}</p>
                      <p className="text-base xs:text-lg sm:text-xl font-serif italic text-brand-dark leading-tight mt-1 break-words">{item.value}</p>
                    </div>
                  </motion.a>
                ))}
              </div>

              <div className="pt-16 border-t border-black/5 flex flex-col items-center gap-4 text-center">
                 <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.5em] font-black text-brand-dark/10">
                    <div className="w-8 h-px bg-current" />
                    DANZAMERICA 2026
                    <div className="w-8 h-px bg-current" />
                 </div>
                 <p className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-dark/20 italic">
                    Talentos de Minas • Córdoba, Argentina • Realizando Sonhos
                 </p>
              </div>
            </div>
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
