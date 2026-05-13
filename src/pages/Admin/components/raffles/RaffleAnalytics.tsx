import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  RefreshCw, 
  Printer
} from 'lucide-react';
import { useRaffleAnalytics } from '../../../../hooks/useRaffleAnalytics';

interface RaffleAnalyticsProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function RaffleAnalytics({ onAlert }: RaffleAnalyticsProps) {
  const { stats: raffleStats, loading, refresh } = useRaffleAnalytics();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handlePrintReport = () => {
    // Reutilizando a lógica de impressão focada apenas nesta seção
    const printContent = document.getElementById('raffle-report-content')?.innerHTML;
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    
    const now = new Date();
    const reportDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const selectedCampaignName = selectedCampaignId === 'all' 
      ? 'Todas as Ações' 
      : raffleStats.campaignsProgress.find(c => c.id === selectedCampaignId)?.name || 'Campanha Selecionada';

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Relatório de Vendas - ${selectedCampaignName}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; font-size: 11px; padding: 20px; }
            .header { border-bottom: 2px solid #FF5A1F; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { color: #FF5A1F; text-transform: uppercase; font-size: 18px; margin: 0; }
            .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
            .kpi-card { background: #f9f9f9; padding: 15px; border-radius: 4px; border: 1px solid #eee; }
            .kpi-label { font-size: 8px; text-transform: uppercase; color: #999; margin-bottom: 5px; font-weight: bold; }
            .kpi-value { font-size: 20px; font-weight: 800; }
            .section-title { color: #FF5A1F; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin: 25px 0 10px; font-weight: 800; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #eee; font-size: 9px; color: #666; text-transform: uppercase; }
            td { padding: 8px; border-bottom: 1px solid #f0f0f0; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Relatório de Vendas</h1>
              <p style="color: #666; margin-top: 4px;">Filtro: <strong>${selectedCampaignName}</strong></p>
            </div>
            <div style="text-align: right">Gerado em: ${reportDate}</div>
          </div>
          
          <div class="kpi-grid">
            <div class="kpi-card">
              <p class="kpi-label">Arrecadação Bruta</p>
              <p class="kpi-value">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.totalRevenue)}</p>
            </div>
            <div class="kpi-card">
              <p class="kpi-label">Custo Total</p>
              <p class="kpi-value" style="color: #ef4444">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.totalCost)}</p>
            </div>
            <div class="kpi-card">
              <p class="kpi-label">Lucro Líquido</p>
              <p class="kpi-value" style="color: #10b981">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.netProfit)}</p>
            </div>
          </div>

          <h3 class="section-title">Ranking de Talentos (Top Apoios)</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Bailarino(a)</th>
                <th class="right">Bilhetes</th>
                <th class="right">Total Arrecadado</th>
              </tr>
            </thead>
            <tbody>
              ${displayStats.topDancers.map((d, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${d.name}</td>
                  <td class="right">${d.ticketCount}</td>
                  <td class="right">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.totalSales)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3 class="section-title">Resumo por Campanha</h3>
          <table>
            <thead>
              <tr>
                <th>Ação / Rifa</th>
                <th class="right">Vendidos / Meta</th>
                <th class="right">Progresso</th>
              </tr>
            </thead>
            <tbody>
              ${raffleStats.campaignsProgress.map(c => `
                <tr style="${selectedCampaignId !== 'all' && selectedCampaignId !== c.id ? 'opacity: 0.3' : ''}">
                  <td>${c.name}</td>
                  <td class="right">${c.ticketsVendidos} / ${c.metaTickets}</td>
                  <td class="right">${Math.round((c.ticketsVendidos / c.metaTickets) * 100)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 600);
  };

  // Filtered Raffle Stats
  const filteredOrders = selectedCampaignId === 'all' 
    ? raffleStats.allOrders 
    : raffleStats.allOrders.filter(o => o.campaign_id === selectedCampaignId);

  const totalCost = selectedCampaignId === 'all'
    ? raffleStats.campaignsProgress.reduce((sum, c) => sum + Number(c.cost || 0), 0)
    : (raffleStats.campaignsProgress.find(c => c.id === selectedCampaignId)?.cost || 0);

  const displayStats = selectedCampaignId === 'all' 
    ? { ...raffleStats, totalCost, netProfit: raffleStats.totalRevenue - totalCost }
    : (() => {
        const dancerMap: Record<string, any> = {};
        let rev = 0;
        let tks = 0;

        filteredOrders.forEach(o => {
          if (o.status === 'cancelled') return;
          
          const price = Number(o.total_price || 0);
          const tickets = (o.selected_numbers || []).length;
          const dancer = o.dancer_name || 'Geral';
          rev += price;
          tks += tickets;

          if (!dancerMap[dancer]) {
            dancerMap[dancer] = { 
              name: dancer, 
              totalSales: 0, 
              orderCount: 0, 
              ticketCount: 0,
              goal: o.raffle_campaigns?.goal_per_dancer || 53
            };
          }
          dancerMap[dancer].totalSales += price;
          dancerMap[dancer].orderCount += 1;
          dancerMap[dancer].ticketCount += tickets;
        });

        return {
          totalRevenue: rev,
          totalTickets: tks,
          totalCost: Number(totalCost),
          netProfit: rev - Number(totalCost),
          avgTicketPrice: tks > 0 ? rev / tks : 0,
          topDancers: Object.values(dancerMap).sort((a: any, b: any) => b.totalSales - a.totalSales),
          campaignsProgress: raffleStats.campaignsProgress
        };
      })();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header com Filtros e Ações */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 p-6 rounded-[1.5rem] border border-white/10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-orange/10 rounded-2xl">
            <BarChart3 className="w-6 h-6 text-brand-orange" />
          </div>
          <div>
            <h3 className="text-xl font-serif italic text-white">Análise de Desempenho</h3>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Monitoramento em tempo real das ações</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {raffleStats.campaignsProgress.length > 0 && (
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 text-white text-[10px] uppercase tracking-widest font-bold rounded-full outline-none focus:border-brand-orange/50 transition-all cursor-pointer appearance-none pr-10 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px' }}
            >
              <option value="all" className="bg-brand-dark">Todas as Ações</option>
              {raffleStats.campaignsProgress.map(c => (
                <option key={c.id} value={c.id} className="bg-brand-dark">{c.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleRefresh}
            className="p-3 bg-white/5 border border-white/10 text-white/40 hover:text-white rounded-full transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-black rounded-full hover:bg-white hover:text-brand-dark transition-all shadow-lg"
          >
            <Printer className="w-4 h-4" />
            Imprimir Dados
          </button>
        </div>
      </div>

      <div id="raffle-report-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 p-8 rounded-2xl group hover:border-brand-orange/30 transition-all"
          >
            <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Arrecadação Bruta</p>
            <p className="text-3xl font-sans text-white mb-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.totalRevenue)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 p-8 rounded-2xl group hover:border-red-500/30 transition-all"
          >
            <p className="text-[9px] uppercase tracking-widest text-red-500 font-bold mb-4">Custo Total (Débito)</p>
            <p className="text-3xl font-sans text-red-500 mb-1">
              - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.totalCost)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 p-8 rounded-2xl group hover:border-emerald-500/30 transition-all"
          >
            <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mb-4">Lucro Líquido</p>
            <p className="text-3xl font-sans text-emerald-500 mb-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.netProfit)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 p-8 rounded-2xl group hover:border-blue-500/30 transition-all"
          >
            <p className="text-[9px] uppercase tracking-widest text-blue-500 font-bold mb-4">Bilhetes Vendidos</p>
            <p className="text-3xl font-sans text-white mb-1">
              {displayStats.totalTickets}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mt-10">
          {/* Top Dancers Ranking */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-8 italic font-serif flex items-center gap-3">
              <Users className="w-4 h-4 text-brand-orange" />
              Hall de Talentos {selectedCampaignId !== 'all' ? '(Filtrado)' : '(Geral)'}
            </h4>
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {displayStats.topDancers.map((dancer, idx) => (
                <div key={idx} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-white font-medium">
                      <span className="text-[10px] text-white/20 mr-2">#{idx + 1}</span>
                      {dancer.name}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-brand-orange font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dancer.totalSales)}</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest">
                        {dancer.ticketCount} vendidos • Meta: {dancer.goal}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((dancer.ticketCount / (dancer.goal || 1)) * 100, 100)}%` }}
                      className="h-full bg-brand-orange"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Campaign Progress */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-8 italic font-serif flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-brand-orange" />
              Pulso das Campanhas
            </h4>
            <div className="space-y-8">
              {raffleStats.campaignsProgress.map((campaign, idx) => {
                const isSelected = selectedCampaignId === campaign.id;
                const progress = Math.min((campaign.ticketsVendidos / campaign.metaTickets) * 100, 100);
                return (
                  <div key={idx} className={`transition-all duration-500 ${selectedCampaignId !== 'all' && !isSelected ? 'opacity-30' : 'opacity-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-[10px] font-bold uppercase text-white truncate max-w-[180px]">{campaign.name}</h5>
                      <span className="text-[9px] font-mono text-brand-orange">{campaign.ticketsVendidos} / {campaign.metaTickets}</span>
                    </div>
                    <div className="h-4 w-full bg-white/5 rounded-sm border border-white/10 relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="absolute inset-0 bg-brand-orange/20 border-r border-brand-orange"
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-[8px] font-bold text-white/60">
                        {Math.round(progress)}% CONCLUÍDO
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
