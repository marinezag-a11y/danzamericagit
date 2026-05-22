import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Check, 
  Minus, 
  Plus, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useHelpItems } from '../../../../hooks/useHelpItems';
import { maskBRL } from '../../../../lib/utils';
import { useSiteSettings } from '../../../../hooks/useSiteSettings';

interface ManualOrderModalProps {
  onClose: () => void;
  onSave: (data: any) => Promise<{ success: boolean; error?: any }>;
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function ManualOrderModal({ onClose, onSave, onAlert }: ManualOrderModalProps) {
  const { items: helpItems } = useHelpItems();
  const { settings } = useSiteSettings();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const itemsText = selectedItems.map(item => `${item.quantity || 1}x ${item.name}`).join(', ');

  const toggleItem = (item: any) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, { 
        id: item.id, 
        name: item.title, 
        price: item.price, 
        cost_price: item.cost_price || 0,
        quantity: 1 
      }];
    });
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) };
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      onAlert('Atenção', 'Selecione pelo menos um item.', 'warning');
      return;
    }
    
    setSaving(true);
    const newOrderId = crypto.randomUUID();
    const orderData = {
      id: newOrderId,
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      product_name: itemsText,
      product_price: totalPrice,
      total_price: totalPrice,
      items: selectedItems,
      status: 'pending'
    };

    const result = await onSave(orderData);
    
    if (result.success) {
      setShowSuccess(true);
      onAlert('Sucesso', 'Pedido manual incluído com sucesso.', 'info');
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      onAlert('Erro ao Incluir', 'Não foi possível incluir o pedido: ' + result.error, 'danger');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-brand-dark/90 backdrop-blur-sm overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-brand-dark rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 relative flex flex-col max-h-[94vh] sm:max-h-[90vh]"
      >
        <div className="p-6 sm:px-12 sm:py-8 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
          <div>
            <p className="text-brand-orange text-[9px] uppercase tracking-[0.5em] font-black mb-3">ADMINISTRAÇÃO DE VENDAS</p>
            <h3 className="text-3xl font-serif italic text-white leading-tight">Incluir Pedido Manual</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all transform hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 sm:p-12 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-black ml-2">DADOS DO CLIENTE</p>
              <div className="space-y-4">
                <input 
                  type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium"
                  placeholder="Nome completo"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium"
                    placeholder="E-mail"
                  />
                  <input 
                    type="text" required value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10 font-medium"
                    placeholder="WhatsApp"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-black ml-2">SELEÇÃO DE ITENS</p>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-3 custom-scrollbar bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                {(helpItems || []).map(item => {
                  const selected = selectedItems.find(i => i.id === item.id);
                  return (
                    <div key={item.id} className={`flex items-center justify-between gap-6 p-4 rounded-2xl transition-all border group ${selected ? 'bg-brand-orange/10 border-brand-orange/30' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}`}>
                      <div 
                        onClick={() => toggleItem(item)}
                        className="flex items-center gap-4 cursor-pointer flex-1"
                      >
                        <div className={`w-6 h-6 border-2 flex items-center justify-center transition-all rounded-lg ${selected ? 'bg-brand-orange border-brand-orange' : 'border-white/10 group-hover:border-white/20'}`}>
                          {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[11px] uppercase tracking-widest font-black ${selected ? 'text-white' : 'text-white/40'}`}>{item.title}</span>
                          <span className="text-[10px] text-brand-orange font-mono font-black mt-0.5">{maskBRL(item.price || 0)}</span>
                        </div>
                      </div>
                      {selected && (
                        <div className="flex items-center gap-3 bg-black/40 rounded-xl px-3 py-1.5 border border-white/10">
                          <button type="button" onClick={() => updateItemQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-brand-orange transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[12px] font-black text-brand-orange min-w-[20px] text-center tabular-nums">{selected.quantity || 1}</span>
                          <button type="button" onClick={() => updateItemQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-brand-orange transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedItems.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 border-t border-white/5 flex justify-between items-center px-4"
              >
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/20 font-black mb-1">TOTAL DO PEDIDO</p>
                  <p className="text-3xl font-serif italic text-brand-orange tabular-nums">{maskBRL(totalPrice)}</p>
                </div>
                <div className="flex flex-col items-end opacity-20">
                   <p className="text-[8px] uppercase tracking-widest font-black text-white">{selectedItems.length} ITENS</p>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="p-6 sm:px-12 sm:py-8 border-t border-white/10 bg-white/[0.02]">
            <button 
              type="submit"
              disabled={saving || showSuccess}
              className={`w-full py-7 font-black uppercase tracking-[0.4em] text-[11px] transition-all flex items-center justify-center gap-3 rounded-[2rem] shadow-2xl active:scale-95 disabled:opacity-50 ${showSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-brand-orange text-white hover:bg-brand-dark'}`}
            >
              {saving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : showSuccess ? (
                <>
                  <CheckCircle2 className="w-6 h-6" /> PEDIDO REGISTRADO!
                </>
              ) : (
                'SALVAR REGISTRO'
              )}
            </button>
            <p className="text-center text-[8px] uppercase tracking-widest font-black text-white/10 mt-6 italic">
              O CLIENTE RECEBERÁ O E-MAIL PREMIUM APENAS QUANDO O STATUS FOR ALTERADO PARA PAGO
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
