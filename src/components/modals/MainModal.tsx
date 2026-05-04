import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingBag, ArrowRight, Loader2, CheckCircle, Phone, Instagram, Mail, MapPin } from 'lucide-react';
import { useHelpOrders } from '../../hooks/useHelpOrders';
import { HelpItem } from '../../hooks/useHelpItems';
import { supabase } from '../../lib/supabase';

export type ModalType = 'store' | 'raffle' | 'event' | 'donation' | 'contact' | null;

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface MainModalProps {
  activeModal: ModalType;
  selectedItemId?: string | null;
  onClose: () => void;
  helpItems: HelpItem[];
}

export function MainModal({ activeModal, selectedItemId, onClose, helpItems }: MainModalProps) {
  const { addOrder } = useHelpOrders();
  
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const products = useMemo(() => (helpItems || []).map(item => ({
    id: item.id,
    name: item.title,
    price: Number(item.price) || 0,
    description: item.description,
    image: item.image_url || 'https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=800&auto=format&fit=crop'
  })), [helpItems]);

  const selectedProducts = useMemo(() => 
    products.filter(p => selectedProductIds.includes(p.id)),
    [products, selectedProductIds]
  );

  const totalPrice = useMemo(() => 
    selectedProducts.reduce((sum, p) => sum + p.price, 0),
    [selectedProducts]
  );

  useEffect(() => {
    if (selectedItemId && !selectedProductIds.includes(selectedItemId)) {
      setSelectedProductIds(prev => [...prev, selectedItemId]);
    }
  }, [selectedItemId]);

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const resetForm = () => {
    setSelectedProductIds([]);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setSuccess(false);
    setSubmitting(false);
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) return;

    setSubmitting(true);
    try {
      const orderData = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        product_name: selectedProducts.map(p => p.name).join(', '),
        product_price: totalPrice,
        total_price: totalPrice,
        items: selectedProducts.map(p => ({ id: p.id, name: p.name, price: p.price })),
        status: 'pending' as const
      };

      // 1. Save to Database
      const result = await addOrder(orderData);

      if (result.success) {
        // 2. Send Emails via Edge Function
        await supabase.functions.invoke('send-order', {
          body: orderData
        });
        
        setSuccess(true);
      } else {
        alert('Erro ao processar pedido.');
      }
    } catch (error) {
      console.error('Error adding order:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeModal) return null;

  return (
    <div key="modal-container" className="fixed inset-0 z-[9999] flex items-center justify-center px-6 py-10 overflow-hidden">
      <motion.div 
        key="modal-backdrop"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-dark/95 backdrop-blur-md"
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
        className="relative bg-brand-white w-full max-w-5xl p-8 md:p-16 max-h-[90vh] overflow-y-auto z-[10000] shadow-2xl"
      >
        <button 
          onClick={() => {
            onClose();
            resetForm();
          }}
          className="absolute top-8 right-8 text-brand-dark/20 hover:text-brand-orange transition-colors"
        >
          <X className="w-8 h-8" strokeWidth={1} />
        </button>

        {(activeModal === 'store' || activeModal === 'raffle' || activeModal === 'event' || activeModal === 'donation') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <div className="mb-8">
                <p className="text-brand-orange text-[10px] uppercase tracking-[0.3em] font-bold mb-2">Seleção Solidária</p>
                <h2 className="text-4xl font-serif text-brand-dark italic">Itens para Apoiar</h2>
              </div>

              {!success ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {products.map(product => {
                    const isSelected = selectedProductIds.includes(product.id);
                    return (
                      <div 
                        key={product.id} 
                        onClick={() => toggleProduct(product.id)}
                        className={`p-6 flex gap-6 items-center cursor-pointer transition-all border group ${isSelected ? 'bg-brand-orange/5 border-brand-orange shadow-md' : 'bg-brand-grey border-transparent hover:border-brand-dark/10'}`}
                      >
                        <div className="relative w-20 h-20 overflow-hidden bg-white border border-brand-dark/5 shrink-0">
                          <img 
                            src={product.image} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                            alt={product.name}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-serif text-lg text-brand-dark leading-tight mb-1">{product.name}</h4>
                          <p className="text-brand-orange font-display">R$ {product.price.toFixed(2)}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-brand-orange border-brand-orange text-white' : 'border-brand-dark/20'}`}>
                          {isSelected && <CheckCircle className="w-4 h-4" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-serif text-brand-dark mb-4 italic">Pedido Recebido!</h3>
                  <p className="text-brand-dark/60 font-serif max-w-sm">Obrigado por seu apoio. Enviamos uma confirmação para seu e-mail e entraremos em contato via WhatsApp.</p>
                </div>
              )}
            </div>

            <div className="bg-brand-grey p-8 md:p-12 flex flex-col min-h-[500px]">
              {selectedProducts.length > 0 && !success ? (
                <div className="h-full flex flex-col">
                  <div className="mb-8">
                    <p className="text-brand-orange text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Resumo do Carrinho</p>
                    <div className="space-y-3 mb-6">
                      {selectedProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm font-serif italic text-brand-dark/60">
                          <span>{p.name}</span>
                          <span>R$ {p.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center py-6 border-y border-brand-dark/10">
                      <span className="text-brand-dark font-serif font-bold uppercase tracking-widest text-[10px]">Total do Pedido</span>
                      <span className="text-3xl font-display text-brand-orange">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <form onSubmit={handleOrder} className="space-y-6 flex-1">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-brand-dark/40 font-bold">Seu Nome</label>
                      <input 
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nome completo"
                        className="w-full p-4 bg-white border border-brand-dark/5 outline-none focus:border-brand-orange transition-all font-serif"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-brand-dark/40 font-bold">E-mail para Confirmação</label>
                      <input 
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full p-4 bg-white border border-brand-dark/5 outline-none focus:border-brand-orange transition-all font-serif"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-brand-dark/40 font-bold">WhatsApp</label>
                      <input 
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full p-4 bg-white border border-brand-dark/5 outline-none focus:border-brand-orange transition-all font-serif"
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-brand-orange text-white py-6 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-dark transition-all shadow-lg flex items-center justify-center gap-4 group disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Finalizar Pedido Solidário <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : !success && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-20 h-20 bg-brand-dark/5 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-8 h-8 text-brand-dark" strokeWidth={1} />
                  </div>
                  <h4 className="text-xl font-serif italic mb-2">Seu carrinho está vazio</h4>
                  <p className="text-sm font-serif max-w-[200px]">Selecione um ou mais itens ao lado para apoiar nossa jornada.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeModal === 'contact' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Entre em Contato</p>
              <h2 className="text-4xl md:text-6xl font-serif text-brand-dark italic">Fale Conosco</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <a 
                href="https://wa.me/5531993615488" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 text-brand-orange" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">WhatsApp</p>
                  <p className="text-xl font-serif text-brand-dark group-hover:text-white">(31) 99361-5488</p>
                </div>
              </a>

              <a 
                href="https://instagram.com/nucleodedanca" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                  <Instagram className="w-6 h-6 text-brand-orange" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">Instagram</p>
                  <p className="text-xl font-serif text-brand-dark group-hover:text-white">@nucleodedanca</p>
                </div>
              </a>

              <a 
                href="mailto:nucleodedanca@yahoo.com.br" 
                className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-brand-orange" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">E-mail</p>
                  <p className="text-base md:text-xl font-serif text-brand-dark group-hover:text-white break-all">nucleodedanca@yahoo.com.br</p>
                </div>
              </a>

              <a 
                href="https://www.google.com/maps/search/?api=1&query=Av.+Abílio+Machado,+3997+–+Belo+Horizonte,+MG" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-brand-orange" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">Endereço</p>
                  <p className="text-sm md:text-base font-serif text-brand-dark group-hover:text-white leading-tight">Av. Abílio Machado, 3997 – BH</p>
                </div>
              </a>
            </div>

            <div className="mt-12 pt-8 border-t border-brand-dark/5 text-center">
              <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-brand-dark/20 italic">
                Danzamerica 2026 • Talentos de Minas • Córdoba, Argentina
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
