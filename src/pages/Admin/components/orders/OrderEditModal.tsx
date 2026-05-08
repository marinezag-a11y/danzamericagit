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
  ShoppingCart
} from 'lucide-react';
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
  const [manualPrice, setManualPrice] = useState(0);
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

  const toggleQuickAdd = (item: any) => {
    const exists = orderItems.find(i => i.id === item.id);
    let newItems;
    if (exists) {
      newItems = orderItems.filter(i => i.id !== item.id);
    } else {
      newItems = [...orderItems, { id: item.id, name: item.title, price: item.price, quantity: 1 }];
    }
    setOrderItems(newItems);
    syncTotal(newItems);
  };

  const handleSave = async () => {
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
      status: status
    });
    setUpdating(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-brand-dark border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20">
                  <ShoppingCart className="w-6 h-6 text-brand-orange" />
                </div>
                <div>
                  <h2 className="text-xl font-serif text-white italic">Detalhes do Pedido</h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">ID: {order?.id?.split('-')[0]}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-white/40" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Left: Customer Info */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-orange mb-6 flex items-center gap-2">
                      <User className="w-3 h-3" /> Informações do Cliente
                    </h3>
                    <div className="space-y-4">
                      <div className="group">
                        <label className="block text-[8px] uppercase tracking-widest text-white/20 mb-1 ml-1 group-focus-within:text-brand-orange transition-colors">Nome Completo</label>
                        <div className="relative">
                          <input 
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-brand-orange transition-all font-serif italic"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="group">
                          <label className="block text-[8px] uppercase tracking-widest text-white/20 mb-1 ml-1 group-focus-within:text-brand-orange transition-colors">Telefone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                            <input 
                              value={customerPhone}
                              onChange={e => setCustomerPhone(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-white text-xs outline-none focus:border-brand-orange transition-all font-mono"
                            />
                          </div>
                        </div>
                        <div className="group">
                          <label className="block text-[8px] uppercase tracking-widest text-white/20 mb-1 ml-1 group-focus-within:text-brand-orange transition-colors">E-mail</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                            <input 
                              value={customerEmail}
                              onChange={e => setCustomerEmail(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-white text-xs outline-none focus:border-brand-orange transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-6 flex items-center gap-2">
                      <Package className="w-3 h-3" /> Adição Rápida
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {(helpItems || []).map(item => {
                        const isSelected = orderItems.find(i => i.id === item.id);
                        return (
                          <button 
                            key={item.id}
                            onClick={() => toggleQuickAdd(item)}
                            className={`flex items-center justify-between p-3 rounded-sm border transition-all text-[10px] uppercase tracking-widest font-bold ${isSelected ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                          >
                            <span>{item.title}</span>
                            <span className="opacity-60">{maskBRL(item.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Order Items */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-orange mb-6 flex items-center gap-2">
                      <ShoppingCart className="w-3 h-3" /> Itens Estratificados
                    </h3>
                    <div className="space-y-3">
                      {orderItems.map((item, idx) => (
                        <motion.div 
                          layout
                          key={idx} 
                          className="bg-white/5 border border-white/10 p-4 rounded-sm space-y-3 relative overflow-hidden"
                        >
                          <div className="flex gap-4">
                            <input 
                              value={item.name}
                              onChange={e => {
                                const newItems = [...orderItems];
                                newItems[idx].name = e.target.value;
                                setOrderItems(newItems);
                              }}
                              className="flex-1 bg-transparent border-b border-white/10 py-1 text-xs text-white outline-none focus:border-brand-orange font-bold uppercase tracking-widest"
                            />
                            <button 
                              onClick={() => {
                                const newItems = orderItems.filter((_, i) => i !== idx);
                                setOrderItems(newItems);
                                syncTotal(newItems);
                              }}
                              className="text-white/20 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                              <button onClick={() => updateItemQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
                                <Minus className="w-3 h-3 text-white/40" />
                              </button>
                              <span className="text-xs font-bold text-brand-orange min-w-[24px] text-center">{item.quantity || 1}</span>
                              <button onClick={() => updateItemQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
                                <Plus className="w-3 h-3 text-white/40" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/20 font-mono">Unit:</span>
                              <input 
                                value={maskBRL(item.price).replace('R$', '').trim()}
                                onChange={e => handleItemPriceChange(idx, parseBRL(e.target.value))}
                                className="w-24 bg-black/40 border border-white/10 px-2 py-1 text-xs text-brand-orange text-right outline-none focus:border-brand-orange font-mono"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {orderItems.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-sm">
                          <Package className="w-8 h-8 text-white/10 mx-auto mb-3" />
                          <p className="text-xs text-white/20 italic">O pedido está vazio.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row gap-6 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-6 items-center w-full sm:w-auto">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Status do Pagamento</span>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="bg-black/50 border border-white/10 text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm text-brand-orange outline-none focus:border-brand-orange"
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="sent">Enviado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Valor Total Final</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-brand-orange font-bold">R$</span>
                    <input 
                      value={maskBRL(manualPrice).replace('R$', '').trim()}
                      onChange={e => setManualPrice(parseBRL(e.target.value))}
                      className="bg-black/50 border border-brand-orange/30 pl-8 pr-4 py-2 text-lg text-brand-orange font-bold outline-none focus:border-brand-orange transition-all w-40 text-right shadow-[0_0_20px_rgba(180,48,64,0.1)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                <button 
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors border border-white/10 rounded-sm"
                >
                  Descartar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={updating}
                  className="flex-1 sm:flex-none bg-brand-orange px-10 py-4 text-[10px] uppercase tracking-widest font-bold text-white hover:bg-white hover:text-brand-dark transition-all rounded-sm flex items-center justify-center gap-3 group"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
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
