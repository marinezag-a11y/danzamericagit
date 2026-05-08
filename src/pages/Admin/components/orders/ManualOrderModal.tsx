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

interface ManualOrderModalProps {
  onClose: () => void;
  onSave: (data: any) => Promise<{ success: boolean; error?: any }>;
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function ManualOrderModal({ onClose, onSave, onAlert }: ManualOrderModalProps) {
  const { items: helpItems } = useHelpItems();
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
      return [...prev, { id: item.id, name: item.title, price: item.price, quantity: 1 }];
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
    const orderData = {
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
      try {
        await supabase.functions.invoke('send-order', {
          body: orderData
        });
      } catch (err) {
        console.error('Erro ao enviar e-mail do pedido manual:', err);
      }
      setShowSuccess(true);
      onAlert('Sucesso', 'Pedido manual incluído e e-mail enviado.', 'info');
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      onAlert('Erro ao Incluir', 'Não foi possível incluir o pedido: ' + result.error, 'danger');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-dark border border-white/10 p-12 max-w-lg w-full shadow-2xl relative rounded-sm"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <h3 className="text-3xl font-serif text-white mb-8 italic">Incluir Pedido Manual</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">Cliente</label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none"
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">E-mail</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none"
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">WhatsApp</label>
            <input 
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">Itens do Pedido</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-4 border border-white/5">
              {(helpItems || []).map(item => {
                const selected = selectedItems.find(i => i.id === item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-2 hover:bg-white/5 rounded-sm transition-colors group">
                    <div 
                      onClick={() => toggleItem(item)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className={`w-4 h-4 border flex items-center justify-center transition-all ${selected ? 'bg-brand-orange border-brand-orange' : 'border-white/20 group-hover:border-white/40'}`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[11px] uppercase tracking-widest font-bold ${selected ? 'text-white' : 'text-white/40'}`}>{item.title}</span>
                        <span className="text-[10px] text-brand-orange/60 font-mono">{maskBRL(item.price || 0)}</span>
                      </div>
                    </div>
                    {selected && (
                      <div className="flex items-center gap-3 bg-black/40 rounded-full px-3 py-1 border border-white/10">
                        <button type="button" onClick={() => updateItemQuantity(item.id, -1)} className="text-white/40 hover:text-brand-orange transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[11px] font-bold text-brand-orange min-w-[16px] text-center">{selected.quantity || 1}</span>
                        <button type="button" onClick={() => updateItemQuantity(item.id, 1)} className="text-white/40 hover:text-brand-orange transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Total do Pedido</span>
                <span className="text-xl font-display text-brand-orange">{maskBRL(totalPrice)}</span>
              </div>
            )}
          </div>
          
          <button 
            type="submit"
            disabled={saving || showSuccess}
            className={`w-full py-5 font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 rounded-sm shadow-xl ${showSuccess ? 'bg-green-500 text-white' : 'bg-brand-orange text-white hover:bg-brand-dark'}`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : showSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Pedido Incluído!
              </>
            ) : (
              'Salvar Pedido'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
