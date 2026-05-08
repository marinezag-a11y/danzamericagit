import React, { useState } from 'react';
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
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const stats = {
    total: orders?.length || 0,
    cancelled: (orders || []).filter(o => o?.status === 'cancelled').length,
    paid: (orders || []).filter(o => o?.status === 'paid').length,
    pendingValue: (orders || []).filter(o => o?.status === 'pending').reduce((sum, o) => sum + (o?.product_price || 0), 0),
    totalValue: (orders || []).filter(o => o?.status === 'paid' || o?.status === 'sent').reduce((sum, o) => sum + (o?.product_price || 0), 0)
  };

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

      {/* Filter and Actions */}
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

      {/* Orders Table */}
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

      {/* Modals */}
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
