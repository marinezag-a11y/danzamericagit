import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2 
} from 'lucide-react';
import { RaffleCampaign, RaffleOrder } from '../../../../hooks/useRaffles';
import { ConfirmModal } from '../../../../components/modals/ConfirmModal';
import { maskBRL } from '../../../../lib/utils';

interface RaffleOrdersModalProps {
  campaign: RaffleCampaign;
  orders: RaffleOrder[];
  loading: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, s: any) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
}

export function RaffleOrdersModal({ 
  campaign, 
  orders, 
  loading, 
  onClose, 
  onUpdateStatus, 
  onDeleteOrder 
}: RaffleOrdersModalProps) {
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-brand-dark border border-white/10 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col rounded-sm shadow-2xl relative"
      >
        <div className="p-8 md:p-12 border-b border-white/5 flex justify-between items-center">
          <div>
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.5em] font-bold mb-2">Pedidos de Rifa</p>
            <h3 className="text-3xl font-serif italic text-white">{campaign.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center text-white/20 italic">Nenhum pedido realizado ainda.</div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white/5 border border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-white/10 transition-all">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                      <h5 className="text-lg font-sans text-white font-bold">{order.customer_name}</h5>
                      <div className={`px-3 py-1 text-[8px] uppercase tracking-widest font-bold rounded-full ${
                        order.status === 'paid' ? 'bg-emerald-500/20 text-emerald-500' : 
                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' : 
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {order.status === 'paid' ? 'Pago' : order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-[8px] uppercase tracking-widest text-white/30">Contato</p>
                        <p className="text-xs text-white/60">{order.customer_email}<br/>{order.customer_phone}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] uppercase tracking-widest text-white/30">Números Escolhidos</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.selected_numbers.map(n => (
                            <span key={n} className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[10px] font-bold border border-brand-orange/20">
                              {String(n).padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] uppercase tracking-widest text-white/30">Valor Total</p>
                        <p className="text-lg font-sans text-white font-bold">{maskBRL(order.total_price)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-6 md:pt-0 border-t md:border-t-0 border-white/5">
                    <button 
                      onClick={() => onUpdateStatus(order.id, order.status === 'paid' ? 'pending' : 'paid')}
                      className={`p-3 rounded-sm transition-all ${order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10'}`}
                      title={order.status === 'paid' ? 'Marcar como Pendente' : 'Confirmar Pagamento'}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      className={`p-3 rounded-sm transition-all ${order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10'}`}
                      title="Cancelar Pedido"
                    >
                      <AlertCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setOrderToDelete(order.id)}
                      className="p-3 bg-white/5 text-white/20 hover:text-white hover:bg-red-500 transition-all rounded-sm"
                      title="Excluir Pedido"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ConfirmModal 
          isOpen={!!orderToDelete}
          onConfirm={async () => {
            if (orderToDelete) await onDeleteOrder(orderToDelete);
            setOrderToDelete(null);
          }}
          onCancel={() => setOrderToDelete(null)}
          title="Excluir Pedido?"
          message="Esta ação removerá o pedido permanentemente e liberará os números no site. Deseja continuar?"
          confirmLabel="Sim, Excluir"
          variant="danger"
        />
      </motion.div>
    </div>
  );
}
