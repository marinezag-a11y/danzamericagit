import React, { useState } from 'react';
import { 
  Loader2, 
  Pencil, 
  Trash2, 
  ChevronRight,
  Mail,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { maskBRL } from '../../../../lib/utils';
import { OrderEditModal } from './OrderEditModal';
import { ReasonModal } from '../../../../components/modals/ReasonModal';
import { ConfirmModal } from '../../../../components/modals/ConfirmModal';

interface OrderRowProps {
  order: any;
  settings: Record<string, any>;
  onUpdate: (id: string, data: any) => Promise<{ success: boolean; error?: any }>;
  onDelete: () => void;
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
  hasConflict?: boolean;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order, settings, onUpdate, onDelete, onAlert, hasConflict }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isAskingReason, setIsAskingReason] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [status, setStatus] = useState(order?.status || 'pending');
  const [resending, setResending] = useState(false);
  const [isConfirmingInfinitePay, setIsConfirmingInfinitePay] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Sincronizar o estado local com o prop caso ele mude externamente
  React.useEffect(() => {
    if (order?.status) {
      setStatus(order.status);
    }
  }, [order?.status]);

  const getElapsedTime = () => {
    if (!order.created_at || !order.updated_at || order.status === 'pending' || order.status === 'unconfirmed') return null;
    const created = new Date(order.created_at).getTime();
    const updated = new Date(order.updated_at).getTime();
    const diffMs = updated - created;
    if (diffMs <= 1000) return null; // Ignora diferenças insignificantes (ex: 0s ou 1s)
    
    const diffSecs = Math.round(diffMs / 1000);
    const hours = Math.floor(diffSecs / 3600);
    const min = Math.floor((diffSecs % 3600) / 60);
    const sec = diffSecs % 60;
    
    if (hours > 0) {
      return `${hours}h ${min}m`;
    }
    if (min > 0) {
      return `${min}m ${sec}s`;
    }
    return `${sec}s`;
  };

  const statusColors = {
    pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    paid: 'text-green-500 bg-green-500/10 border-green-500/20',
    sent: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    cancelled: 'text-red-500 bg-red-500/10 border-red-500/20',
    unconfirmed: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  };

  const handleSaveFromModal = async (data: any) => {
    const result = await onUpdate(order.id, data);
    if (result.success) {
      if (data.status !== order.status) {
        try {
          await supabase.functions.invoke('send-order', {
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
      
      const isPaidBefore = order.status === 'paid';
      const isCancelledNow = data.status === 'cancelled';
      
      if (isPaidBefore && isCancelledNow) {
        onAlert(
          'Pedido Cancelado & Reembolso Necessário',
          `Os bilhetes foram liberados no sistema.\n\n` +
          `Como este pedido já estava PAGO via Pix (InfinitePay), você deve realizar o estorno manual:\n` +
          `1. Acesse o aplicativo ou painel da InfinitePay.\n` +
          `2. Localize a transação no valor de ${maskBRL(order.total_price || order.product_price)}.\n` +
          `3. Clique em "Estornar" para devolver o dinheiro à conta Pix do cliente.`,
          'warning'
        );
      } else {
        onAlert('Sucesso', 'Pedido atualizado com sucesso.', 'info');
      }
    } else {
      onAlert('Erro', result.error, 'danger');
    }
  };

  const handleConfirmReason = async (reason: string) => {
    if (!pendingStatus) return;
    
    setIsAskingReason(false);
    setStatus(pendingStatus);
    setUpdating(true);
    
    const isPaidBefore = order.status === 'paid';
    const isCancelledNow = pendingStatus === 'cancelled';
    
    const result = await onUpdate(order.id, { status: pendingStatus });
    if (result.success) {
      try {
        await supabase.functions.invoke('send-order', {
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
      
      if (isPaidBefore && isCancelledNow) {
        onAlert(
          'Pedido Cancelado & Reembolso Necessário',
          `Os bilhetes foram liberados no sistema.\n\n` +
          `Como este pedido já estava PAGO via Pix (InfinitePay), você deve realizar o estorno manual:\n` +
          `1. Acesse o aplicativo ou painel da InfinitePay.\n` +
          `2. Localize a transação no valor de ${maskBRL(order.total_price || order.product_price)}.\n` +
          `3. Clique em "Estornar" para devolver o dinheiro à conta Pix do cliente.`,
          'warning'
        );
      } else {
        onAlert('Status Atualizado', 'Pedido cancelado com sucesso.', 'info');
      }
    }
    setUpdating(false);
    setPendingStatus(null);
  };

  const handleConfirmPayment = async () => {
    setUpdating(true);
    const result = await onUpdate(order.id, { status: 'paid', payment_origin: 'manual' });
    if (result.success) {
      setStatus('paid');
      onAlert('Sucesso', 'Pagamento confirmado com sucesso.', 'info');
      
      // Enviar e-mail de confirmação de pagamento automaticamente
      try {
        await supabase.functions.invoke('send-order', {
          body: {
            type: 'status_update',
            order_id: order.id,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            new_status: 'paid'
          }
        });
        // Atualizar estado de notificação enviada no banco e localmente
        await onUpdate(order.id, { notification_sent: true });
      } catch (err) {
        console.error('Erro ao enviar e-mail automático de pagamento confirmado:', err);
      }
    } else {
      onAlert('Erro', result.error || 'Erro ao confirmar pagamento', 'danger');
    }
    setUpdating(false);
  };

  const handleResendEmail = async () => {
    if (!order) return;
    setResending(true);
    try {
      const isRaffle = order.type === 'raffle';
      const payload: any = {
        order_id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        total_price: order.total_price || order.product_price,
        pix_key: order.pix_key || settings?.pix_key_checkout?.value || settings?.pix_key?.value || 'ballettatianafigueiredo@gmail.com',
        pix_bank: order.pix_bank || settings?.pix_checkout_bank?.value || 'SICOOB',
        pix_receiver: order.pix_receiver || settings?.pix_checkout_receiver?.value || 'NUCLEO DE DANCA TATIANA FIGUEIREDO'
      };

      if (isRaffle) {
        payload.campaign_id = order.campaign_id;
        payload.dancer_name = order.dancer_name;
        payload.selected_numbers = order.selected_numbers;
      } else {
        payload.items = order.items || [];
      }

      const { data, error: invokeError } = await supabase.functions.invoke('send-order', {
        body: payload
      });

      if (invokeError || !data?.success) throw invokeError || new Error(data?.error || 'Erro desconhecido');
      
      onAlert('E-mail Enviado', 'A notificação foi reenviada com sucesso.', 'info');
      onUpdate(order.id, { notification_sent: true, reason: null });
    } catch (err: any) {
      console.error('Erro no reenvio:', err);
      const msg = err.message || '';
      if (msg.includes('non-2xx status code') || msg.includes('limit') || msg.includes('429')) {
        onAlert('Limite Atingido', 'Não foi possível enviar o e-mail agora. O limite diário (teto) do servidor pode ter sido atingido. Tente novamente mais tarde ou avise via WhatsApp.', 'warning');
      } else {
        onAlert('Erro ao Enviar', 'Falha ao reenviar e-mail: Verifique os dados ou a conexão.', 'danger');
      }
    } finally {
      setResending(false);
    }
  };

  const handleWhatsAppNotify = () => {
    const pixKey = settings['pix_key_checkout']?.value || 'ballettatianafigueiredo@gmail.com';
    const pixBank = settings['pix_checkout_bank']?.value || 'SICOOB';
    const pixReceiver = settings['pix_checkout_receiver']?.value || 'NUCLEO DE DANCA TATIANA FIGUEIREDO';
    
    const orderId = order.id.split('-')[0].toUpperCase();
    const isRaffle = order.type === 'raffle';
    
    let itemsText = '';
    if (isRaffle) {
      itemsText = `Números Escolhidos: ${(order.selected_numbers || []).join(', ')}\nBailarino: ${order.dancer_name || 'Geral'}`;
    } else {
      itemsText = (order.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join('\n');
    }

    const message = encodeURIComponent(
      `Olá *${order.customer_name}*! 👋\n\n` +
      `Recebemos seu pedido *#${orderId}* no sistema do Núcleo de Dança Tatiana Figueiredo.\n\n` +
      `*DETALHES DO PEDIDO:*\n${itemsText}\n` +
      `*TOTAL:* ${maskBRL(order.total_price || order.product_price)}\n\n` +
      `*PAGAMENTO VIA PIX:*\n` +
      `Chave: \`${pixKey}\`\n` +
      `Banco: ${pixBank}\n` +
      `Nome: ${pixReceiver}\n\n` +
      `_Após realizar o pagamento, por favor, envie o comprovante por aqui._\n` +
      `Muito obrigado por apoiar nossos talentos! 🇦🇷🩰`
    );

    const phone = order.customer_phone.replace(/\D/g, '');
    const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
    
    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
  };

  return (
    <>
      <tr 
        onClick={() => setIsModalOpen(true)}
        className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 cursor-pointer"
      >
        <td className="py-5 px-6">
          <div className="flex flex-col">
            <span className="text-sm text-white font-medium">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
            <span className="text-[10px] text-white/40 font-mono">
              {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {getElapsedTime() && (
              <span className="text-[9px] text-emerald-400 font-mono mt-1.5 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 w-max" title="Tempo gasto para confirmação">
                ⏱️ {getElapsedTime()}
              </span>
            )}
          </div>
        </td>
        <td className="py-5 px-6">
          <div className="flex flex-col">
            <p className="text-white font-bold text-sm">{order.customer_name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-white/40 font-mono tracking-wider">{order.customer_phone}</span>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-mono tracking-wider ${order.notification_sent ? 'text-white/40' : 'text-red-500 font-bold'}`}>
                  {order.customer_email}
                </span>
                {order.reason && !order.notification_sent && (
                  <span className="text-[8px] text-red-500/60 italic ml-2 truncate max-w-[150px]" title={order.reason}>
                    ({order.reason})
                  </span>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResendEmail();
                  }}
                  disabled={resending}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all shadow-sm disabled:opacity-50 ${
                    order.notification_sent 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white' 
                      : 'bg-red-500 text-white border border-red-600 hover:bg-red-600'
                  }`}
                  title={order.notification_sent ? "E-mail já enviado. Clique para reenviar se desejar." : "E-mail não enviado. Clique para reenviar agora."}
                >
                  {resending ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-2.5 h-2.5" />
                      <span className="text-[7px] font-black uppercase tracking-tighter">
                        {order.notification_sent ? 'Enviado' : 'Reenviar'}
                      </span>
                    </>
                  )}
                </button>
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
                  {hasConflict && (
                    <div className="flex items-center gap-1 ml-2 animate-pulse" title="CONFLITO: Este número está duplicado em outro pedido ativo!">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-[8px] text-red-500 font-black uppercase">Duplicado</span>
                    </div>
                  )}
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
          <div className="flex flex-col gap-1 items-start">
            <select 
              value={status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const newStatus = e.target.value;
                
                const proceed = async () => {
                  if (newStatus === 'cancelled') {
                    setPendingStatus(newStatus);
                    setIsAskingReason(true);
                    return;
                  }
                  
                  const previousStatus = status;
                  setStatus(newStatus);
                  setUpdating(true);
                  
                  const updates: any = { status: newStatus };
                  if (newStatus === 'paid') {
                    updates.payment_origin = order.payment_origin || 'manual';
                  } else if (newStatus === 'pending' || newStatus === 'unconfirmed' || newStatus === 'cancelled') {
                    updates.payment_origin = null;
                  }

                  const result = await onUpdate(order.id, updates);
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
                    if (newStatus === 'paid') {
                      onAlert('Status Atualizado', 'Notificação de pagamento enviada ao cliente.', 'info');
                    } else {
                      onAlert('Status Atualizado', 'Status do pedido atualizado com sucesso.', 'info');
                    }
                  } else {
                    // Se der erro, volta para o status anterior
                    setStatus(previousStatus);
                    onAlert('Erro ao Atualizar', result.error || 'Não foi possível salvar o status.', 'danger');
                  }
                  setUpdating(false);
                };

                if (order.payment_origin === 'infinitepay') {
                  setPendingAction(() => proceed);
                  setIsConfirmingInfinitePay(true);
                } else {
                  proceed();
                }
              }}
              disabled={updating}
              className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm outline-none cursor-pointer transition-all ${statusColors[status as keyof typeof statusColors]} border bg-black/40`}
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="sent">Enviado</option>
              <option value="cancelled">Cancelado</option>
              <option value="unconfirmed">Pagto Não confirmado</option>
            </select>
            {status === 'paid' && (
              <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-sm mt-1 border ${
                order.payment_origin === 'infinitepay'
                  ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
              }`}>
                {order.payment_origin === 'mercadopago' ? '🤝 Mercado Pago' : order.payment_origin === 'infinitepay' ? '⚡ InfinitePay' : '👤 Avulso'}
              </span>
            )}
          </div>
        </td>
        <td className="py-5 px-6 text-right">
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleWhatsAppNotify();
              }}
              className="p-3 sm:p-2 text-white/20 hover:text-[#25D366] hover:bg-[#25D366]/10 transition-all rounded-sm group/btn relative"
              data-tooltip="Notificar WhatsApp"
            >
              <MessageSquare className="w-5 h-5 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="p-3 sm:p-2 text-white/20 hover:text-brand-orange hover:bg-brand-orange/10 transition-all rounded-sm group/btn relative"
              data-tooltip="Editar Pedido"
            >
              <Pencil className="w-5 h-5 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
            {order.status !== 'unconfirmed' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-3 sm:p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-sm group/btn relative"
                data-tooltip="Excluir Pedido"
              >
                <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
              </button>
            )}
            {order.status === 'unconfirmed' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmPayment();
                }}
                disabled={updating}
                className="ml-2 p-2 bg-emerald-600 text-white rounded-sm text-xs"
              >
                Confirmar Pagamento
              </button>
            )}
          </div>
        </td>
      </tr>

      <OrderEditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={order}
        onSave={handleSaveFromModal}
        onAlert={onAlert}
      />

      <ConfirmModal
        isOpen={isConfirmingInfinitePay}
        title="Alterar Pedido Automático"
        message="Atenção: Este pedido foi pago de forma automática via InfinitePay. Alterar o seu status manualmente pode gerar inconsistências financeiras e de concorrência com o gateway de pagamentos. Deseja prosseguir mesmo assim?"
        confirmLabel="Sim, Alterar"
        cancelLabel="Voltar"
        variant="warning"
        onConfirm={() => {
          setIsConfirmingInfinitePay(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        onCancel={() => {
          setIsConfirmingInfinitePay(false);
          setPendingAction(null);
          // Forçar renderização do select a voltar ao estado atual
          const prevStatus = status;
          setStatus('');
          setTimeout(() => setStatus(prevStatus), 50);
        }}
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
