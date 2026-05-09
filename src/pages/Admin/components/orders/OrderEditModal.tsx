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
  AlertCircle
} from 'lucide-react';
import { ReasonModal } from '../../../../components/modals/ReasonModal';
import { motion, AnimatePresence } from 'framer-motion';
import { maskBRL, parseBRL } from '../../../../lib/utils';
import { useHelpItems } from '../../../../hooks/useHelpItems';

interface OrderEditModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, isOpen, onClose, onSave }) => {
  const [updating, setUpdating] = useState(false);
  const { items: helpItems } = useHelpItems();
  
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

  const performSave = async (reason: string) => {
    setUpdating(true);
    const itemsText = orderItems.map(item => `${item.quantity || 1}x ${item.name}`).join(', ');
    await onSave({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      product_name: itemsText,
      product_price: manualPrice,
      total_price: manualPrice,
      items: orderItems,
      status: status,
      reason: reason
    });
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Top Accent Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-brand-orange/0 via-brand-orange to-brand-orange/0" />

            {/* Header Area */}
            <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-b from-white/5 to-transparent">
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
                  <h2 className="text-2xl font-serif text-white italic leading-tight">Gestão de Pedido</h2>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-1 font-display">Danzamerica Administrative Suite</p>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="flex items-center gap-2 sm:gap-4 bg-white/5 p-2 rounded-full border border-white/5">
                {statusSteps.map((step, idx) => {
                  const isActive = idx <= currentStepIdx;
                  const isCurrent = step.id === status;
                  return (
                    <button 
                      key={step.id}
                      onClick={() => setStatus(step.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isCurrent ? 'bg-brand-orange text-white shadow-lg' : isActive ? 'text-white/80 hover:bg-white/10' : 'text-white/20'}`}
                    >
                      <step.icon className={`w-4 h-4 ${isCurrent ? 'text-white' : isActive ? step.color : ''}`} />
                      <span className="text-[10px] uppercase tracking-widest font-bold hidden lg:inline">{step.label}</span>
                    </button>
                  );
                })}
              </div>

              <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all group">
                <X className="w-6 h-6 text-white/20 group-hover:text-white group-hover:rotate-90 transition-all" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Left Panel: Customer & Tools (4 cols) */}
                <div className="lg:col-span-4 p-8 border-r border-white/5 space-y-10 bg-white/[0.02]">
                  <section>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-orange mb-8 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" />
                      Dados do Comprador
                    </h3>
                    <div className="space-y-6">
                      <div className="relative group">
                        <label className="absolute -top-2 left-3 bg-[#0a0a0a] px-2 text-[8px] uppercase tracking-widest text-white/40 font-bold z-10">Nome Completo</label>
                        <input 
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 px-4 py-4 text-white text-sm outline-none focus:border-brand-orange focus:bg-brand-orange/5 transition-all font-serif italic rounded-xl"
                        />
                      </div>
                      <div className="relative group">
                        <label className="absolute -top-2 left-3 bg-[#0a0a0a] px-2 text-[8px] uppercase tracking-widest text-white/40 font-bold z-10">Telefone para Contato</label>
                        <div className="flex items-center">
                           <Phone className="absolute left-4 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                           <input 
                             value={customerPhone}
                             onChange={e => setCustomerPhone(e.target.value)}
                             className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 text-white text-xs outline-none focus:border-brand-orange transition-all font-mono rounded-xl"
                           />
                        </div>
                      </div>
                      <div className="relative group">
                        <label className="absolute -top-2 left-3 bg-[#0a0a0a] px-2 text-[8px] uppercase tracking-widest text-white/40 font-bold z-10">Endereço de E-mail</label>
                        <div className="flex items-center">
                           <Mail className="absolute left-4 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                           <input 
                             value={customerEmail}
                             onChange={e => setCustomerEmail(e.target.value)}
                             className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 text-white text-xs outline-none focus:border-brand-orange transition-all font-mono rounded-xl"
                           />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-6 flex items-center gap-3">
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
                              <p className={`text-[10px] uppercase tracking-widest font-bold truncate ${isSelected ? 'text-brand-orange' : 'text-white/60'}`}>{item.title}</p>
                              <p className="text-[10px] text-white/20 font-mono mt-0.5">{maskBRL(item.price)}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-brand-orange border-brand-orange' : 'border-white/10 group-hover:border-brand-orange/50'}`}>
                               <Plus className={`w-3 h-3 ${isSelected ? 'text-white rotate-45' : 'text-white/20 group-hover:text-brand-orange'}`} />
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
                    <div className="flex justify-between items-end mb-10">
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-orange flex items-center gap-3">
                         <div className="w-8 h-[1px] bg-brand-orange/30" />
                         Itens do Carrinho Estratificado
                      </h3>
                      <p className="text-[10px] text-white/20 font-mono italic">Total de {orderItems.length} tipos de itens</p>
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
                              className="group relative bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 hover:border-brand-orange/20 p-6 rounded-2xl transition-all flex flex-col sm:flex-row gap-8 items-center"
                            >
                              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                 <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              </div>

                              <div className="flex-1 space-y-4 w-full">
                                <div className="flex justify-between items-start">
                                  <input 
                                    value={item.name}
                                    onChange={e => {
                                      const newItems = [...orderItems];
                                      newItems[idx].name = e.target.value;
                                      setOrderItems(newItems);
                                    }}
                                    className="bg-transparent border-b border-white/5 py-1 text-sm text-white outline-none focus:border-brand-orange font-serif italic flex-1"
                                    placeholder="Nome do Item"
                                  />
                                  <button 
                                    onClick={() => {
                                      const newItems = orderItems.filter((_, i) => i !== idx);
                                      setOrderItems(newItems);
                                      syncTotal(newItems);
                                    }}
                                    className="ml-4 p-2 text-white/10 hover:text-red-500 transition-colors bg-white/5 rounded-lg opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-between gap-6">
                                  <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-full border border-white/5 shadow-inner">
                                    <button onClick={() => updateItemQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-brand-orange/20 hover:text-brand-orange rounded-full transition-all">
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm font-bold text-white min-w-[30px] text-center">{item.quantity || 1}</span>
                                    <button onClick={() => updateItemQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-brand-orange/20 hover:text-brand-orange rounded-full transition-all">
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
                                          className="w-24 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-brand-orange text-right outline-none focus:border-brand-orange font-mono font-bold"
                                        />
                                      </div>
                                    </div>
                                    <div className="text-right">
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
                                    <div className="h-8 w-[1px] bg-white/10" />
                                    <div className="text-right">
                                       <p className="text-[8px] uppercase tracking-widest text-emerald-500/60 mb-0.5">Margem Total</p>
                                       <p className="text-sm text-emerald-500 font-mono font-bold">{maskBRL((Number(item.price) - Number(item.cost_price || 0)) * (item.quantity || 1))}</p>
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
                          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingCart className="w-10 h-10 text-white/10" />
                          </div>
                          <h4 className="text-white/40 font-serif italic text-lg">Seu carrinho está vazio</h4>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mt-2">Selecione produtos no catálogo à esquerda</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Footer Summary */}
            <div className="p-8 md:p-10 bg-[#0c0c0c] border-t border-white/10 flex flex-col lg:flex-row gap-8 items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              
              <div className="flex flex-col sm:flex-row gap-10 items-center w-full lg:w-auto">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/20">
                     <AlertCircle className="w-3 h-3" />
                     <span className="text-[8px] uppercase tracking-widest font-bold">Resumo Financeiro Final</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center sm:text-left">
                       <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Cálculo Automático</p>
                       <p className="text-xl text-white/60 font-mono">{maskBRL(orderItems.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || 1)), 0))}</p>
                    </div>
                    <div className="w-8 h-[1px] bg-white/10 hidden sm:block" />
                    <div className="relative group">
                      <p className="text-[8px] uppercase tracking-widest text-brand-orange font-bold mb-1 ml-1">Valor do Faturamento</p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-brand-orange font-bold">R$</span>
                        <input 
                          value={maskBRL(manualPrice).replace('R$', '').trim()}
                          onChange={e => setManualPrice(parseBRL(e.target.value))}
                          className="bg-brand-orange/10 border border-brand-orange/40 pl-10 pr-6 py-4 text-3xl text-brand-orange font-bold outline-none focus:border-brand-orange transition-all w-56 text-right rounded-2xl shadow-[0_0_40px_rgba(180,48,64,0.1)] group-hover:shadow-[0_0_60px_rgba(180,48,64,0.2)]"
                        />
                      </div>
                    </div>
                    <div className="w-8 h-[1px] bg-white/10 hidden sm:block" />
                    <div className="text-center sm:text-left">
                       <p className="text-[8px] uppercase tracking-widest text-emerald-500 font-bold mb-1">Resultado Líquido</p>
                       <p className="text-3xl text-emerald-500 font-mono font-bold">
                         {maskBRL(manualPrice - orderItems.reduce((sum, i) => sum + (Number(i.cost_price || 0) * (i.quantity || 1)), 0))}
                       </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 w-full lg:w-auto">
                <button 
                  onClick={onClose}
                  className="flex-1 lg:flex-none px-10 py-5 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-all border border-white/5 hover:bg-white/5 rounded-2xl"
                >
                  Cancelar Edição
                </button>
                <button 
                  onClick={handleSave}
                  disabled={updating}
                  className="flex-1 lg:flex-none bg-brand-orange px-12 py-5 text-[10px] uppercase tracking-widest font-bold text-white hover:bg-white hover:text-brand-dark transition-all rounded-2xl flex items-center justify-center gap-4 shadow-[0_10px_30px_rgba(180,48,64,0.3)] hover:shadow-white/10 hover:-translate-y-1 active:translate-y-0"
                >
                  {updating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Confirmar e Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
