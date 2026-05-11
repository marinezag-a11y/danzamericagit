import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  RefreshCw, 
  Printer, 
  Globe, 
  ArrowRight, 
  Eye, 
  Users, 
  Clock, 
  MousePointerClick, 
  CalendarDays, 
  BarChart3, 
  Monitor,
  Smartphone,
  Share2,
  ShoppingCart,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import { useAnalytics, AnalyticsPeriod } from '../../../hooks/useAnalytics';
import { useRaffleAnalytics } from '../../../hooks/useRaffleAnalytics';

interface AnalyticsDashboardProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function AnalyticsDashboard({ onAlert }: AnalyticsDashboardProps) {
  const { data, loading, error, period, setPeriod, refresh } = useAnalytics();
  const { stats: raffleStats, loading: loadingRaffles, refresh: refreshRaffles } = useRaffleAnalytics();
  const [activeTab, setActiveTab] = useState<'web' | 'raffle'>('web');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (error) return <div className="py-20 text-center text-red-500 font-sans">Erro ao carregar estatísticas: {error}</div>;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'web') await refresh();
    else await refreshRaffles();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const periodLabels: Record<AnalyticsPeriod, string> = {
    today: 'Hoje',
    '7d': '7 Dias',
    '30d': '30 Dias',
    all: 'Total',
  };

  const maxDailyViews = Math.max(...(data?.dailyViews || []).map(d => d.count), 1);
  const totalDevices = (data?.deviceBreakdown?.desktop || 0) + (data?.deviceBreakdown?.mobile || 0) || 1;
  const desktopPct = Math.round(((data?.deviceBreakdown?.desktop || 0) / totalDevices) * 100);
  const mobilePct = Math.round(((data?.deviceBreakdown?.mobile || 0) / totalDevices) * 100);

  const now = new Date();
  const reportDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const reportTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const handlePrintReport = () => {
    if (!reportRef.current) return;
    const printContent = reportRef.current.innerHTML;
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
    
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Danzamerica - ${activeTab === 'web' ? 'Web' : 'Rifas'}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.4; font-size: 11px; background: white; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #FF5A1F; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { font-size: 20px; color: #FF5A1F; text-transform: uppercase; letter-spacing: -0.5px; }
            .header .meta { text-align: right; font-size: 9px; color: #666; }
            
            .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
            .kpi-card { background: #fcfcfc; border: 1px solid #eee; padding: 12px; border-radius: 4px; }
            .kpi-label { font-size: 8px; text-transform: uppercase; color: #999; font-weight: 700; margin-bottom: 4px; }
            .kpi-value { font-size: 22px; font-weight: 800; color: #1a1a1a; }
            
            .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #FF5A1F; margin: 20px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #f0f0f0; }
            
            .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .chart-container { height: 100px; display: flex; align-items: flex-end; gap: 4px; padding-top: 20px; border-bottom: 1px solid #eee; position: relative; }
            .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative; }
            .bar { width: 100%; background: #FF5A1F !important; border-radius: 2px 2px 0 0; min-height: 1px; }
            .bar-label { font-size: 6px; color: #999; margin-top: 4px; white-space: nowrap; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th { text-align: left; font-size: 8px; color: #999; text-transform: uppercase; padding: 6px 8px; border-bottom: 2px solid #eee; }
            td { padding: 6px 8px; border-bottom: 1px solid #f9f9f9; font-size: 10px; }
            .right { text-align: right; }
            
            .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #bbb; }
            .brand { font-weight: 800; color: #FF5A1F; }
          </style>
        </head>
        <body>
          ${printContent}
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

  if (loading && data.totalViews === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-white/30 font-bold">Carregando analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Tab Switcher & Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab('web')}
            className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'web' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            Tráfego do Site
          </button>
          <button
            onClick={() => setActiveTab('raffle')}
            className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'raffle' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            Rifas & Apoios
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {activeTab === 'web' && (
            <div className="flex items-center gap-2">
              {(Object.keys(periodLabels) as AnalyticsPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all border ${
                    period === p
                      ? 'bg-white text-brand-dark border-white'
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 border border-white/10 bg-white/5 text-white/40 hover:text-white transition-all rounded-full"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-6 py-2 border border-brand-orange bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white text-[10px] uppercase tracking-widest font-black transition-all rounded-full"
            >
              <Printer className="w-3 h-3" />
              Imprimir Relatório
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'web' ? (
        <>
          {/* SEO & Search Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-orange/5 border border-brand-orange/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6 rounded-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-orange/20 rounded-full">
                <Globe className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Status de SEO & Google</h4>
                <p className="text-xs text-white/60">Propriedade verificada e Sitemap enviado com sucesso.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Indexado</span>
              </div>
              <a 
                href="https://search.google.com/search-console" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-brand-orange font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Ver no Google <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </motion.div>

          {/* KPI Cards (Web) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
            >
              <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Total de visualizações de todas as páginas</p>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-brand-orange/10 rounded-full group-hover:bg-brand-orange/20 transition-all">
                  <Eye className="w-5 h-5 text-brand-orange" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Visualizações</span>
              </div>
              <p className="text-4xl font-sans text-white mb-1">
                {data.totalViews.toLocaleString('pt-BR')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
            >
              <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mb-4">Pessoas únicas que acessaram o site</p>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-all">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Visitantes</span>
              </div>
              <p className="text-4xl font-sans text-white mb-1">
                {data.uniqueVisitors.toLocaleString('pt-BR')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
            >
              <p className="text-[9px] uppercase tracking-widest text-blue-500 font-bold mb-4">Quanto tempo as pessoas ficam no site</p>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-all">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Permanência</span>
              </div>
              <p className="text-4xl font-sans text-white mb-1">
                {formatDuration(data.avgDuration)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
            >
              <p className="text-[9px] uppercase tracking-widest text-purple-500 font-bold mb-4">Pessoas que saíram sem clicar em nada</p>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-all">
                  <MousePointerClick className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Rejeição</span>
              </div>
              <p className="text-4xl font-sans text-white mb-1">
                {data.bounceRate}%
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
            >
              <p className="text-[9px] uppercase tracking-widest text-pink-500 font-bold mb-4">Taxa de Conversão (Vendas/Doações)</p>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-pink-500/10 rounded-full group-hover:bg-pink-500/20 transition-all">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Conversão</span>
              </div>
              <p className="text-4xl font-sans text-white mb-1">
                {data.conversionRate}%
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 p-8 group hover:border-brand-orange/30 transition-all duration-500"
            >
              <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Pessoas que abriram o carrinho mas não compraram</p>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-brand-orange/10 rounded-full group-hover:bg-brand-orange/20 transition-all">
                  <ShoppingBag className="w-5 h-5 text-brand-orange" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Abandono</span>
              </div>
              <p className="text-4xl font-sans text-white mb-1">
                {data.cartAbandonment}%
              </p>
            </motion.div>
          </div>

          {/* Charts (Web) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-white/5 border border-white/10 p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand-orange/10 rounded-full">
                  <CalendarDays className="w-4 h-4 text-brand-orange" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Acessos por Dia (últimos 7 dias)</h4>
              </div>
              <div className="flex items-end gap-3 h-56 pt-8">
                {data.dailyViews.map((day, idx) => {
                  const chartMax = Math.max(maxDailyViews * 1.1, 5); 
                  const barHeight = (day.count / chartMax) * 100;
                  const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                      <span className="text-[10px] font-bold text-brand-orange">{day.count}</span>
                      <div className="w-full bg-white/5 rounded-t-xl relative h-40 overflow-hidden flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(barHeight, day.count > 0 ? 5 : 0)}%` }}
                          className="w-full bg-brand-orange/60"
                        />
                      </div>
                      <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand-orange/10 rounded-full">
                  <MousePointerClick className="w-4 h-4 text-brand-orange" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Links mais Clicados</h4>
              </div>
              <div className="space-y-5">
                {data.topEvents.map((event, idx) => {
                  const totalEvents = data.topEvents.reduce((sum, e) => sum + e.count, 0) || 1;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white/60 truncate max-w-[160px]">{event.name}</span>
                        <span className="text-[10px] text-brand-orange font-bold">{event.count}</span>
                      </div>
                      <div className="h-[2px] w-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(event.count / totalEvents) * 100}%` }}
                          className="h-full bg-brand-orange/60"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      ) : (
        <>
          {/* Raffle Reports UI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-8"
            >
              <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Arrecadação Total de Rifas</p>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-brand-orange/10 rounded-full">
                  <BarChart3 className="w-5 h-5 text-brand-orange" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Financeiro</span>
              </div>
              <p className="text-4xl font-sans text-white mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(raffleStats.totalRevenue)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 p-8"
            >
              <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mb-4">Total de Bilhetes Vendidos</p>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-full">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Volume</span>
              </div>
              <p className="text-4xl font-sans text-white mb-1">
                {raffleStats.totalTickets}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 p-8"
            >
              <p className="text-[9px] uppercase tracking-widest text-blue-500 font-bold mb-4">Investimento Médio por Bilhete</p>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Ticket Médio</span>
              </div>
              <p className="text-4xl font-sans text-white mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(raffleStats.avgTicketPrice)}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dancer Ranking */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 p-8 rounded-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-orange/10 rounded-full">
                    <Users className="w-4 h-4 text-brand-orange" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white italic font-serif">Hall de Talentos (Top Apoios)</h4>
                </div>
              </div>
              <div className="space-y-6">
                {raffleStats.topDancers.slice(0, 10).map((dancer, idx) => {
                  const maxSales = Math.max(...raffleStats.topDancers.map(d => d.totalSales), 1);
                  const progress = (dancer.totalSales / maxSales) * 100;
                  return (
                    <div key={idx} className="relative">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mr-2">#{idx + 1}</span>
                          <span className="text-sm text-white font-medium">{dancer.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-brand-orange font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dancer.totalSales)}</p>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest">
                            <span className="text-emerald-500">{dancer.ticketCount}</span> vendidas • <span className="text-brand-orange">{Math.max(0, dancer.goal - dancer.ticketCount)}</span> a vender
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((dancer.ticketCount / (dancer.goal || 1)) * 100, 100)}%` }}
                          className="h-full bg-gradient-to-r from-brand-orange/40 to-brand-orange shadow-[0_0_10px_rgba(255,90,31,0.3)]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Campaign Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 p-8 rounded-sm"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand-orange/10 rounded-full">
                  <BarChart3 className="w-4 h-4 text-brand-orange" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white italic font-serif">Pulso das Campanhas</h4>
              </div>
              <div className="space-y-8">
                {raffleStats.campaignsProgress.map((campaign, idx) => {
                  const progress = Math.min((campaign.ticketsVendidos / campaign.metaTickets) * 100, 100);
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-xs text-white font-bold uppercase tracking-wider truncate max-w-[200px]">{campaign.name}</h5>
                        <span className="text-[10px] font-mono text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-sm">
                          {campaign.ticketsVendidos} / {campaign.metaTickets} bilhetes
                        </span>
                      </div>
                      <div className="h-6 w-full bg-white/5 rounded-sm border border-white/10 relative overflow-hidden flex items-center px-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="absolute left-0 top-0 h-full bg-brand-orange/20 border-r border-brand-orange/40"
                        />
                        <span className="relative z-10 text-[9px] font-bold text-white/60 tracking-widest">
                          PROGRESSO: {Math.round(progress)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-white/30 mt-2 text-right italic font-serif">
                        Total Arrecadado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(campaign.totalArrecadado)}
                      </p>
                    </div>
                  );
                })}
                {raffleStats.campaignsProgress.length === 0 && (
                  <div className="py-20 text-center text-white/20 italic">Nenhuma campanha ativa com vendas no momento.</div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Row 4: Peak Hours & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <Clock className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Horários de Pico</h4>
          </div>

          <div className="flex items-end justify-between gap-1 h-48 pt-4">
            {data.peakHours.map((hourData, idx) => {
              const maxPeak = Math.max(...data.peakHours.map(h => h.count), 1);
              const barHeight = (hourData.count / maxPeak) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                  <div className="w-full bg-white/5 rounded-t-sm relative h-32 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(barHeight, hourData.count > 0 ? 5 : 0)}%` }}
                      className="w-full bg-brand-orange/40 group-hover:bg-brand-orange transition-all"
                    />
                  </div>
                  <span className="text-[8px] text-white/30 font-bold">{hourData.hour}h</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <ShoppingCart className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Mais Desejados</h4>
          </div>

          <div className="space-y-5">
            {data.topProducts.map((product, idx) => {
              const maxProdClicks = Math.max(...data.topProducts.map(p => p.count), 1);
              return (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-white/60 truncate max-w-[160px]">{product.name}</span>
                    <span className="text-[10px] text-brand-orange font-bold">{product.count} clicks</span>
                  </div>
                  <div className="h-[2px] w-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(product.count / maxProdClicks) * 100}%` }}
                      className="h-full bg-brand-orange"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="hidden">
        <div ref={reportRef}>
          <div className="header">
            <div>
              <h1>Relatório de {activeTab === 'web' ? 'Performance Web' : 'Vendas de Rifas'}</h1>
              <p style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Danzamerica - Dashboard Administrativo</p>
            </div>
            <div className="meta">
              <p>Gerado em: {reportDate} às {reportTime}</p>
            </div>
          </div>

          {activeTab === 'web' ? (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <p className="kpi-label">Visualizações</p>
                  <p className="kpi-value">{data.totalViews.toLocaleString('pt-BR')}</p>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Visitantes</p>
                  <p className="kpi-value">{data.uniqueVisitors.toLocaleString('pt-BR')}</p>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Permanência</p>
                  <p className="kpi-value">{formatDuration(data.avgDuration)}</p>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Rejeição</p>
                  <p className="kpi-value">{data.bounceRate}%</p>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Conversão</p>
                  <p className="kpi-value">{data.conversionRate}%</p>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Abandono</p>
                  <p className="kpi-value">{data.cartAbandonment}%</p>
                </div>
              </div>

              <h3 className="section-title">Volume de Acessos (Últimos 7 Dias)</h3>
              <div className="chart-container">
                {data.dailyViews.map((day, idx) => {
                  const chartMax = Math.max(maxDailyViews * 1.1, 5);
                  const height = (day.count / chartMax) * 100;
                  const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
                  return (
                    <div key={idx} className="bar-wrapper">
                      <div className="bar" style={{ height: `${Math.max(height, day.count > 0 ? 5 : 0)}%` }} />
                      <span className="bar-label">{dayLabel} ({day.count})</span>
                    </div>
                  );
                })}
              </div>

              <div className="chart-row">
                <div>
                  <h3 className="section-title">Páginas Mais Visitadas</h3>
                  <table>
                    <thead>
                      <tr><th>URL / Página</th><th className="right">Visitas</th></tr>
                    </thead>
                    <tbody>
                      {data.topPages.slice(0, 5).map((page, idx) => (
                        <tr key={idx}>
                          <td>{page.path === '/' ? 'Página Inicial' : page.path}</td>
                          <td className="right">{page.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="section-title">Produtos Mais Desejados</h3>
                  <table>
                    <thead>
                      <tr><th>Produto</th><th className="right">Clicks</th></tr>
                    </thead>
                    <tbody>
                      {data.topProducts.slice(0, 5).map((p, idx) => (
                        <tr key={idx}>
                          <td>{p.name}</td>
                          <td className="right">{p.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <p className="kpi-label">Arrecadação Total</p>
                  <p className="kpi-value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(raffleStats.totalRevenue)}</p>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Bilhetes Vendidos</p>
                  <p className="kpi-value">{raffleStats.totalTickets}</p>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Ticket Médio</p>
                  <p className="kpi-value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(raffleStats.avgTicketPrice)}</p>
                </div>
              </div>

              <div className="chart-row">
                <div>
                  <h3 className="section-title">Ranking de Apoios (Bailarinos)</h3>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '30px' }}>#</th>
                        <th>Bailarino(a)</th>
                        <th style={{ width: '100px' }}>Meta</th>
                        <th className="right">Total (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raffleStats.topDancers.slice(0, 15).map((d, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{d.name}</td>
                          <td>{d.ticketCount} vendidas / {Math.max(0, d.goal - d.ticketCount)} a vender</td>
                          <td className="right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.totalSales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="section-title">Status das Campanhas</h3>
                  <table>
                    <thead>
                      <tr><th>Campanha</th><th className="right">Progresso</th></tr>
                    </thead>
                    <tbody>
                      {raffleStats.campaignsProgress.map((c, idx) => (
                        <tr key={idx}>
                          <td>{c.name}</td>
                          <td className="right">{c.ticketsVendidos} bilhetes ({Math.round((c.ticketsVendidos/c.metaTickets)*100)}%)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Gestão Danzamerica.</p>
            <span className="brand">DANZAMERICA 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
