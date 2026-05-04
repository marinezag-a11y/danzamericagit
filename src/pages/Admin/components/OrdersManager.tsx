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
  X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useHelpOrders } from '../../../hooks/useHelpOrders';
import { useHelpItems } from '../../../hooks/useHelpItems';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { maskBRL, parseBRL } from '../../../lib/utils';

interface OrdersManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function OrdersManager({ onAlert }: OrdersManagerProps) {
  const { orders, loading, error, updateOrder, addOrder, deleteOrder } = useHelpOrders();
  
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
    const result = await deleteOrder(orderToDelete);
    if (result.success) {
      onAlert('Pedido Excluído', 'O registro foi removido com sucesso.', 'info');
    } else {
      onAlert('Erro ao Excluir', 'Não foi possível excluir o pedido: ' + result.error, 'danger');
    }
    setDeleting(false);
    setOrderToDelete(null);
  };

  if (error) return <div className="py-20 text-center text-red-500 font-sans">Erro ao carregar pedidos: {error}</div>;
  if (loading && (!orders || orders.length === 0)) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-12">
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
  
  const [customerName, setCustomerName] = useState(order?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(order?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState(order?.customer_email || '');
  const [productName, setProductName] = useState(order?.product_name || '');
  const [productPrice, setProductPrice] = useState(order?.product_price || 0);
  const [status, setStatus] = useState(order?.status || 'pending');

  const handleSave = async () => {
    setUpdating(true);
    const result = await onUpdate(order.id, {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      product_name: productName,
      product_price: Number(productPrice),
      total_price: Number(productPrice),
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
          <textarea 
            value={productName} 
            onChange={e => setProductName(e.target.value)}
            className="bg-black/50 border border-white/10 p-1 text-sm text-white w-full h-20 outline-none focus:border-brand-orange"
          />
        ) : (
          order.product_name
        )}
      </td>
      <td className="py-6 px-6 text-sm font-display text-brand-orange">
        {isEditing ? (
          <input 
            type="text"
            value={maskBRL(productPrice)} 
            onChange={e => setProductPrice(parseBRL(e.target.value))}
            className="bg-black/50 border border-white/10 p-1 text-sm text-brand-orange w-32 outline-none focus:border-brand-orange"
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

function ManualOrderModal({ onClose, onSave, onAlert }: { onClose: () => void, onSave: any, onAlert: any }) {
  const { items: helpItems } = useHelpItems();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (helpItems && helpItems.length > 0 && !product) {
      setProduct(helpItems[0]);
    }
  }, [helpItems, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setSaving(true);
    const result = await onSave({
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      product_id: product?.id,
      product_name: product?.title,
      product_price: product?.price || 0,
      total_price: product?.price || 0,
      status: 'pending'
    });
    
    if (result.success) {
      try {
        await supabase.functions.invoke('send-order', {
          body: {
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            product_name: product?.title,
            product_price: product?.price || 0,
            total_price: product?.price || 0,
            status: 'pending'
          }
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
            <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">Produto</label>
            <select 
              value={product?.id || ''}
              onChange={(e) => setProduct(helpItems.find(p => p.id === e.target.value) || helpItems[0])}
              className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none cursor-pointer"
            >
              {(helpItems || []).map(p => (
                <option key={p.id} value={p.id}>{p.title} - {maskBRL(p.price || 0)}</option>
              ))}
            </select>
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
