import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  ShoppingBag, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Plus, 
  Loader2, 
  Users,
  Check
} from 'lucide-react';
import { useHelpOrders } from '../../../hooks/useHelpOrders';
import { useProfiles } from '../../../hooks/useProfiles';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { NotificationSettings } from './ui/NotificationSettings';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { ReasonModal } from '../../../components/modals/ReasonModal';
import { maskBRL } from '../../../lib/utils';
import { StatCard } from './ui/StatCard';
import { OrderRow } from './orders/OrderRow';
import { ManualOrderModal } from './orders/ManualOrderModal';

interface OrdersManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
  userRole: string | null;
}

export function OrdersManager({ onAlert, userRole }: OrdersManagerProps) {
  const { orders, loading: loadingOrders, error, updateOrder, addOrder, deleteOrder } = useHelpOrders();
  const { settings, updateSetting, loading: loadingSettings } = useSiteSettings();
  const { profiles } = useProfiles();
  const [savingEmails, setSavingEmails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'sent' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'store' | 'raffle'>('all');
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isAskingReason, setIsAskingReason] = useState(false);

  const stats = {
    total: orders?.length || 0,
    cancelled: (orders || []).filter(o => o?.status === 'cancelled').length,
    paid: (orders || []).filter(o => o?.status === 'paid' || o?.status === 'sent').length,
    pendingValue: (orders || []).filter(o => o?.status === 'pending').reduce((sum, o) => sum + (o?.total_price || o?.product_price || 0), 0),
    totalValue: (orders || []).filter(o => o?.status === 'paid' || o?.status === 'sent').reduce((sum, o) => sum + (o?.total_price || o?.product_price || 0), 0),
    totalNetValue: (orders || []).filter(o => o?.status === 'paid' || o?.status === 'sent').reduce((sum, o) => {
      const price = o?.total_price || o?.product_price || 0;
      if (o.type === 'raffle') return sum + price;
      const items = o?.items || [];
      const totalCost = items.reduce((s: number, i: any) => s + (Number(i.cost_price || 0) * (i.quantity || 1)), 0);
      return sum + price - totalCost;
    }, 0)
  };

  const filteredOrders = (orders || []).filter(o => {
    const matchesStatus = filter === 'all' || o?.status === filter;
    const matchesType = typeFilter === 'all' || o?.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const confirmDelete = async (reason: string) => {
    if (!orderToDelete) return;
    
    setIsAskingReason(false);
    const order = orders?.find(o => o.id === orderToDelete);
    
    if (order) {
      try {
        await supabase.functions.invoke('send-order', {
          body: {
            type: 'order_deletion',
            order_id: order.id,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            reason: reason
          }
        });
      } catch (err) {
        console.error('Erro ao enviar e-mail de exclusão:', err);
      }
    }

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
      {/* Notification Settings */}
      {userRole === 'master' && (
        <NotificationSettings 
          title="Notificações de Pedidos"
          description="Selecione os administradores ou insira e-mails manualmente para receber alertas"
          profiles={profiles}
          currentEmails={currentEmails}
          onSave={handleSaveEmails}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard icon={<ShoppingBag className="w-5 h-5 text-white/40" />} label="Total de Pedidos" value={stats.total} />
        <StatCard icon={<XCircle className="w-5 h-5 text-red-500" />} label="Cancelados" value={stats.cancelled} valueClass="text-red-500" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Pedidos Pagos" value={stats.paid} />
        <StatCard icon={<Clock className="w-5 h-5 text-yellow-500" />} label="Valor Pendente" value={maskBRL(stats.pendingValue)} valueClass="text-yellow-500" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-white" />} label="Total Bruto" value={maskBRL(stats.totalValue)} bgClass="bg-white/5 border-white/10" labelClass="text-white/40" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-white" />} label="Total Líquido" value={maskBRL(stats.totalNetValue)} bgClass="bg-brand-orange border-brand-orange" labelClass="text-white/80" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-12">
        <div>
          <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Gestão Financeira</p>
          <h2 className="text-4xl font-serif text-white italic">Controle de Pedidos</h2>
        </div>
      </div>

      {/* Filter and Actions */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white/5 border border-white/10 p-6 rounded-sm shadow-xl">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'paid', 'sent', 'cancelled'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm ${filter === f ? 'bg-brand-orange text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                {f === 'all' ? 'Todos Status' : f === 'pending' ? 'Pendentes' : f === 'paid' ? 'Pagos' : f === 'sent' ? 'Enviados' : 'Cancelados'}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-6 bg-white/10 hidden lg:block" />

          <div className="flex flex-wrap gap-2">
            {(['all', 'store', 'raffle'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm border ${typeFilter === t ? 'bg-white text-brand-dark border-white' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'}`}
              >
                {t === 'all' ? 'Tudo' : t === 'store' ? 'Produtos da Loja' : 'Ações entre Amigos'}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setIsAddingManually(true)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold transition-all border border-white/10 rounded-sm shadow-lg whitespace-nowrap"
        >
          <Plus className="w-3 h-3" /> Incluir Manualmente
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-sm shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-left bg-white/5">
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">Data</th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">Cliente</th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">Produto</th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">Valor</th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold text-emerald-500">Margem Líquida</th>
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

      {/* Modals */}
      <ReasonModal
        isOpen={!!orderToDelete}
        title="Motivo da Exclusão"
        message="Deseja realmente excluir este pedido? Esta ação não pode ser desfeita. Por favor, informe o motivo para o e-mail de aviso."
        confirmLabel={deleting ? "Excluindo..." : "Confirmar Exclusão"}
        onConfirm={confirmDelete}
        onCancel={() => setOrderToDelete(null)}
        variant="danger"
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
