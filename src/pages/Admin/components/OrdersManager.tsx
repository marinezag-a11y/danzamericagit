import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Plus, 
  Loader2, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  Users,
  Minus
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useHelpOrders } from '../../../hooks/useHelpOrders';
import { useHelpItems } from '../../../hooks/useHelpItems';
import { useProfiles } from '../../../hooks/useProfiles';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { maskBRL, parseBRL } from '../../../lib/utils';

interface OrdersManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function OrdersManager({ onAlert }: OrdersManagerProps) {
  const { orders, loading: loadingOrders, error, updateOrder, addOrder, deleteOrder } = useHelpOrders();
  const { settings, updateSetting, loading: loadingSettings } = useSiteSettings();
  const { profiles } = useProfiles();
  const [savingEmails, setSavingEmails] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && profiles.length > 0) {
        setCurrentUserProfile(profiles.find(p => p.id === user.id));
      }
    };
    fetchUser();
  }, [profiles]);
  
  const stats = {
    total: orders?.length || 0,
    cancelled: (orders || []).filter(o => o?.status === 'cancelled').length,
    paid: (orders || []).filter(o => o?.status === 'paid').length,
    pendingValue: (orders || []).filter(o => o?.status === 'pending').reduce((sum, o) => sum + (o?.product_price || 0), 0),
    totalValue: (orders || []).filter(o => o?.status === 'paid' || o?.status === 'sent').reduce((sum, o) => sum + (o?.product_price || 0), 0)
  };
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'sent' | 'cancelled'>('all');
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredOrders = (orders || []).filter(o => filter === 'all' || o?.status === filter);

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    const order = orders.find(o => o.id === orderToDelete);
    const result = await deleteOrder(orderToDelete);
    if (result.success) {
      if (order) {
        try {
          await supabase.functions.invoke('send-order', {
            body: {
              type: 'order_deletion',
              order_id: orderToDelete,
              customer_name: order.customer_name,
              customer_email: order.customer_email
            }
          });
        } catch (err) {
          console.error('Erro ao enviar e-mail de exclusão:', err);
        }
      }
      onAlert('Pedido Excluído', 'O registro foi removido e o cliente notificado.', 'info');
    } else {
      onAlert('Erro ao Excluir', 'Não foi possível excluir o pedido: ' + result.error, 'danger');
    }
    setDeleting(false);
    setOrderToDelete(null);
  };

  const handleSaveEmails = async (emails: string) => {
    setSavingEmails(true);
    const res = await updateSetting('notification_emails_general', emails);
    if (res.success) {
      onAlert('Configuração Salva', 'Lista de e-mails atualizada.', 'info');
    } else {
      onAlert('Erro ao Salvar', 'Não foi possível atualizar os e-mails.', 'danger');
    }
    setSavingEmails(false);
  };

  if (error) return <div className="py-20 text-center text-red-500 font-sans">Erro ao carregar pedidos: {error}</div>;
  if ((loadingOrders && (!orders || orders.length === 0)) || loadingSettings) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  const currentEmails = settings['notification_emails_general']?.value || '';

  return (
    <div className="space-y-12">
      {/* Configurações de Notificação - Somente para MASTER */}
      {currentUserProfile?.role === 'master' && (
        <div className="bg-white/5 border border-white/10 p-8 rounded-sm space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-brand-orange/10 rounded-sm">
            <Users className="w-5 h-5 text-brand-orange" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-sans italic text-white">Notificações de Pedidos</h4>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">Selecione os administradores ou insira e-mails manualmente para receber alertas</p>
          </div>
          <div className="pb-1 hidden md:block">
             {savingEmails ? (
               <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold px-4 py-4">
                 <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
               </div>
             ) : (
               <div className="flex items-center gap-2 text-green-500/60 text-[10px] uppercase tracking-widest font-bold px-4 py-4">
                 <CheckCircle2 className="w-3 h-3" /> Configuração Ativa
               </div>
             )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Administradores Cadastrados</label>
            <div className="flex flex-wrap gap-3">
              {profiles.map(p => {
                if (!p.email) return null;
                const currentList = currentEmails.split(',').map(e => e.trim()).filter(Boolean);
                const isMaster = p.role === 'master';
                const isSelected = isMaster || currentList.includes(p.email);
                
                return (
                  <button
                    key={p.id}
                    disabled={isMaster}
                    onClick={() => {
                      if (isMaster) return;
                      let newList;
                      if (isSelected) {
                        newList = currentList.filter(e => e !== p.email);
                      } else {
                        newList = [...currentList, p.email];
                      }
                      handleSaveEmails(newList.join(', '));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-sm transition-all text-[10px] uppercase tracking-widest font-bold ${
                      isSelected 
                        ? (isMaster ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange/70 cursor-not-allowed' : 'bg-brand-orange/20 border-brand-orange text-brand-orange')
                        : 'bg-black/50 border-white/10 text-white/40 hover:border-white/20 hover:text-white'
                    }`}
                    title={isMaster ? "Usuários Master sempre recebem notificações" : ""}
                  >
                    <div className={`w-3 h-3 flex items-center justify-center border ${isSelected ? (isMaster ? 'border-brand-orange/50 bg-brand-orange/50' : 'border-brand-orange bg-brand-orange') : 'border-white/20'}`}>
                      {isSelected && <Check className="w-2 h-2 text-white" />}
                    </div>
                    {p.full_name || p.email}
                    {isMaster && <span className="ml-1 text-[8px] opacity-50 font-sans normal-case">(Master)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Lista de E-mails (separados por vírgula)</label>
            <input 
              key={currentEmails}
              type="text"
              defaultValue={currentEmails}
              onBlur={(e) => {
                if (e.target.value !== currentEmails) {
                  handleSaveEmails(e.target.value);
                }
              }}
              className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all font-mono"
              placeholder="admin1@email.com, admin2@email.com"
            />
          </div>
        </div>
      </div>
    )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard icon={<ShoppingBag className="w-5 h-5 text-white/40" />} label="Total de Pedidos" value={stats.total} />
        <StatCard icon={<XCircle className="w-5 h-5 text-red-500" />} label="Cancelados" value={stats.cancelled} valueClass="text-red-500" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Pedidos Pagos" value={stats.paid} />
        <StatCard icon={<Clock className="w-5 h-5 text-yellow-500" />} label="Valor Pendente" value={maskBRL(stats.pendingValue)} valueClass="text-yellow-500" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-white" />} label="Total Arrecadado" value={maskBRL(stats.totalValue)} bgClass="bg-brand-orange border-brand-orange" labelClass="text-white/80" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-12">
        <div>
          <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Gestão Financeira</p>
          <h2 className="text-4xl font-serif text-white italic">Controle de Pedidos</h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 border border-white/10 p-4 rounded-sm shadow-xl">
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'paid', 'sent', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm ${filter === f ? 'bg-brand-orange text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'paid' ? 'Pagos' : f === 'sent' ? 'Enviados' : 'Cancelados'}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setIsAddingManually(true)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border border-white/10 rounded-sm shadow-lg"
        >
          <Plus className="w-3 h-3" /> Incluir Manualmente
        </button>
      </div>

      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-sm shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-left bg-white/5">
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">Data</th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">Cliente</th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">Produto</th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">Valor</th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">Status</th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <OrderRow 
                  key={order.id} 
                  order={order} 
                  onUpdate={updateOrder} 
                  onDelete={() => setOrderToDelete(order.id)} 
                  onAlert={onAlert}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-20 text-center text-white/20 italic font-serif">Nenhum pedido encontrado com este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={!!orderToDelete}
        onConfirm={confirmDelete}
        onCancel={() => setOrderToDelete(null)}
        title="Excluir Pedido"
        message="Tem certeza que deseja excluir este registro de pedido? Esta ação removerá o pedido permanentemente do sistema."
        variant="danger"
        confirmLabel={deleting ? "Excluindo..." : "Sim, Excluir"}
      />

      {isAddingManually && (
        <ManualOrderModal 
          onClose={() => setIsAddingManually(false)} 
          onSave={addOrder}
          onAlert={onAlert}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, valueClass = "text-white", bgClass = "bg-white/5 border-white/10", labelClass = "text-white/40" }: any) {
  return (
    <div className={`${bgClass} border p-6 rounded-sm shadow-xl`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-2 bg-black/20 rounded-sm">
          {icon}
        </div>
        <p className={`text-[10px] uppercase tracking-widest ${labelClass} font-bold`}>{label}</p>
      </div>
      <p className={`text-3xl font-display ${valueClass}`}>{value}</p>
    </div>
  );
}

function OrderRow({ order, onUpdate, onDelete, onAlert }: { order: any, onUpdate: any, onDelete: any, onAlert: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const { items: helpItems } = useHelpItems();
  const [customerName, setCustomerName] = useState(order?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(order?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState(order?.customer_email || '');
  const [orderItems, setOrderItems] = useState<any[]>(order?.items || []);
  const [status, setStatus] = useState(order?.status || 'pending');

  const totalPrice = orderItems.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  const itemsText = orderItems.map(item => `${item.quantity || 1}x ${item.name}`).join(', ');

  const handleSave = async () => {
    setUpdating(true);
    const result = await onUpdate(order.id, {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      product_name: itemsText,
      product_price: totalPrice,
      total_price: totalPrice,
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
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, { id: item.id, name: item.title, price: item.price, quantity: 1 }];
    });
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
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
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar border border-white/5 p-2 bg-black/20">
            {(helpItems || []).map(item => {
              const selectedItem = orderItems.find(i => i.id === item.id);
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 p-1 hover:bg-white/5 rounded-sm group/item">
                  <div 
                    onClick={() => toggleItem(item)}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <div className={`w-3 h-3 border flex items-center justify-center ${selectedItem ? 'bg-brand-orange border-brand-orange' : 'border-white/20'}`}>
                      {selectedItem && <Check className="w-2 h-2 text-white" />}
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${selectedItem ? 'text-white' : 'text-white/40'}`}>{item.title}</span>
                  </div>
                  {selectedItem && (
                    <div className="flex items-center gap-2 bg-black/40 rounded-full px-2 py-0.5 border border-white/10">
                      <button onClick={() => updateItemQuantity(item.id, -1)} className="text-white/40 hover:text-brand-orange transition-colors">
                        <Minus className="w-2 h-2" />
                      </button>
                      <span className="text-[10px] font-bold text-brand-orange min-w-[12px] text-center">{selectedItem.quantity || 1}</span>
                      <button onClick={() => updateItemQuantity(item.id, 1)} className="text-white/40 hover:text-brand-orange transition-colors">
                        <Plus className="w-2 h-2" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
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
          <div className="text-sm font-bold">
            {maskBRL(totalPrice)}
          </div>
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

function ManualOrderModal({ onClose, onSave, onAlert }: { onClose: () => void, onSave: any, onAlert: any }) {
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
    if (!product) return;
    
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
