import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Mail 
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
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="bg-brand-dark border border-white/10 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative"
      >
        <div className="p-10 md:p-14 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.5em] font-black mb-3">CONTROLE DE PARTICIPAÇÃO</p>
            <h3 className="text-4xl font-serif italic text-white leading-tight">{campaign.name}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all transform hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 md:p-14 custom-scrollbar">
          {loading ? (
            <div className="py-32 text-center flex flex-col items-center gap-6">
              <Loader2 className="w-12 h-12 text-brand-orange animate-spin" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">Sincronizando Pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-32 text-center flex flex-col items-center gap-6">
               <AlertCircle className="w-16 h-16 text-white/5" />
               <p className="text-white/20 italic font-serif text-xl">Ainda não há participações registradas.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10 group hover:border-white/20 hover:bg-white/[0.07] transition-all relative overflow-hidden"
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    order.status === 'paid' ? 'bg-emerald-500' : 
                    order.status === 'cancelled' ? 'bg-red-500' : 
                    'bg-yellow-500'
                  }`} />

                  <div className="flex-1 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="space-y-1">
                         <h5 className="text-2xl font-serif italic text-white">{order.customer_name}</h5>
                         <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-black">CLIENTE REGISTRADO</p>
                      </div>
                      <div className={`w-fit px-4 py-1.5 text-[9px] uppercase tracking-widest font-black rounded-xl border ${
                        order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {order.status === 'paid' ? 'Confirmado' : order.status === 'cancelled' ? 'Cancelado' : 'Aguardando'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                      <div className="space-y-3">
                        <p className="text-[9px] uppercase tracking-widest text-white/20 font-black">INFORMAÇÕES DE CONTATO</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 group/mail cursor-pointer" onClick={() => window.location.href = `mailto:${order.customer_email}`}>
                            <Mail className={`w-3 h-3 ${order.notification_sent ? 'text-emerald-500' : 'text-red-500'}`} />
                            <p className="text-xs text-white/60 hover:text-white transition-colors">{order.customer_email}</p>
                          </div>
                          <p className="text-xs text-white/60 font-mono">{order.customer_phone}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[9px] uppercase tracking-widest text-white/20 font-black">NÚMEROS ADQUIRIDOS</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {order.selected_numbers.map(n => (
                            <span key={n} className="w-8 h-8 bg-brand-orange/10 text-brand-orange text-[11px] font-black border border-brand-orange/20 rounded-lg flex items-center justify-center shadow-lg">
                              {String(n).padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[9px] uppercase tracking-widest text-white/20 font-black">TALENTO APOIADO</p>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(204,0,0,0.5)]" />
                           <p className="text-sm text-white font-serif italic">{order.dancer_name || 'Geral'}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[9px] uppercase tracking-widest text-white/20 font-black">TOTAL INVESTIDO</p>
                        <p className="text-2xl font-serif italic text-brand-orange">{maskBRL(order.total_price)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex xl:flex-col items-center gap-3 pt-8 xl:pt-0 border-t xl:border-t-0 xl:border-l border-white/5 xl:pl-10">
                    <button 
                      onClick={() => onUpdateStatus(order.id, order.status === 'paid' ? 'pending' : 'paid')}
                      className={`w-full xl:w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-xl ${order.status === 'paid' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40 hover:bg-emerald-500/20 hover:text-emerald-500'}`}
                      title={order.status === 'paid' ? 'Remover Confirmação' : 'Confirmar Pagamento'}
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      className={`w-full xl:w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-xl ${order.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500'}`}
                      title="Cancelar Participação"
                    >
                      <AlertCircle className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setOrderToDelete(order.id)}
                      className="w-full xl:w-12 h-12 flex items-center justify-center bg-white/5 text-white/20 hover:bg-red-600 hover:text-white transition-all rounded-2xl shadow-xl"
                      title="Excluir Registro"
                    >
                      <Trash2 className="w-6 h-6" />
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
          title="Excluir Registro Permanente?"
          message="Esta ação é irreversível e liberará os números no site imediatamente. Deseja continuar?"
          confirmLabel="Sim, Excluir"
          variant="danger"
        />
      </motion.div>
    </div>
  );
}
