import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  Ticket,
  ChevronDown,
  Trash2,
  Save,
  Users,
  Calendar,
  DollarSign,
  Pause,
  Play
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useRaffles, RaffleCampaign, RaffleOrder } from '../../../hooks/useRaffles';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { useProfiles } from '../../../hooks/useProfiles';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { NotificationSettings } from './ui/NotificationSettings';
import { RaffleOrdersModal } from './raffles/RaffleOrdersModal';
import { OptimizedImageUploader } from './OptimizedImageUploader';
import { DancersManager } from './DancersManager';
import { RaffleAnalytics } from './raffles/RaffleAnalytics';

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
  
  const [view, setView] = useState<'campaigns' | 'dancers' | 'stats'>('campaigns');
  const [isAdding, setIsAdding] = useState(false);
  const [viewingOrdersId, setViewingOrdersId] = useState<string | null>(null);
  const [orders, setOrders] = useState<RaffleOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newTotal, setNewTotal] = useState(100);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCost, setNewCost] = useState(0);
  const [creating, setCreating] = useState(false);

  const handleOpenOrders = async (campaignId: string) => {
    setViewingOrdersId(campaignId);
    setLoadingOrders(true);
    const res = await fetchOrders(campaignId);
    if (res.success) setOrders(res.data || []);
    setLoadingOrders(false);
  };

  const handleSaveEmails = async (emails: string) => {
    const res = await updateSetting('notification_emails_raffles', emails);
    if (res.success) {
      onAlert('Sucesso', 'Configurações de notificação salvas.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível salvar as configurações.', 'danger');
    }
  };

  const maskBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const parseBRL = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    return Number(numeric) / 100;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await createCampaign({
      name: newName,
      description: newDescription,
      price_per_number: newPrice,
      total_numbers: newTotal,
      image_url: newImageUrl,
      cost: newCost,
      is_active: true,
      goal_per_dancer: Math.ceil(newTotal / (parseInt(settings['dancers_count']?.value || '19')))
    });
    
    if (res.success) {
      onAlert('Sucesso', 'Nova ação criada com sucesso.', 'info');
      setIsAdding(false);
      setNewName('');
      setNewDescription('');
      setNewPrice(0);
      setNewImageUrl('');
      setNewCost(0);
    } else {
      onAlert('Erro', res.error || 'Erro ao criar campanha', 'danger');
    }
    setCreating(false);
  };

  if ((loadingRaffles && campaigns.length === 0) || loadingSettings) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" /></div>;

  const currentEmails = settings['notification_emails_raffles']?.value || '';

  return (
    <div className="space-y-6 pb-20">
      {/* Sub-tabs for Raffle Section */}
      <div className="flex gap-4 mb-12">
        <button 
          onClick={() => setView('campaigns')}
          className={`px-8 py-4 text-[10px] uppercase tracking-[0.3em] font-bold rounded-xl transition-all border ${
            view === 'campaigns' 
              ? 'bg-brand-orange border-brand-orange text-white shadow-2xl' 
              : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
          }`}
        >
          Campanhas de Rifa
        </button>
        <button 
          onClick={() => setView('dancers')}
          className={`px-8 py-4 text-[10px] uppercase tracking-[0.3em] font-bold rounded-xl transition-all border ${
            view === 'dancers' 
              ? 'bg-brand-orange border-brand-orange text-white shadow-2xl' 
              : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
          }`}
        >
          Bailarinos Participantes
        </button>
        <button 
          onClick={() => setView('stats')}
          className={`px-8 py-4 text-[10px] uppercase tracking-[0.3em] font-bold rounded-xl transition-all border ${
            view === 'stats' 
              ? 'bg-brand-orange border-brand-orange text-white shadow-2xl' 
              : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
          }`}
        >
          Desempenho e Vendas
        </button>
      </div>

      {view === 'campaigns' ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {userRole === 'master' && (
            <div className="bg-black/10 border border-white/5 rounded-[2.5rem] p-10 mb-12">
              <NotificationSettings 
                title="Notificações das Rifas"
                description="Selecione os administradores ou insira e-mails manualmente para receber alertas"
                profiles={profiles}
                currentEmails={currentEmails}
                onSave={handleSaveEmails}
              />
            </div>
          )}

          {/* Accordion for New Campaign */}
          <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
            isAdding 
              ? 'bg-black/30 border-white/10 shadow-2xl' 
              : 'bg-black/10 border-white/5 hover:border-white/20'
          }`}>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="w-full p-10 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                  isAdding 
                    ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange' 
                    : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'
                }`}>
                  <Plus className={`w-6 h-6 transition-transform duration-500 ${isAdding ? 'rotate-45' : ''}`} />
                </div>
                <div className="text-left">
                  <h3 className={`text-2xl font-serif italic transition-all duration-500 ${
                    isAdding ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                  }`}>
                    Nova Ação Entre Amigos
                  </h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">Criar sorteio ou rifa solidária</p>
                </div>
              </div>
            </button>

            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <div className="px-12 pb-12">
                    <form onSubmit={handleCreate} className="space-y-10">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título da Ação</label>
                            <input 
                              type="text" required value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Preço/Número</label>
                              <input 
                                type="text" value={maskBRL(newPrice)}
                                onChange={(e) => setNewPrice(parseBRL(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-brand-orange font-bold rounded-2xl shadow-inner text-xl"
                              />
                            </div>
                            <div className="space-y-4">
                              <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Total de Números</label>
                              <input 
                                type="number" value={newTotal}
                                onChange={(e) => setNewTotal(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white font-bold rounded-2xl shadow-inner text-xl"
                              />
                            </div>

                            <div className="space-y-4">
                              <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Custo da Ação (Débito)</label>
                              <input 
                                type="text" value={maskBRL(newCost)}
                                onChange={(e) => setNewCost(parseBRL(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-red-500 font-bold rounded-2xl shadow-inner text-xl"
                              />
                            </div>
                            <div className="space-y-4">
                              <p className="text-[9px] text-brand-orange mt-3 font-bold uppercase tracking-[0.2em] ml-1">
                                Meta: {Math.ceil(newTotal / (parseInt(settings['dancers_count']?.value || '19')))} rifas / bailarino
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Descrição da Ação</label>
                            <textarea 
                              rows={3} value={newDescription}
                              onChange={(e) => setNewDescription(e.target.value)}
                              placeholder="Descreva os prêmios e detalhes da ação..."
                              className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl resize-none shadow-inner"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-8">
                           <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Imagem e Pré-visualização</label>
                           <div className="aspect-video bg-black rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl group">
                             <img src={newImageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt="" />
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8">
                               <OptimizedImageUploader 
                                 onUploadSuccess={(url) => setNewImageUrl(url)}
                                 onAlert={onAlert}
                                 folder="raffles"
                                 maxWidth={800}
                               />
                             </div>
                           </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <button 
                          type="submit" disabled={creating}
                          className="px-12 py-5 bg-brand-orange text-white font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-brand-dark transition-all disabled:opacity-50 shadow-2xl rounded-xl flex items-center gap-4"
                        >
                          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-5 h-5" />}
                          Lançar Nova Ação
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* List of Raffles as Accordions */}
          <div className="space-y-4 pt-12">
            <div className="flex flex-col gap-2 ml-1 mb-6">
              <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">Ações Ativas ({campaigns.length})</h4>
              <div className="h-px w-12 bg-white/5" />
            </div>
            
            {campaigns.map((campaign, index) => (
              <RaffleAccordion 
                key={campaign.id} 
                campaign={campaign} 
                index={index + 1}
                onUpdate={updateCampaign} 
                onDelete={deleteCampaign}
                onOpenOrders={handleOpenOrders}
                onAlert={onAlert}
                settings={settings}
              />
            ))}
          </div>
        </div>
      ) : view === 'dancers' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DancersManager onAlert={onAlert} />
        </div>
      ) : (
        <RaffleAnalytics onAlert={onAlert} />
      )}

      <AnimatePresence>
        {viewingOrdersId && (
          <RaffleOrdersModal 
            campaign={campaigns.find(c => c.id === viewingOrdersId) || campaigns[0]}
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
                    console.error('Erro ao enviar e-mail:', err);
                  }
                }
                onAlert('Status Atualizado', 'Notificação enviada ao cliente.', 'info');
              }
            }}
            onDeleteOrder={async (id) => {
              const res = await deleteOrder(id);
              if (res.success) {
                setOrders(prev => prev.filter(o => o.id !== id));
                onAlert('Excluído', 'Pedido removido com sucesso.', 'info');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface RaffleAccordionProps {
  campaign: RaffleCampaign;
  index: number;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onOpenOrders: (id: string) => Promise<void>;
  onAlert: (t: string, m: string, v: any) => void;
  settings: any;
}

const RaffleAccordion: React.FC<RaffleAccordionProps> = ({ campaign, index, onUpdate, onDelete, onOpenOrders, onAlert, settings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localName, setLocalName] = useState(campaign.name);
  const [localDescription, setLocalDescription] = useState(campaign.description);
  const [localPrice, setLocalPrice] = useState(campaign.price_per_number);
  const [localTotal, setLocalTotal] = useState(campaign.total_numbers);
  const [localImageUrl, setLocalImageUrl] = useState(campaign.image_url);
  const [localCost, setLocalCost] = useState(campaign.cost || 0);
  const [itemToDelete, setItemToDelete] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setLocalName(campaign.name);
      setLocalDescription(campaign.description);
      setLocalPrice(campaign.price_per_number);
      setLocalTotal(campaign.total_numbers);
      setLocalImageUrl(campaign.image_url);
      setLocalCost(campaign.cost || 0);
    }
  }, [campaign, isOpen]);

  const maskBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const parseBRL = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    return Number(numeric) / 100;
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate(campaign.id, {
      name: localName,
      description: localDescription,
      price_per_number: localPrice,
      total_numbers: localTotal,
      image_url: localImageUrl,
      cost: localCost,
      goal_per_dancer: Math.ceil(localTotal / (parseInt(settings['dancers_count']?.value || '19')))
    });
    setSaving(false);
    if (result.success) {
      setIsOpen(false);
      onAlert('Sucesso', 'Ação atualizada com sucesso.', 'info');
    } else {
      onAlert('Erro', 'Não foi possível salvar.', 'danger');
    }
  };

  return (
    <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
      isOpen 
        ? 'bg-black/30 border-white/10 shadow-2xl' 
        : 'bg-black/10 border-white/5 hover:border-white/20'
    } ${!campaign.is_active ? 'opacity-50 grayscale' : ''}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-10 flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <div className="text-[10px] font-bold text-white/10 group-hover:text-brand-orange transition-colors font-sans w-6 text-center">
            {index.toString().padStart(2, '0')}
          </div>
          <div className="w-16 h-12 bg-black rounded-lg overflow-hidden border border-white/5 relative flex-shrink-0">
             <img src={campaign.image_url} className="w-full h-full object-cover opacity-60" alt="" />
          </div>
          <div className="text-left">
            <h3 className={`text-xl font-serif italic transition-all duration-500 ${
              isOpen ? 'text-white' : 'text-white/40 group-hover:text-white/60'
            }`}>
              {campaign.name}
            </h3>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">
              {maskBRL(campaign.price_per_number)} • {campaign.total_numbers} números
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/10 group-hover:text-white/40 transition-all duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-12 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Título da Ação</label>
                    <input 
                      type="text" value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Preço/Número</label>
                      <input 
                        type="text" value={maskBRL(localPrice)}
                        onChange={(e) => setLocalPrice(parseBRL(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-brand-orange font-bold rounded-2xl shadow-inner text-xl"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Total de Números</label>
                      <input 
                        type="number" value={localTotal}
                        onChange={(e) => setLocalTotal(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white font-bold rounded-2xl shadow-inner text-xl"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Custo da Ação (Débito)</label>
                      <input 
                        type="text" value={maskBRL(localCost)}
                        onChange={(e) => setLocalCost(parseBRL(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-red-500 font-bold rounded-2xl shadow-inner text-xl"
                      />
                    </div>
                    <div className="space-y-4">
                      <p className="text-[9px] text-white/20 italic ml-1">* Atenção: Alterar o total de números após o início das vendas pode causar inconsistências se o novo total for menor que o número de bilhetes já vendidos.</p>
                      <p className="text-[10px] text-brand-orange mt-3 font-bold uppercase tracking-[0.2em] ml-1 bg-brand-orange/5 p-2 rounded-lg border border-brand-orange/10 inline-block">
                        Meta: {Math.ceil(localTotal / (parseInt(settings['dancers_count']?.value || '19')))} rifas / bailarino
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Descrição</label>
                    <textarea 
                      rows={4} value={localDescription}
                      onChange={(e) => setLocalDescription(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-brand-orange/40 outline-none transition-all text-white/80 rounded-2xl resize-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Imagem (Pré-visualização)</label>
                  <div className="aspect-video bg-black rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl group">
                    <img src={localImageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt="" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8">
                      <OptimizedImageUploader 
                        onUploadSuccess={(url) => setLocalImageUrl(url)}
                        onAlert={onAlert}
                        folder="raffles"
                        label="Trocar Foto"
                        maxWidth={800}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-white/5 flex justify-between items-center">
                <div className="flex gap-4">
                  <button 
                    onClick={() => onOpenOrders(campaign.id)}
                    className="flex items-center gap-3 px-8 py-4 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all"
                  >
                    <Users className="w-4 h-4" />
                    Ver Pedidos
                  </button>
                  <button 
                    onClick={() => onUpdate(campaign.id, { is_active: !campaign.is_active })}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all ${
                      campaign.is_active 
                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' 
                        : 'bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white'
                    }`}
                  >
                    <Pause className="w-4 h-4" />
                    {campaign.is_active ? 'Pausar' : 'Ativar'}
                  </button>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setItemToDelete(true)}
                    className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-white hover:bg-red-500 transition-all rounded-xl"
                  >
                    Excluir
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-10 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all rounded-xl flex items-center gap-3 shadow-2xl disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={itemToDelete}
        onConfirm={async () => {
          const res = await onDelete(campaign.id);
          if (res.success) onAlert('Excluído', 'Campanha removida.', 'info');
          setItemToDelete(false);
        }}
        onCancel={() => setItemToDelete(false)}
        title="Excluir Ação?"
        message="Isso removerá permanentemente a campanha e todos os seus pedidos."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  );
}
