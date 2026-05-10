import React, { useState } from 'react';
import { 
  Loader2, 
  Pencil, 
  Trash2, 
  ChevronRight,
  Mail
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { maskBRL } from '../../../../lib/utils';
import { OrderEditModal } from './OrderEditModal';
import { ReasonModal } from '../../../../components/modals/ReasonModal';

interface OrderRowProps {
  order: any;
  onUpdate: (id: string, data: any) => Promise<{ success: boolean; error?: any }>;
  onDelete: () => void;
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order, onUpdate, onDelete, onAlert }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isAskingReason, setIsAskingReason] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [status, setStatus] = useState(order?.status || 'pending');

  const statusColors = {
    pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    paid: 'text-green-500 bg-green-500/10 border-green-500/20',
    sent: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    cancelled: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  const handleSaveFromModal = async (data: any) => {
    const result = await onUpdate(order.id, data);
    if (result.success) {
      if (data.status !== order.status) {
        try {
          await supabase.functions.invoke('send-order-v2-updated-v2', {
            body: {
              type: 'status_update',
              order_id: order.id,
              customer_name: data.customer_name,
              customer_email: data.customer_email,
              new_status: data.status,
              reason: data.reason
            }
          });
        } catch (err) {
          console.error('Erro ao enviar e-mail de status:', err);
        }
      }
      setIsModalOpen(false);
      onAlert('Sucesso', 'Pedido atualizado com sucesso.', 'info');
    } else {
      onAlert('Erro', result.error, 'danger');
    }
  };

  const handleConfirmReason = async (reason: string) => {
    if (!pendingStatus) return;
    
    setIsAskingReason(false);
    setStatus(pendingStatus);
    setUpdating(true);
    
    const result = await onUpdate(order.id, { status: pendingStatus });
    if (result.success) {
      try {
        await supabase.functions.invoke('send-order-v2-updated-v2', {
          body: {
            type: 'status_update',
            order_id: order.id,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            new_status: pendingStatus,
            reason: reason
          }
        });
      } catch (err) {
        console.error('Erro ao enviar e-mail de status:', err);
      }
      onAlert('Status Atualizado', 'Notificação enviada ao cliente.', 'info');
    }
    setUpdating(false);
    setPendingStatus(null);
  };

  return (
    <>
      <tr className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
        <td className="py-5 px-6">
          <div className="flex flex-col">
            <span className="text-sm text-white font-medium">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
            <span className="text-[10px] text-white/40 font-mono">
              {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </td>
        <td className="py-5 px-6">
          <div className="flex flex-col">
            <p className="text-white font-bold text-sm">{order.customer_name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-white/40 font-mono tracking-wider">{order.customer_phone}</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-brand-orange/40 font-mono tracking-wider">{order.customer_email}</span>
                {order.notification_sent ? (
                  <Mail className="w-3 h-3 text-emerald-500" title="Notificação enviada" />
                ) : (
                  <div className="flex items-center gap-1 text-red-500" title="E-mail não enviado">
                    <Mail className="w-3 h-3" />
                    <span className="text-[8px] font-bold">!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="py-5 px-6">
          <div className="flex flex-wrap gap-2 max-w-md">
            {order.type === 'raffle' ? (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                  Ação entre Amigos
                </span>
                <span className="text-[11px] text-white font-medium italic">
                  Apoiado: {order.dancer_name || 'Geral'}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(order.selected_numbers || []).map((n: number) => (
                    <span key={n} className="text-[9px] bg-white/5 border border-white/10 text-white/40 px-1 rounded-sm tabular-nums">#{n}</span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {(order.items || []).slice(0, 2).map((item: any, idx: number) => (
                  <span key={idx} className="text-[10px] bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-sm uppercase tracking-widest">
                    {item.quantity}x {item.name}
                  </span>
                ))}
                {order.items?.length > 2 && (
                  <span className="text-[10px] text-brand-orange font-bold italic">+{order.items.length - 2} mais...</span>
                )}
                {!order.items?.length && (
                  <span className="text-[10px] text-white/20 italic">{order.product_name}</span>
                )}
              </>
            )}
          </div>
        </td>
        <td className="py-5 px-6">
          <span className="text-sm font-display font-bold text-brand-orange tracking-tight">
            {maskBRL(order.total_price || order.product_price)}
          </span>
        </td>
        <td className="py-5 px-6">
          <span className="text-sm font-display font-bold text-emerald-500 tracking-tight">
            {order.type === 'raffle' 
              ? maskBRL(order.total_price || order.product_price)
              : maskBRL((order.product_price || 0) - (order.items || []).reduce((sum: number, i: any) => sum + (Number(i.cost_price || 0) * (i.quantity || 1)), 0))
            }
          </span>
        </td>
        <td className="py-5 px-6">
          <select 
            value={status}
            onChange={async (e) => {
              const newStatus = e.target.value;
              if (newStatus === 'cancelled') {
                setPendingStatus(newStatus);
                setIsAskingReason(true);
                return;
              }
              
              setStatus(newStatus);
              setUpdating(true);
              const result = await onUpdate(order.id, { status: newStatus });
              if (result.success) {
                try {
                  await supabase.functions.invoke('send-order-v2-updated-v2', {
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
              }
              setUpdating(false);
            }}
            disabled={updating}
            className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm outline-none cursor-pointer transition-all ${statusColors[status as keyof typeof statusColors]} border bg-black/40`}
          >
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="sent">Enviado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </td>
        <td className="py-5 px-6 text-right">
          <div className="flex items-center justify-end gap-1">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-2 text-white/20 hover:text-brand-orange hover:bg-brand-orange/10 transition-all rounded-sm group/btn"
              title="Ver detalhes e editar"
            >
              <Pencil className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
            <button 
              onClick={onDelete}
              className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-sm group/btn"
              title="Excluir pedido"
            >
              <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
        </td>
      </tr>

      <OrderEditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={order}
        onSave={handleSaveFromModal}
      />

      <ReasonModal
        isOpen={isAskingReason}
        title="Motivo do Cancelamento"
        message="Por favor, informe o motivo para o cancelamento deste pedido. Este texto será enviado por e-mail para o cliente."
        confirmLabel="Confirmar Cancelamento"
        onConfirm={handleConfirmReason}
        onCancel={() => {
          setIsAskingReason(false);
          setPendingStatus(null);
        }}
        variant="warning"
      />
    </>
  );
}
