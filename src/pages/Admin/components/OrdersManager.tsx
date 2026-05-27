import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Plus, 
  Loader2, 
  Users,
  Check,
  RefreshCw,
  Mail,
  AlertCircle,
  Search,
  Calendar,
  Filter,
  User,
  Trash2,
  ChevronDown,
  XCircle,
  ArrowUpDown,
  ChevronUp
} from 'lucide-react';
import { useHelpOrders } from '../../../hooks/useHelpOrders';
import { useProfiles } from '../../../hooks/useProfiles';
import { useDancers } from '../../../hooks/useDancers';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { useRaffles } from '../../../hooks/useRaffles';
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
  const { orders, loading: loadingOrders, error, updateOrder, addOrder, deleteOrder, refresh } = useHelpOrders();
  const { settings, updateSetting, loading: loadingSettings } = useSiteSettings();
  const { campaigns } = useRaffles();
  const { profiles } = useProfiles();
  const { dancers } = useDancers();
  const [savingEmails, setSavingEmails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'sent' | 'cancelled' | 'unconfirmed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'store' | 'raffle'>('all');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');

  const duplicateNumbers = React.useMemo(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const counts: Record<string, number> = {};

    (orders || []).forEach(o => {
      if (o.status !== 'cancelled' && o.status !== 'unconfirmed' && o.type === 'raffle') {
        // Ignorar ordens pendentes com mais de 5 minutos para alinhar com a regra de expiração do banco
        if (o.status === 'pending') {
          const createdAtDate = new Date(o.created_at);
          if (createdAtDate < fiveMinutesAgo) {
            return;
          }
        }

        (o.selected_numbers || []).forEach((n: number) => {
          const key = `${o.campaign_id}:${n}`;
          counts[key] = (counts[key] || 0) + 1;
        });
      }
    });
    return Object.keys(counts).filter(key => counts[key] > 1);
  }, [orders]);
  
  // New Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dancerFilter, setDancerFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting State
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isAskingReason, setIsAskingReason] = useState(false);
  const [resendingAll, setResendingAll] = useState(false);

  const failedNotifications = (orders || []).filter(o => !o.notification_sent && (o.status === 'paid' || o.status === 'sent'));

  const handleResendAllFailed = async () => {
    if (failedNotifications.length === 0) return;
    
    setResendingAll(true);
    onAlert('Iniciando Reenvio', `Preparando para processar ${failedNotifications.length} e-mails...`, 'info');
    
    let successCount = 0;
    let failCount = 0;

    // Process in small chunks to avoid timeouts and show progress
    const chunks = [];
    const chunkSize = 3; // 3 parallel calls at a time is safe
    for (let i = 0; i < failedNotifications.length; i += chunkSize) {
      chunks.push(failedNotifications.slice(i, i + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
      const currentChunk = chunks[i];
      const processedCount = i * chunkSize + currentChunk.length;
      
      onAlert('Processando Reenvio', `Enviando lote ${i + 1} de ${chunks.length} (${processedCount}/${failedNotifications.length} concluídos)...`, 'info');

      await Promise.all(currentChunk.map(async (order) => {
        try {
          const isRaffle = order.type === 'raffle';
          const payload: any = {
            order_id: order.id,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_email: order.customer_email,
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
          successCount++;
        } catch (err) {
          console.error(`Falha ao reenviar e-mail para pedido ${order.id}:`, err);
          failCount++;
        }
      }));
    }

    if (successCount > 0) {
      onAlert('Reenvio Concluído', `${successCount} e-mails reenviados com sucesso.${failCount > 0 ? ` (${failCount} falhas)` : ''}`, 'info');
      refresh();
    } else if (failCount > 0) {
      onAlert('Falha no Reenvio', `Não foi possível reenviar os e-mails. Verifique se o limite diário de envios foi atingido.`, 'danger');
    }
    
    setResendingAll(false);
  };

  const filteredOrders = (orders || [])
    .filter(o => {
      const matchesStatus = filter === 'all' 
        ? (o?.status !== 'cancelled') 
        : o?.status === filter;
      
      // Se uma campanha específica estiver selecionada, força a exibição apenas de pedidos do tipo 'raffle' (rifa)
      const matchesType = selectedCampaignId !== 'all'
        ? o?.type === 'raffle'
        : (typeFilter === 'all' || o?.type === typeFilter);

      const matchesCampaign = selectedCampaignId === 'all' || (o?.type === 'raffle' && o?.campaign_id === selectedCampaignId);
      
      const cleanSearch = searchTerm.trim().toLowerCase().replace(/^#/, '');
      const cleanSearchAsNum = parseInt(cleanSearch, 10);
      const isPureNumeric = /^\d+$/.test(cleanSearch);
      
      let matchesSearch = !searchTerm;
      
      if (searchTerm.trim().startsWith('#') || (isPureNumeric && cleanSearch.length <= 4)) {
        // Busca PRECISA por número de rifa (ex: #3, #003, 3) para fins de sorteio
        matchesSearch = o.type === 'raffle' && (o.selected_numbers || []).some((n: number) => {
          return n === cleanSearchAsNum || String(n).padStart(3, '0') === cleanSearch;
        });
      } else {
        // Busca geral por texto/telefone/id
        matchesSearch = !searchTerm || 
          o.customer_name?.toLowerCase()?.includes(cleanSearch) ||
          o.id?.toLowerCase()?.includes(cleanSearch) ||
          o.product_name?.toLowerCase()?.includes(cleanSearch) ||
          o.customer_phone?.toLowerCase()?.includes(cleanSearch) ||
          o.customer_email?.toLowerCase()?.includes(cleanSearch);
      }

      const matchesDancer = dancerFilter === 'all' || o.dancer_name === dancerFilter;

      const orderDate = new Date(o.created_at).toISOString().split('T')[0];
      const matchesStartDate = !startDate || orderDate >= startDate;
      const matchesEndDate = !endDate || orderDate <= endDate;

      return matchesStatus && matchesType && matchesCampaign && matchesSearch && matchesDancer && matchesStartDate && matchesEndDate;
    }).sort((a, b) => {
      let valA: any = a[sortBy as keyof typeof a];
      let valB: any = b[sortBy as keyof typeof b];

      if (sortBy === 'total_price') {
        valA = a.total_price || a.product_price || 0;
        valB = b.total_price || b.product_price || 0;
      } else if (sortBy === 'net_margin') {
        const getNet = (o: any) => {
          const price = o.total_price || o.product_price || 0;
          if (o.type === 'raffle') return price;
          const totalCost = (o.items || []).reduce((s: number, i: any) => s + (Number(i.cost_price || 0) * (i.quantity || 1)), 0);
          return price - totalCost;
        };
        valA = getNet(a);
        valB = getNet(b);
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  const stats = {
    total: filteredOrders.length,
    paid: filteredOrders.filter(o => o?.status === 'paid' || o?.status === 'sent').length,
    totalValue: filteredOrders.filter(o => o?.status === 'paid' || o?.status === 'sent').reduce((sum, o) => sum + (o?.total_price || o?.product_price || 0), 0),
    totalNetValue: filteredOrders.filter(o => o?.status === 'paid' || o?.status === 'sent').reduce((sum, o) => {
      const price = o?.total_price || o?.product_price || 0;
      if (o.type === 'raffle') return sum + price;
      const items = o?.items || [];
      const totalCost = items.reduce((s: number, i: any) => s + (Number(i.cost_price || 0) * (i.quantity || 1)), 0);
      return sum + price - totalCost;
    }, 0)
  };

    const handlePrintReport = () => {
    const reportDate = new Date().toLocaleString('pt-BR');
    const campaignName = selectedCampaignId === 'all' 
      ? 'Todas' 
      : campaigns.find(c => c.id === selectedCampaignId)?.name || 'Campanha Selecionada';
    const filterInfo = `Filtros: Status [${filter}] | Tipo [${typeFilter}] | Ação [${campaignName}] | Bailarino [${dancerFilter}] | Período [${startDate || 'Início'} - ${endDate || 'Hoje'}]`;

    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Pedidos - Danzamerica</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;650;800&display=swap');
            @page { size: portrait; margin: 8mm; }
            body { font-family: 'Inter', sans-serif; padding: 10px; color: #1a1a1a; margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 12px; margin-bottom: 20px; }
            .logo { font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #BE3144; }
            .meta { font-size: 8px; color: #666; text-align: right; line-height: 1.4; }
            .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
            .kpi-card { background: #fdfdfd; padding: 12px; border-radius: 8px; border: 1px solid #eee; }
            .kpi-label { font-size: 7.5px; text-transform: uppercase; font-weight: 800; color: #999; margin-bottom: 4px; letter-spacing: 0.5px; }
            .kpi-value { font-size: 14px; font-weight: 800; color: #1a1a1a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th { text-align: left; font-size: 8.5px; text-transform: uppercase; color: #999; padding: 8px 10px; border-bottom: 2px solid #1a1a1a; font-weight: 850; letter-spacing: 0.5px; }
            td { padding: 8px 10px; font-size: 9.5px; border-bottom: 1px solid #f0f0f0; color: #333; line-height: 1.3; }
            .status { font-weight: 800; text-transform: uppercase; font-size: 7.5px; letter-spacing: 0.5px; }
            .nowrap { white-space: nowrap; }
            .numbers-list { font-family: monospace; color: #BE3144; font-weight: 800; font-size: 8.5px; margin-top: 2.5px; background: rgba(190, 49, 68, 0.05); padding: 2px 6px; border-radius: 4px; display: inline-block; }
            .status-pending { color: #d97706; }
            .status-paid { color: #16a34a; }
            .status-sent { color: #2563eb; }
            .status-cancelled { color: #dc2626; }
            .status-unconfirmed { color: #b45309; }
            .footer { margin-top: 30px; font-size: 7.5px; color: #ccc; text-align: center; letter-spacing: 0.5px; }
            @media print { 
              .no-print { display: none; } 
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">DANZAMERICA</div>
            <div class="meta">
              <p><b>Gerado em:</b> ${reportDate}</p>
              <p>${filterInfo}</p>
            </div>
          </div>
          
          <h2 style="font-size: 12px; margin-bottom: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #333;">Relatório Consolidado de Pedidos</h2>

          <div class="kpi-grid">
            <div class="kpi-card">
              <p class="kpi-label">Pedidos Filtrados</p>
              <p class="kpi-value">${stats.total}</p>
            </div>
            <div class="kpi-card">
              <p class="kpi-label">Total Bruto</p>
              <p class="kpi-value">${maskBRL(stats.totalValue)}</p>
            </div>
            <div class="kpi-card">
              <p class="kpi-label">Total Líquido</p>
              <p class="kpi-value" style="color: #BE3144">${maskBRL(stats.totalNetValue)}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 1%;">Data</th>
                <th style="width: 25%;">Cliente</th>
                <th style="width: 50%;">Produto / Ação</th>
                <th style="width: 12%;">Valor</th>
                <th style="width: 12%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(o => {
                const isRaffle = o.type === 'raffle';
                const numbers = o.selected_numbers || [];
                const numbersHtml = isRaffle && numbers.length > 0
                  ? `<div class="numbers-list">[${numbers.map(n => `#${String(n).padStart(2, '0')}`).join(', ')}]</div>`
                  : '';
                
                const statusLabels = {
                  pending: 'Pendente',
                  paid: 'Pago',
                  sent: 'Enviado',
                  cancelled: 'Cancelado',
                  unconfirmed: 'Não Conf.'
                };
                const statusLabel = statusLabels[o.status as keyof typeof statusLabels] || o.status;
                const statusClass = `status-${o.status}`;

                return `
                  <tr>
                    <td class="nowrap">${new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style="font-weight: 650;">${o.customer_name}</td>
                    <td>
                      <div>${o.product_name}</div>
                      ${numbersHtml}
                    </td>
                    <td class="nowrap" style="font-weight: 650; font-family: monospace;">${maskBRL(o.total_price || o.product_price || 0)}</td>
                    <td class="status ${statusClass} nowrap">${statusLabel}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">Danzamerica - Sistema de Gestão Interna</div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => {
                // Opcional: fechar a aba após imprimir (alguns mobile não permitem)
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (!printWindow) {
      onAlert('Pop-up Bloqueado', 'Por favor, habilite pop-ups para visualizar o relatório no navegador.', 'warning');
      return;
    }
    
    // Limpeza da URL do blob após um tempo
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 opacity-20" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-orange" /> : <ChevronDown className="w-3 h-3 text-brand-orange" />;
  };

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

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Gestão Financeira</p>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-serif text-white italic">Controle de Pedidos</h2>
            
            <button 
              onClick={() => refresh()}
              disabled={loadingOrders}
              className={`p-2 rounded-full hover:bg-white/5 transition-all ${loadingOrders ? 'opacity-50' : 'active:scale-90'}`}
              title="Atualizar lista de pedidos"
            >
              <RefreshCw className={`w-5 h-5 text-brand-orange ${loadingOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {campaigns.length > 0 && (
            <select
              value={selectedCampaignId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCampaignId(val);
                if (val !== 'all') {
                  setTypeFilter('raffle');
                }
              }}
              className="px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] uppercase tracking-widest font-bold rounded-full outline-none focus:border-brand-orange/50 transition-all cursor-pointer appearance-none pr-10 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '12px' }}
            >
              <option value="all" className="bg-brand-dark">Todas as Ações</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id} className="bg-brand-dark">{c.name}</option>
              ))}
            </select>
          )}

          <button 
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-white text-brand-dark px-6 py-3 text-[10px] uppercase tracking-widest font-black transition-all hover:bg-brand-orange hover:text-white rounded-sm shadow-xl"
          >
            <TrendingUp className="w-3 h-3" /> Emitir Relatório
          </button>
          
          <button 
            onClick={handleResendAllFailed}
            disabled={resendingAll}
            className={`flex items-center gap-2 px-6 py-3 rounded-sm transition-all border ${
              failedNotifications.length > 0 
                ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20 animate-pulse hover:animate-none' 
                : 'bg-white/10 text-white/60 border-white/10 hover:bg-white/20'
            } ${resendingAll ? 'opacity-50' : ''}`}
          >
            <Mail className="w-3 h-3" />
            <span className="text-[9px] uppercase tracking-widest font-black">
              {resendingAll ? 'Processando...' : failedNotifications.length > 0 ? `Reenviar ${failedNotifications.length} Falhas` : 'Reenviar E-mails'}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Actions (TOPO) */}
      <div className="space-y-4">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white/5 border border-white/10 p-6 rounded-sm shadow-xl">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'paid', 'sent', 'cancelled', 'unconfirmed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm ${filter === f ? 'bg-brand-orange text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'paid' ? 'Pagos' : f === 'sent' ? 'Enviados' : f === 'cancelled' ? 'Cancelados' : 'Pagto Não confirmado'}
                </button>
              ))}
            </div>

            <div className="w-[1px] h-6 bg-white/10 hidden lg:block" />

            <div className="flex flex-wrap gap-2">
              {(['all', 'store', 'raffle'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => {
                    setTypeFilter(t);
                    if (t !== 'raffle') {
                      setSelectedCampaignId('all');
                    }
                  }}
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

        {/* Advanced Filters */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-sm space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-orange/50" />
            <input 
              type="text"
              placeholder="Pesquisar por nome do cliente, ID do pedido ou nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-black/40 border border-white/10 pl-12 pr-12 text-sm outline-none focus:border-brand-orange transition-all text-white rounded-sm placeholder:text-white/20"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative h-11">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <select
                value={dancerFilter}
                onChange={(e) => setDancerFilter(e.target.value)}
                className="w-full h-full bg-black/40 border border-white/10 pl-12 pr-10 text-xs outline-none focus:border-brand-orange transition-all text-white rounded-sm appearance-none cursor-pointer"
              >
                <option value="all">Filtrar por Bailarino: Todos</option>
                {dancers.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none" />
            </div>

            <div className="relative h-11">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-full bg-black/40 border border-white/10 pl-12 pr-4 text-[10px] outline-none focus:border-brand-orange transition-all text-white rounded-sm"
              />
            </div>

            <div className="relative h-11">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-full bg-black/40 border border-white/10 pl-12 pr-4 text-[10px] outline-none focus:border-brand-orange transition-all text-white rounded-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5">
            <button 
              onClick={() => {
                setSearchTerm('');
                setDancerFilter('all');
                setStartDate('');
                setEndDate('');
                setFilter('all');
                setTypeFilter('all');
                setSelectedCampaignId('all');
              }}
              className="group flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-all text-[10px] uppercase tracking-[0.2em] font-bold rounded-sm border border-white/10"
            >
              <XCircle className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
              Limpar Filtros
            </button>

            <div className="flex items-center gap-8 px-8 py-3 bg-black/40 border border-white/10 rounded-full shadow-2xl">
              <div className="flex flex-col items-center">
                <span className="text-[7px] uppercase tracking-[0.3em] text-white/20 font-bold mb-1">Resultados</span>
                <span className="text-lg font-mono text-white font-bold leading-none">{filteredOrders.length}</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[7px] uppercase tracking-[0.3em] text-white/20 font-bold mb-1">Nº Vendidos</span>
                <span className="text-lg font-mono text-brand-orange font-bold leading-none">
                  {filteredOrders.reduce((sum, o) => {
                    if (o.status !== 'paid' && o.status !== 'sent') return sum;
                    if (o.type === 'raffle') return sum + Math.max(o.selected_numbers?.length || 0, 1);
                    const itemsQty = (o.items || []).reduce((s, item) => s + (item.quantity || 0), 0);
                    return sum + Math.max(itemsQty, 1);
                  }, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards (AGORA ABAIXO DOS FILTROS E DINÂMICOS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<ShoppingBag className="w-5 h-5 text-white/40" />} label="Pedidos Filtrados" value={stats.total} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Confirmados" value={stats.paid} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-white" />} label="Total Bruto" value={maskBRL(stats.totalValue)} bgClass="bg-white/5 border-white/10" labelClass="text-white/40" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-white" />} label="Total Líquido" value={maskBRL(stats.totalNetValue)} bgClass="bg-brand-orange border-brand-orange" labelClass="text-white/80" />
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-sm shadow-2xl">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-left bg-white/5">
              <th 
                className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">Data <SortIndicator column="created_at" /></div>
              </th>
              <th 
                className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => handleSort('customer_name')}
              >
                <div className="flex items-center gap-2">Cliente <SortIndicator column="customer_name" /></div>
              </th>
              <th 
                className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => handleSort('product_name')}
              >
                <div className="flex items-center gap-2">Produto <SortIndicator column="product_name" /></div>
              </th>
              <th 
                className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => handleSort('total_price')}
              >
                <div className="flex items-center gap-2">Valor <SortIndicator column="total_price" /></div>
              </th>
              <th 
                className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold text-emerald-500 cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => handleSort('net_margin')}
              >
                <div className="flex items-center gap-2">Margem Líquida <SortIndicator column="net_margin" /></div>
              </th>
              <th 
                className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">Status <SortIndicator column="status" /></div>
              </th>
              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <OrderRow 
                  key={order.id} 
                  order={order} 
                  settings={settings}
                  dancers={dancers}
                  onUpdate={updateOrder} 
                  onDelete={() => setOrderToDelete(order.id)} 
                  onAlert={onAlert}
                  hasConflict={order.type === 'raffle' && (order.selected_numbers || []).some((n: number) => duplicateNumbers.includes(`${order.campaign_id}:${n}`))}
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
