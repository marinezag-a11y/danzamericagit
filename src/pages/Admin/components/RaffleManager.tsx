import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  Ticket
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useRaffles, RaffleCampaign, RaffleOrder } from '../../../hooks/useRaffles';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { useProfiles } from '../../../hooks/useProfiles';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { NotificationSettings } from './ui/NotificationSettings';
import { CampaignModal } from './raffles/CampaignModal';
import { RaffleOrdersModal } from './raffles/RaffleOrdersModal';
import { RaffleCard } from './raffles/RaffleCard';

interface RaffleManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
  userRole: string | null;
}

export function RaffleManager({ onAlert, userRole }: RaffleManagerProps) {
  const { 
    campaigns, 
    loading: loadingRaffles, 
    createCampaign, 
    updateCampaign, 
    deleteCampaign,
    fetchOrders,
    updateOrderStatus,
    deleteOrder 
  } = useRaffles();
  const { settings, updateSetting, loading: loadingSettings } = useSiteSettings();
  const { profiles } = useProfiles();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<RaffleCampaign | null>(null);
  const [viewingOrdersId, setViewingOrdersId] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [orders, setOrders] = useState<RaffleOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const handleOpenOrders = async (campaignId: string) => {
    setViewingOrdersId(campaignId);
    setLoadingOrders(true);
    const data = await fetchOrders(campaignId);
    setOrders(data);
    setLoadingOrders(false);
  };

  const handleSaveEmails = async (emails: string) => {
    const res = await updateSetting('notification_emails_raffles', emails);
    if (res.success) {
      onAlert('Configuração Salva', 'Lista de e-mails atualizada.', 'info');
    } else {
      onAlert('Erro ao Salvar', 'Não foi possível atualizar os e-mails.', 'danger');
    }
  };

  if ((loadingRaffles && campaigns.length === 0) || loadingSettings) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  const currentEmails = settings['notification_emails_raffles']?.value || '';

  return (
    <div className="space-y-12">
      {/* Notification Settings */}
      {userRole === 'master' && (
        <NotificationSettings 
          title="Notificações das Rifas"
          description="Selecione os administradores ou insira e-mails manualmente para receber alertas"
          profiles={profiles}
          currentEmails={currentEmails}
          onSave={handleSaveEmails}
        />
      )}

      <div className="flex flex-col gap-4 pt-12 border-t border-white/5">
        <h3 className="text-2xl font-serif italic text-white">Controle de Campanhas</h3>
        <p className="text-xs text-white/40 font-sans tracking-widest uppercase">Gerencie campanhas de rifas e sorteios solidários</p>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-brand-orange text-white px-8 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Nova Ação Entre Amigos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaigns.map((campaign) => (
          <RaffleCard 
            key={campaign.id}
            campaign={campaign}
            onEdit={setEditingCampaign}
            onDelete={setCampaignToDelete}
            onViewOrders={handleOpenOrders}
          />
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-sm">
          <Ticket className="w-12 h-12 text-white/5 mx-auto mb-4" />
          <p className="text-white/20 italic">Nenhuma ação cadastrada. Clique em "Nova Ação" para começar.</p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(isAdding || editingCampaign) && (
          <CampaignModal 
            campaign={editingCampaign}
            onClose={() => {
              setIsAdding(false);
              setEditingCampaign(null);
            }}
            onSave={async (data) => {
              const res = editingCampaign 
                ? await updateCampaign(editingCampaign.id, data) 
                : await createCampaign(data);
              
              if (res.success) {
                onAlert('Sucesso', 'Ação salva com sucesso.', 'info');
                setIsAdding(false);
                setEditingCampaign(null);
              } else {
                onAlert('Erro', res.error, 'danger');
              }
            }}
            onAlert={onAlert}
          />
        )}

        {viewingOrdersId && (
          <RaffleOrdersModal 
            campaign={campaigns.find(c => c.id === viewingOrdersId)!}
            orders={orders}
            loading={loadingOrders}
            onClose={() => setViewingOrdersId(null)}
            onUpdateStatus={async (id, status) => {
              const res = await updateOrderStatus(id, status);
              if (res.success) {
                const order = orders.find(o => o.id === id);
                if (order) {
                  try {
                    await supabase.functions.invoke('send-order', {
                      body: {
                        type: 'status_update',
                        order_id: id,
                        customer_name: order.customer_name,
                        customer_email: order.customer_email,
                        new_status: status
                      }
                    });
                  } catch (err) {
                    console.error('Erro ao enviar e-mail de status:', err);
                  }
                }
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
                onAlert('Status Atualizado', 'Notificação enviada ao cliente.', 'info');
              }
            }}
            onDeleteOrder={async (id) => {
              const order = orders.find(o => o.id === id);
              const res = await deleteOrder(id);
              if (res.success) {
                if (order) {
                  try {
                    await supabase.functions.invoke('send-order', {
                      body: {
                        type: 'order_deletion',
                        order_id: id,
                        customer_name: order.customer_name,
                        customer_email: order.customer_email
                      }
                    });
                  } catch (err) {
                    console.error('Erro ao enviar e-mail de exclusão:', err);
                  }
                }
                setOrders(prev => prev.filter(o => o.id !== id));
                onAlert('Excluído', 'Pedido removido e cliente notificado.', 'info');
              }
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!campaignToDelete}
        onConfirm={async () => {
          if (campaignToDelete) {
            const res = await deleteCampaign(campaignToDelete);
            if (res.success) onAlert('Excluído', 'Campanha removida.', 'info');
            setCampaignToDelete(null);
          }
        }}
        onCancel={() => setCampaignToDelete(null)}
        title="Excluir Ação?"
        message="Isso removerá permanentemente a campanha e todos os seus pedidos. Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  );
}
