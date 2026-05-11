import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Package, 
  Trash2, 
  Plus, 
  Minus,
  Save,
  Loader2,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Ticket
} from 'lucide-react';
import { ReasonModal } from '../../../../components/modals/ReasonModal';
import { motion, AnimatePresence } from 'framer-motion';
import { maskBRL, parseBRL } from '../../../../lib/utils';
import { useHelpItems } from '../../../../hooks/useHelpItems';
import { useDancers } from '../../../../hooks/useDancers';
import { useAdminAuth } from '../../../../hooks/useAdminAuth';
import { supabase } from '../../../../lib/supabase';

interface OrderEditModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, isOpen, onClose, onSave }) => {
  const [updating, setUpdating] = useState(false);
  const { items: helpItems } = useHelpItems();
  const { dancers } = useDancers();
  const { userRole } = useAdminAuth();
  const isMaster = userRole === 'master';
  
  const selectedDancer = dancers.find(d => d.name === order?.dancer_name);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [manualPrice, setManualPrice] = useState(order?.product_price || 0);
  const [isAskingReason, setIsAskingReason] = useState(false);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (order && isOpen) {
      setCustomerName(order.customer_name || '');
      setCustomerPhone(order.customer_phone || '');
      setCustomerEmail(order.customer_email || '');
      setOrderItems(order.items || []);
      setManualPrice(order.product_price || 0);
      setStatus(order.status || 'pending');
    }
  }, [order, isOpen]);

  const updateItemQuantity = (id: string, delta: number) => {
    const newItems = orderItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) };
      }
      return item;
    });
    setOrderItems(newItems);
    syncTotal(newItems);
  };

  const syncTotal = (items: any[]) => {
    const total = items.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || 1)), 0);
    setManualPrice(total);
  };

  const handleItemPriceChange = (idx: number, newPrice: number) => {
    const newItems = [...orderItems];
    newItems[idx].price = newPrice;
    setOrderItems(newItems);
    syncTotal(newItems);
  };

  const handleItemCostChange = (idx: number, newCost: number) => {
    const newItems = [...orderItems];
    newItems[idx].cost_price = newCost;
    setOrderItems(newItems);
  };

  const toggleQuickAdd = (item: any) => {
    const exists = orderItems.find(i => i.id === item.id);
    let newItems;
    if (exists) {
      newItems = orderItems.filter(i => i.id !== item.id);
    } else {
      newItems = [...orderItems, { 
        id: item.id, 
        name: item.title, 
        price: item.price, 
        cost_price: item.cost_price || 0,
        quantity: 1,
        image_url: item.image_url 
      }];
    }
    setOrderItems(newItems);
    syncTotal(newItems);
  };

  const handleSave = async () => {
    if (status === 'cancelled' && order.status !== 'cancelled') {
      setIsAskingReason(true);
      return;
    }

    await performSave('');
  };

  const handleResendEmail = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const isRaffle = order.type === 'raffle';
      const payload: any = {
        type: isRaffle ? 'raffle_order' : 'new_order',
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        total_price: manualPrice,
        order_id: order.id,
      };

      if (isRaffle) {
        payload.campaign_name = order.product_name?.replace('Rifa: ', '');
        payload.campaign_id = order.campaign_id;
        payload.dancer_name = order.dancer_name;
        payload.selected_numbers = order.selected_numbers;
      } else {
        payload.items = orderItems;
      }

      const { data, error } = await supabase.functions.invoke('send-order', {
        body: payload
      });

      if (error) throw error;
      onAlert('E-mail Enviado', 'A notificação foi reenviada com sucesso.', 'info');
    } catch (err: any) {
      onAlert('Erro ao Enviar', 'Falha ao reenviar e-mail: ' + err.message, 'danger');
    } finally {
      setUpdating(false);
    }
  };

  const performSave = async (reason: string) => {
    setUpdating(true);
    
    const payload: any = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      status: status,
      reason: reason,
      total_price: manualPrice
    };

    // Only update items and product_name for store orders
    if (order?.type !== 'raffle') {
      const itemsText = orderItems.map(item => `${item.quantity || 1}x ${item.name}`).join(', ');
      payload.product_name = itemsText;
      payload.product_price = manualPrice;
      payload.items = orderItems;
    }

    await onSave(payload);
    setUpdating(false);
  };

  const statusSteps = [
    { id: 'pending', label: 'Pendente', icon: Clock, color: 'text-yellow-500' },
    { id: 'paid', label: 'Pago', icon: CheckCircle2, color: 'text-green-500' },
    { id: 'sent', label: 'Enviado', icon: Truck, color: 'text-blue-500' }
  ];

  const currentStepIdx = statusSteps.findIndex(s => s.id === status);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/90 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-container relative w-full max-w-6xl"
          >
            {/* Top Accent Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-brand-orange/0 via-brand-orange to-brand-orange/0" />

            {/* Header Area */}
            <div className="modal-header">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center border border-brand-orange/30 rotate-3 group-hover:rotate-0 transition-transform">
                    <ShoppingCart className="w-8 h-8 text-brand-orange" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    #{order?.id?.split('-')[0].toUpperCase()}
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-serif text-brand-dark italic leading-tight">Gestão de Pedido</h2>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-brand-orange font-bold mt-1">Administrative Suite</p>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full border border-black/5">
                {statusSteps.map((step, idx) => {
                  const isActive = idx <= currentStepIdx;
                  const isCurrent = step.id === status;
                  return (
                    <button 
                      key={step.id}
                      onClick={() => setStatus(step.id)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all ${isCurrent ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : isActive ? 'text-brand-dark/60 hover:bg-black/5' : 'text-brand-dark/20'}`}
                    >
                      <step.icon className={`w-4 h-4 ${isCurrent ? 'text-white' : isActive ? step.color : ''}`} />
                      <span className="text-[10px] uppercase tracking-[0.15em] font-black hidden lg:inline">{step.label}</span>
                    </button>
                  );
                })}
              </div>

              <button onClick={onClose} className="p-3 hover:bg-black/5 rounded-full transition-all group">
                <X className="w-6 h-6 text-brand-dark/20 group-hover:text-brand-orange group-hover:rotate-90 transition-all" />
              </button>
            </div>

            <div className="modal-content">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Panel Switching based on Order Type */}
                {order?.type === 'raffle' ? (
                  <div className="lg:col-span-12 p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Customer Info */}
                      <div className="space-y-4 bg-black/[0.01] p-6 rounded-2xl border border-black/5">
                        <h3 className="text-[9px] uppercase tracking-widest font-black text-brand-orange flex items-center gap-2">
                          <User className="w-3.5 h-3.5" /> Detalhes do Apoiador
                        </h3>
                        <div className="space-y-6">
                          <div className="relative group">
                            <label className="absolute -top-2 left-4 bg-white px-2 text-[7px] uppercase tracking-[0.2em] text-brand-orange font-black z-10">Nome Completo *</label>
                            <input 
                              type="text"
                              required
                              placeholder="Nome"
                              value={customerName} 
                              onChange={e => setCustomerName(e.target.value)} 
                              className="w-full bg-white border border-black/10 px-4 py-3 text-brand-dark text-sm outline-none focus:border-brand-orange rounded-xl placeholder:text-brand-dark/10 transition-all shadow-sm focus:shadow-md" 
                            />
                          </div>
                          <div className="relative group">
                            <label className="absolute -top-2 left-4 bg-white px-2 text-[7px] uppercase tracking-[0.2em] text-brand-orange font-black z-10">WhatsApp *</label>
                            <input 
                              type="tel"
                              required
                              placeholder="(00) 00000-0000"
                              value={customerPhone} 
                              onChange={e => setCustomerPhone(e.target.value)} 
                              className="w-full bg-white border border-black/10 px-4 py-3 text-brand-dark text-sm outline-none focus:border-brand-orange rounded-xl placeholder:text-brand-dark/10 transition-all shadow-sm focus:shadow-md" 
                            />
                          </div>
                          <div className="relative group">
                            <label className="absolute -top-2 left-4 bg-white px-2 text-[7px] uppercase tracking-[0.2em] text-brand-orange font-black z-10">E-mail *</label>
                            <input 
                              type="email"
                              required
                              placeholder="seu@email.com"
                              value={customerEmail} 
                              onChange={e => setCustomerEmail(e.target.value)} 
                              className="w-full bg-white border border-black/10 px-4 py-3 text-brand-dark text-sm outline-none focus:border-brand-orange rounded-xl placeholder:text-brand-dark/10 transition-all shadow-sm focus:shadow-md" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Raffle Info */}
                      <div className="space-y-4 bg-brand-orange/5 p-6 rounded-2xl border border-brand-orange/10">
                        <h3 className="text-[9px] uppercase tracking-widest font-black text-brand-orange flex items-center gap-2">
                          <Ticket className="w-3.5 h-3.5" /> Detalhes da Ação
                        </h3>
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row items-center p-4 bg-white border border-brand-orange/5 rounded-xl gap-4 shadow-sm">
                            {selectedDancer?.photo_url ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-black/5 shrink-0">
                                <img src={selectedDancer.photo_url} alt={selectedDancer.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                                <User className="w-6 h-6 text-brand-dark/10" />
                              </div>
                            )}
                            <div className="flex-1 text-center sm:text-left">
                              <span className="text-[8px] text-brand-dark/40 uppercase tracking-[0.2em] font-black block mb-1">Bailarino Apoiado:</span>
                              <span className="text-xl text-brand-dark font-serif italic">{order.dancer_name || 'Geral'}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-[8px] text-brand-dark/40 uppercase tracking-[0.2em] font-black block ml-1">Números Reservados:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(order.selected_numbers || []).map((n: number) => (
                                <span key={n} className="px-3 py-1.5 bg-brand-orange text-white rounded-lg text-xs font-mono font-bold shadow-sm">#{n}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Left Panel: Customer & Tools (4 cols) */}
                    <div className="lg:col-span-4 p-8 border-r border-black/5 space-y-10 bg-black/[0.01]">
                      <section>
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-orange mb-8 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" />
                          Dados do Comprador
                        </h3>
                        <div className="space-y-6">
                          <div className="relative group">
                            <label className="absolute -top-2 left-3 bg-white px-2 text-[8px] uppercase tracking-widest text-brand-orange font-bold z-10">Nome Completo *</label>
                            <input 
                              type="text"
                              required
                              value={customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              className="w-full bg-black/[0.03] border border-black/5 px-4 py-4 text-brand-dark text-sm outline-none focus:border-brand-orange focus:bg-white transition-all font-serif italic rounded-xl"
                            />
                          </div>
                          <div className="relative group">
                            <label className="absolute -top-2 left-4 bg-white px-2 text-[8px] uppercase tracking-[0.2em] text-brand-orange font-black z-10">WhatsApp *</label>
                            <div className="flex items-center">
                               <Phone className="absolute left-5 w-4 h-4 text-brand-dark/20 group-focus-within:text-brand-orange transition-colors" />
                               <input 
                                 type="tel"
                                 required
                                 value={customerPhone}
                                 onChange={e => setCustomerPhone(e.target.value)}
                                 className="w-full bg-white border border-black/10 pl-14 pr-5 py-5 text-brand-dark text-xs outline-none focus:border-brand-orange transition-all font-mono rounded-2xl shadow-sm focus:shadow-md"
                               />
                            </div>
                          </div>
                          <div className="relative group">
                            <label className="absolute -top-2 left-4 bg-white px-2 text-[8px] uppercase tracking-[0.2em] text-brand-orange font-black z-10">E-mail *</label>
                            <div className="flex items-center">
                               <Mail className="absolute left-5 w-4 h-4 text-brand-dark/20 group-focus-within:text-brand-orange transition-colors" />
                               <input 
                                 type="email"
                                 required
                                 value={customerEmail}
                                 onChange={e => setCustomerEmail(e.target.value)}
                                 className="w-full bg-white border border-black/10 pl-14 pr-5 py-5 text-brand-dark text-xs outline-none focus:border-brand-orange transition-all font-mono rounded-2xl shadow-sm focus:shadow-md"
                               />
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-dark/40 mb-6 flex items-center gap-3">
                          <Package className="w-4 h-4" /> Catálogo Rápido
                        </h3>
                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                          {(helpItems || []).map(item => {
                            const isSelected = orderItems.find(i => i.id === item.id);
                            return (
                              <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                key={item.id}
                                onClick={() => toggleQuickAdd(item)}
                                className={`flex items-center gap-4 p-3 rounded-xl border transition-all text-left group ${isSelected ? 'bg-brand-orange/10 border-brand-orange/30 shadow-[0_0_20px_rgba(180,48,64,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                              >
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/5 flex-shrink-0">
                                   <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[10px] uppercase tracking-widest font-bold truncate ${isSelected ? 'text-brand-orange' : 'text-brand-dark/60'}`}>{item.title}</p>
                                  <p className="text-[10px] text-brand-dark/20 font-mono mt-0.5">{maskBRL(item.price)}</p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-brand-orange border-brand-orange' : 'border-black/10 group-hover:border-brand-orange/50'}`}>
                                   <Plus className={`w-3 h-3 ${isSelected ? 'text-white rotate-45' : 'text-brand-dark/20 group-hover:text-brand-orange'}`} />
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </section>
                    </div>

                    {/* Right Panel: Items List (8 cols) */}
                    <div className="lg:col-span-8 p-8 md:p-12 space-y-10">
                      <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
                          <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-orange flex items-center gap-3">
                             <div className="w-8 h-[1px] bg-brand-orange/30" />
                             Itens do Carrinho
                          </h3>
                          <p className="text-[10px] text-brand-dark/20 font-mono italic">Total de {orderItems.length} tipos de itens</p>
                        </div>

                        <div className="space-y-6">
                          <AnimatePresence mode="popLayout">
                            {orderItems.map((item, idx) => {
                              // Find original product for image if missing in item JSON
                              const originalProduct = helpItems.find(h => h.id === item.id);
                              const imageUrl = item.image_url || originalProduct?.image_url;

                              return (
                                <motion.div 
                                  layout
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  key={item.id || idx} 
                                  className="group relative bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 hover:border-brand-orange/20 p-4 sm:p-6 rounded-2xl transition-all flex flex-col sm:flex-row gap-6 sm:gap-8 items-center"
                                >
                                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                     <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                  </div>

                                  <div className="flex-1 space-y-4 w-full">
                                    <div className="flex justify-between items-start">
                                      <input 
                                        type="text"
                                        required
                                        value={item.name}
                                        onChange={e => {
                                          const newItems = [...orderItems];
                                          newItems[idx].name = e.target.value;
                                          setOrderItems(newItems);
                                        }}
                                        className="bg-transparent border-b border-black/5 py-1 text-sm text-brand-dark outline-none focus:border-brand-orange font-serif italic flex-1"
                                        placeholder="Nome do Item"
                                      />
                                      <button 
                                        onClick={() => {
                                          const newItems = orderItems.filter((_, i) => i !== idx);
                                          setOrderItems(newItems);
                                          syncTotal(newItems);
                                        }}
                                        className="ml-4 p-2 text-brand-dark/10 hover:text-red-500 transition-colors bg-black/5 rounded-lg opacity-100 group-hover:opacity-100 sm:opacity-0"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center justify-between gap-6">
                                      <div className="flex items-center gap-4 bg-black/5 p-1.5 rounded-full border border-black/5 shadow-inner">
                                        <button onClick={() => updateItemQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-brand-orange/20 hover:text-brand-orange rounded-full transition-all shadow-sm">
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-sm font-bold text-brand-dark min-w-[30px] text-center">{item.quantity || 1}</span>
                                        <button onClick={() => updateItemQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-brand-orange/20 hover:text-brand-orange rounded-full transition-all shadow-sm">
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-6">
                                        <div className="text-right">
                                          <p className="text-[8px] uppercase tracking-widest text-white/20 mb-0.5">Preço Unitário</p>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-brand-orange font-bold">R$</span>
                                            <input 
                                              value={maskBRL(item.price).replace('R$', '').trim()}
                                              onChange={e => handleItemPriceChange(idx, parseBRL(e.target.value))}
                                              className="w-20 sm:w-24 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-brand-orange text-right outline-none focus:border-brand-orange font-mono font-bold"
                                            />
                                          </div>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                          <p className="text-[8px] uppercase tracking-widest text-white/20 mb-0.5">Custo Unitário</p>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-white/40 font-bold">R$</span>
                                            <input 
                                              value={maskBRL(item.cost_price || 0).replace('R$', '').trim()}
                                              onChange={e => handleItemCostChange(idx, parseBRL(e.target.value))}
                                              className="w-24 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-white/40 text-right outline-none focus:border-brand-orange font-mono font-bold"
                                            />
                                          </div>
                                        </div>
                                        <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                                        <div className="text-right">
                                           <p className="text-[8px] uppercase tracking-widest text-emerald-500/60 mb-0.5">Subtotal</p>
                                           <p className="text-sm text-emerald-500 font-mono font-bold">{maskBRL(Number(item.price) * (item.quantity || 1))}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>

                          {orderItems.length === 0 && (
                            <div className="text-center py-24 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-3xl">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-white/10" />
                              </div>
                              <h4 className="text-white/40 font-serif italic text-lg">Seu carrinho está vazio</h4>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mt-2">Selecione produtos no catálogo à esquerda</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Compact Footer Summary */}
            <div className="modal-footer !p-4 sm:!p-8">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                
                {/* Financial Summary */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-8">
                  {isMaster && (
                    <>
                      <div className="flex flex-col items-center sm:items-start">
                         <p className="text-[7px] uppercase tracking-widest text-brand-dark/40 mb-1">Automático</p>
                         <p className="text-sm text-brand-dark/60 font-mono">{maskBRL(orderItems.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || 1)), 0))}</p>
                      </div>

                      <div className="h-6 w-[1px] bg-black/5 hidden sm:block" />
                    </>
                  )}

                  <div className="flex flex-col items-center sm:items-start">
                    <p className="text-[7px] uppercase tracking-widest text-brand-orange font-black mb-1">Faturamento</p>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-brand-orange font-bold">R$</span>
                      <input 
                        value={maskBRL(manualPrice).replace('R$', '').trim()}
                        onChange={e => setManualPrice(parseBRL(e.target.value))}
                        className="bg-brand-orange/5 border border-brand-orange/20 pl-8 pr-4 py-2 text-xl text-brand-orange font-bold outline-none focus:border-brand-orange transition-all w-32 text-right rounded-xl shadow-sm focus:shadow-md focus:bg-white"
                      />
                    </div>
                  </div>

                  {isMaster && (
                    <>
                      <div className="h-6 w-[1px] bg-black/5 hidden sm:block" />

                      <div className="flex flex-col items-center sm:items-start">
                         <p className="text-[7px] uppercase tracking-widest text-emerald-500 font-black mb-1">Líquido</p>
                         <p className="text-xl text-emerald-500 font-mono font-bold">
                           {maskBRL(manualPrice - orderItems.reduce((sum, i) => sum + (Number(i.cost_price || 0) * (i.quantity || 1)), 0))}
                         </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <button 
                    onClick={handleResendEmail}
                    disabled={updating}
                    className="flex-1 lg:flex-none px-6 py-3.5 text-[9px] uppercase tracking-[0.1em] font-black bg-red-600 text-white hover:bg-red-700 transition-all border border-red-700 rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/20"
                    title="Re-enviar e-mail de confirmação agora"
                  >
                    {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                    Re-enviar E-mail
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 lg:flex-none px-6 py-3.5 text-[9px] uppercase tracking-[0.1em] font-black text-brand-dark/40 hover:text-brand-dark transition-all border border-black/5 hover:bg-black/5 rounded-xl whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={updating}
                    className="flex-1 lg:flex-none bg-brand-orange px-8 py-3.5 text-[9px] uppercase tracking-[0.1em] font-black text-white hover:bg-brand-dark transition-all rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ReasonModal
        isOpen={isAskingReason}
        title="Justificativa de Cancelamento"
        message="Por favor, descreva o motivo do cancelamento deste pedido. Esta informação será registrada no histórico e poderá ser enviada ao cliente."
        confirmLabel="Confirmar Cancelamento"
        onConfirm={(reason) => {
          setIsAskingReason(false);
          performSave(reason);
        }}
        onCancel={() => setIsAskingReason(false)}
        variant="danger"
      />
    </AnimatePresence>
  );
};
