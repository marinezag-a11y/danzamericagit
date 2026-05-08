import React, { useState } from 'react';
import { 
  Loader2, 
  Pencil, 
  Trash2, 
  Check, 
  Minus,
  Plus
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useHelpItems } from '../../../../hooks/useHelpItems';
import { maskBRL, parseBRL } from '../../../../lib/utils';

interface OrderRowProps {
  order: any;
  onUpdate: (id: string, data: any) => Promise<{ success: boolean; error?: any }>;
  onDelete: () => void;
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order, onUpdate, onDelete, onAlert }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const { items: helpItems } = useHelpItems();
  const [customerName, setCustomerName] = useState(order?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(order?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState(order?.customer_email || '');
  const [orderItems, setOrderItems] = useState<any[]>(order?.items || []);
  const [status, setStatus] = useState(order?.status || 'pending');
  const [manualPrice, setManualPrice] = useState(order?.product_price || 0);

  const totalPrice = orderItems.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  const itemsText = orderItems.map(item => `${item.quantity || 1}x ${item.name}`).join(', ');

  const handleSave = async () => {
    setUpdating(true);
    const result = await onUpdate(order.id, {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      product_name: itemsText,
      product_price: manualPrice,
      total_price: manualPrice,
      items: orderItems,
      status: status
    });
    
    if (result.success) {
      if (status !== order.status) {
        try {
          await supabase.functions.invoke('send-order', {
            body: {
              type: 'status_update',
              order_id: order.id,
              customer_name: customerName,
              customer_email: customerEmail,
              new_status: status
            }
          });
        } catch (err) {
          console.error('Erro ao enviar e-mail de status:', err);
        }
      }
      setIsEditing(false);
      onAlert('Sucesso', 'Pedido atualizado.', 'info');
    } else {
      onAlert('Erro ao atualizar pedido', result.error, 'danger');
    }
    setUpdating(false);
  };

  const statusColors = {
    pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    paid: 'text-green-500 bg-green-500/10 border-green-500/20',
    sent: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    cancelled: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  const toggleItem = (item: any) => {
    setOrderItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      const newItems = exists ? prev.filter(i => i.id !== item.id) : [...prev, { id: item.id, name: item.title, price: item.price, quantity: 1 }];
      
      // Update manual price automatically when items change
      const newTotal = newItems.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || 1)), 0);
      setManualPrice(newTotal);
      
      return newItems;
    });
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setOrderItems(prev => {
      const newItems = prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });

      // Update manual price automatically when quantity changes
      const newTotal = newItems.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || 1)), 0);
      setManualPrice(newTotal);

      return newItems;
    });
  };

  return (
    <tr className="group hover:bg-white/5 transition-colors">
      <td className="py-6 px-6 text-sm text-white/60 font-sans">
        <div className="flex flex-col">
          <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
          <span className="text-[10px] opacity-40 font-mono">
            {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </td>
      <td className="py-6 px-6">
        {isEditing ? (
          <div className="space-y-2">
            <input 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)}
              className="bg-black/50 border border-white/10 p-1 text-sm text-white w-full outline-none focus:border-brand-orange"
            />
            <input 
              value={customerPhone} 
              onChange={e => setCustomerPhone(e.target.value)}
              className="bg-black/50 border border-white/10 p-1 text-[10px] text-white/60 w-full outline-none focus:border-brand-orange"
            />
            <input 
              value={customerEmail} 
              onChange={e => setCustomerEmail(e.target.value)}
              className="bg-black/50 border border-white/10 p-1 text-[10px] text-brand-orange/60 w-full outline-none focus:border-brand-orange"
            />
          </div>
        ) : (
          <>
            <p className="text-white font-bold text-sm mb-1">{order.customer_name}</p>
            <p className="text-[10px] text-white/40 font-mono tracking-wider mb-1">{order.customer_phone}</p>
            <p className="text-[10px] text-brand-orange/60 font-mono tracking-wider">{order.customer_email}</p>
          </>
        )}
      </td>
      <td className="py-6 px-6 text-sm text-white/80 font-serif italic">
        {isEditing ? (
          <div className="space-y-4">
            {/* Selected Items (Editable) */}
            <div className="space-y-2 border-b border-white/10 pb-4 mb-4">
              <p className="text-[8px] uppercase tracking-widest text-brand-orange font-bold mb-2">Itens do Pedido</p>
              {orderItems.map((item, idx) => (
                <div key={idx} className="bg-black/30 p-2 rounded-sm border border-white/5 space-y-2">
                  <div className="flex gap-2">
                    <input 
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...orderItems];
                        newItems[idx].name = e.target.value;
                        setOrderItems(newItems);
                      }}
                      className="flex-1 bg-transparent border-b border-white/10 text-[10px] text-white outline-none focus:border-brand-orange"
                      placeholder="Nome do Item"
                    />
                    <button 
                      onClick={() => {
                        const newItems = orderItems.filter((_, i) => i !== idx);
                        setOrderItems(newItems);
                        const newTotal = newItems.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || 1)), 0);
                        setManualPrice(newTotal);
                      }}
                      className="text-white/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateItemQuantity(item.id, -1)} className="p-1 bg-white/5 hover:bg-white/10 rounded-sm">
                        <Minus className="w-2 h-2 text-white/40" />
                      </button>
                      <span className="text-[10px] font-bold text-brand-orange min-w-[20px] text-center">{item.quantity || 1}</span>
                      <button onClick={() => updateItemQuantity(item.id, 1)} className="p-1 bg-white/5 hover:bg-white/10 rounded-sm">
                        <Plus className="w-2 h-2 text-white/40" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-white/20">R$</span>
                      <input 
                        value={maskBRL(item.price).replace('R$', '').trim()}
                        onChange={(e) => {
                          const newItems = [...orderItems];
                          newItems[idx].price = parseBRL(e.target.value);
                          setOrderItems(newItems);
                          const newTotal = newItems.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || 1)), 0);
                          setManualPrice(newTotal);
                        }}
                        className="w-20 bg-transparent border-b border-white/10 text-[10px] text-brand-orange text-right outline-none focus:border-brand-orange font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {orderItems.length === 0 && (
                <p className="text-[10px] text-white/20 italic">Nenhum item selecionado.</p>
              )}
            </div>

            {/* Quick Add List */}
            <div className="space-y-2">
              <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold mb-2">Adicionar Produtos Rápidos</p>
              <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                {(helpItems || []).map(item => {
                  const isSelected = orderItems.find(i => i.id === item.id);
                  return (
                    <button 
                      key={item.id}
                      onClick={() => toggleItem(item)}
                      className={`w-full flex items-center justify-between p-2 rounded-sm border transition-all text-[10px] uppercase tracking-widest font-bold ${isSelected ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                      <span>{item.title}</span>
                      <span className="opacity-60">{maskBRL(item.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {orderItems && orderItems.length > 0 ? (
              orderItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] bg-brand-orange/10 text-brand-orange px-1 rounded-sm font-bold not-italic">{item.quantity || 1}x</span>
                  <span>{item.name}</span>
                </div>
              ))
            ) : (
              order.product_name
            )}
          </div>
        )}
      </td>
      <td className="py-6 px-6 text-sm font-display text-brand-orange">
        {isEditing ? (
          <input 
            type="text"
            value={maskBRL(manualPrice)}
            onChange={e => setManualPrice(parseBRL(e.target.value))}
            className="w-full bg-black/50 border border-white/10 p-1 text-sm text-brand-orange font-bold outline-none focus:border-brand-orange"
          />
        ) : (
          maskBRL(order.product_price)
        )}
      </td>
      <td className="py-6 px-6">
        <select 
          value={status}
          onChange={async (e) => {
            const newStatus = e.target.value;
            setStatus(newStatus);
            if (!isEditing) {
              setUpdating(true);
              const result = await onUpdate(order.id, { status: newStatus });
              if (result.success) {
                try {
                  await supabase.functions.invoke('send-order', {
                    body: {
                      type: 'status_update',
                      order_id: order.id,
                      customer_name: order.customer_name,
                      customer_email: order.customer_email,
                      new_status: newStatus
                    }
                  });
                } catch (err) {
                  console.error('Erro ao enviar e-mail de status:', err);
                }
                onAlert('Status Atualizado', 'Notificação enviada ao cliente.', 'info');
              } else {
                onAlert('Erro ao atualizar status', result.error, 'danger');
              }
              setUpdating(false);
            }
          }}
          disabled={updating}
          className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm outline-none cursor-pointer transition-all ${statusColors[status as keyof typeof statusColors]} border bg-black/40 shadow-lg`}
        >
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="sent">Enviado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </td>
      <td className="py-6 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <button 
              onClick={handleSave}
              disabled={updating}
              className="p-2 text-green-500 hover:bg-green-500/10 transition-colors rounded-sm"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-white/20 hover:text-brand-orange transition-colors rounded-sm"
              title="Editar pedido"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-2 text-white/20 hover:text-red-500 transition-colors rounded-sm"
            title="Excluir pedido"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
