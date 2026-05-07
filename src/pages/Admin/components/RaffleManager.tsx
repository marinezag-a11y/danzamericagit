import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  Save, 
  Ticket, 
  Users, 
  Calendar,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useRaffles, RaffleCampaign, RaffleOrder } from '../../../hooks/useRaffles';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { useProfiles } from '../../../hooks/useProfiles';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { maskBRL, parseBRL, formatDate } from '../../../lib/utils';

interface RaffleManagerProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function RaffleManager({ onAlert }: RaffleManagerProps) {
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

  const handleOpenOrders = async (campaignId: string) => {
    setViewingOrdersId(campaignId);
    setLoadingOrders(true);
    const data = await fetchOrders(campaignId);
    setOrders(data);
    setLoadingOrders(false);
  };

  const handleSaveEmails = async (emails: string) => {
    setSavingEmails(true);
    const res = await updateSetting('notification_emails_raffles', emails);
    if (res.success) {
      onAlert('Configuração Salva', 'Lista de e-mails atualizada.', 'info');
    } else {
      onAlert('Erro ao Salvar', 'Não foi possível atualizar os e-mails.', 'danger');
    }
    setSavingEmails(false);
  };

  if ((loadingRaffles && campaigns.length === 0) || loadingSettings) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  const currentEmails = settings['notification_emails_raffles']?.value || '';

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
            <h4 className="text-xl font-sans italic text-white">Notificações das Rifas</h4>
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
          <div key={campaign.id} className="bg-white/5 border border-white/10 group hover:border-brand-orange/30 transition-all rounded-sm overflow-hidden flex flex-col">
            <div className="aspect-video relative overflow-hidden bg-black">
              <img 
                src={campaign.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2574&auto=format&fit=crop'} 
                alt={campaign.name} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => setEditingCampaign(campaign)}
                  className="p-2 bg-black/60 text-white/60 hover:text-brand-orange hover:bg-black transition-all rounded-full"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setCampaignToDelete(campaign.id)}
                  className="p-2 bg-black/60 text-white/60 hover:text-red-500 hover:bg-black transition-all rounded-full"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                <div className="bg-brand-orange text-white px-3 py-1 text-[8px] uppercase tracking-widest font-bold rounded-full">
                  {campaign.is_active ? 'Ativa' : 'Encerrada'}
                </div>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col space-y-6">
              <div>
                <h4 className="text-xl font-sans italic text-white mb-2">{campaign.name}</h4>
                <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{campaign.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] uppercase tracking-widest text-brand-orange font-bold">Valor do Número</p>
                  <p className="text-lg font-sans text-white">{maskBRL(campaign.price_per_number)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] uppercase tracking-widest text-brand-orange font-bold">Total de Números</p>
                  <p className="text-lg font-sans text-white">{campaign.total_numbers}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex gap-4">
                <button 
                  onClick={() => handleOpenOrders(campaign.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-white/60 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all"
                >
                  <Users className="w-4 h-4" />
                  Ver Pedidos
                </button>
              </div>
            </div>
          </div>
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
              let res;
              if (editingCampaign) {
                res = await updateCampaign(editingCampaign.id, data);
              } else {
                res = await createCampaign(data);
              }
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
          <OrdersModal 
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

function CampaignModal({ campaign, onClose, onSave, onAlert }: { campaign: RaffleCampaign | null, onClose: () => void, onSave: (data: any) => Promise<void>, onAlert: any }) {
  const [name, setName] = useState(campaign?.name || '');
  const [description, setDescription] = useState(campaign?.description || '');
  const [price, setPrice] = useState(campaign?.price_per_number || 0);
  const [total, setTotal] = useState(campaign?.total_numbers || 100);
  const [imageUrl, setImageUrl] = useState(campaign?.image_url || '');
  const [startDate, setStartDate] = useState(campaign?.start_date?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(campaign?.end_date?.split('T')[0] || '');
  const [isActive, setIsActive] = useState(campaign?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-brand-dark border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm p-8 md:p-12 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all">
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-4xl font-serif italic text-white mb-12">
          {campaign ? 'Editar Ação' : 'Nova Ação entre Amigos'}
        </h3>

        <form onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onSave({ 
            name, 
            description, 
            price_per_number: price, 
            total_numbers: total, 
            image_url: imageUrl,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            end_date: endDate ? new Date(endDate).toISOString() : null,
            is_active: isActive
          });
          setSaving(false);
        }} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Título da Ação</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  placeholder="Ex: Rifa Solidária - Nova Fantasia"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Descrição</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  placeholder="Conte os detalhes da ação..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Preço por Número</label>
                  <input 
                    type="text" 
                    required
                    value={maskBRL(price)}
                    onChange={(e) => setPrice(parseBRL(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm text-brand-orange font-bold focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Quantidade de Números</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={total}
                    onChange={(e) => setTotal(parseInt(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Início</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Término</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-sm text-white focus:border-brand-orange outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Foto Ilustrativa</label>
                <div className="aspect-video bg-black/50 border border-white/10 overflow-hidden relative group">
                  {imageUrl ? (
                    <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/10">
                      <ImageIcon className="w-12 h-12 mb-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Sem Foto</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
                    <OptimizedImageUploader 
                      onUploadSuccess={(url) => setImageUrl(url)}
                      onAlert={onAlert}
                      folder="raffles"
                      label={imageUrl ? 'Trocar Foto' : 'Subir Foto'}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/5 space-y-4">
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 accent-brand-orange"
                  />
                  <label htmlFor="is_active" className="text-xs uppercase tracking-widest font-bold text-white/60 cursor-pointer">Ação Ativa no Site</label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex justify-end gap-6">
            <button type="button" onClick={onClose} className="px-10 py-4 text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-white transition-all">Cancelar</button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-12 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {campaign ? 'Salvar Alterações' : 'Criar Ação'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function OrdersModal({ campaign, orders, loading, onClose, onUpdateStatus, onDeleteOrder }: { campaign: RaffleCampaign, orders: RaffleOrder[], loading: boolean, onClose: () => void, onUpdateStatus: (id: string, s: any) => void, onDeleteOrder: (id: string) => void }) {
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
          onConfirm={() => {
            if (orderToDelete) onDeleteOrder(orderToDelete);
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
