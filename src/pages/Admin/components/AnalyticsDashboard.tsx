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

interface AnalyticsDashboardProps {
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
}

export function AnalyticsDashboard({ onAlert }: AnalyticsDashboardProps) {
  const { data, loading, error, period, setPeriod, refresh } = useAnalytics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (error) return <div className="py-20 text-center text-red-500 font-sans">Erro ao carregar estatísticas: {error}</div>;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
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
          <title>Relatório Danzamerica - ${periodLabels[period]}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.4; font-size: 11px; background: white; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #BE3144; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { font-size: 20px; color: #BE3144; text-transform: uppercase; letter-spacing: -0.5px; }
            .header .meta { text-align: right; font-size: 9px; color: #666; }
            
            .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
            .kpi-card { background: #fcfcfc; border: 1px solid #eee; padding: 12px; border-radius: 4px; }
            .kpi-label { font-size: 8px; text-transform: uppercase; color: #999; font-weight: 700; margin-bottom: 4px; }
            .kpi-value { font-size: 22px; font-weight: 800; color: #1a1a1a; }
            
            .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #BE3144; margin: 20px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #f0f0f0; }
            
            .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .chart-container { height: 100px; display: flex; align-items: flex-end; gap: 4px; padding-top: 20px; border-bottom: 1px solid #eee; position: relative; }
            .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative; }
            .bar { width: 100%; background: #BE3144 !important; border-radius: 2px 2px 0 0; min-height: 1px; }
            .bar-label { font-size: 6px; color: #999; margin-top: 4px; white-space: nowrap; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th { text-align: left; font-size: 8px; color: #999; text-transform: uppercase; padding: 6px 8px; border-bottom: 2px solid #eee; }
            td { padding: 6px 8px; border-bottom: 1px solid #f9f9f9; font-size: 10px; }
            .right { text-align: right; }
            
            .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #bbb; }
            .brand { font-weight: 800; color: #BE3144; }
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
      {/* Period Filter & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(Object.keys(periodLabels) as AnalyticsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border ${
                period === p
                  ? 'bg-brand-orange border-brand-orange text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-4 py-2 border border-brand-orange bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
          >
            <Printer className="w-3 h-3" />
            Gerar Relatório
          </button>
        </div>
      </div>

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

      {/* KPI Cards */}
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

      {/* Row 3: Charts & Clicks List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Views Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                  <span className={`text-[10px] font-bold transition-all duration-500 ${
                    day.count > 0 ? 'text-brand-orange opacity-100' : 'text-white/10 opacity-40'
                  }`}>
                    {day.count}
                  </span>
                  <div className="w-full bg-white/5 rounded-t-xl relative h-40 overflow-hidden flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(barHeight, day.count > 0 ? 5 : 0)}%` }}
                      transition={{ delay: 0.2 + idx * 0.05, duration: 0.8 }}
                      className="w-full bg-gradient-to-t from-brand-orange/40 to-brand-orange rounded-t-lg"
                    />
                  </div>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Clicks List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
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

      {/* Hidden Print Section */}
      <div className="hidden">
        <div ref={reportRef}>
          <div className="header">
            <div>
              <h1>Relatório de Performance</h1>
              <p style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Danzamerica - Dashboard Administrativo</p>
            </div>
            <div className="meta">
              <p>Período: {periodLabels[period]}</p>
              <p>Gerado em: {reportDate} às {reportTime}</p>
            </div>
          </div>

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
              <h3 className="section-title">Horários de Pico</h3>
              <div className="chart-container" style={{ height: '80px', gap: '2px' }}>
                {data.peakHours.map((hourData, idx) => {
                  const maxPeak = Math.max(...data.peakHours.map(h => h.count), 1);
                  const height = (hourData.count / maxPeak) * 100;
                  return (
                    <div key={idx} className="bar-wrapper">
                      <div className="bar" style={{ height: `${Math.max(height, hourData.count > 0 ? 5 : 0)}%` }} />
                      <span className="bar-label" style={{ fontSize: '5px' }}>{hourData.hour}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="section-title">Dispositivos</h3>
              <p>Desktop: <strong>{desktopPct}%</strong> | Mobile: <strong>{mobilePct}%</strong></p>
              <div style={{ marginTop: '10px' }}>
                <h3 className="section-title" style={{ marginTop: '0', fontSize: '8px' }}>Fontes Principais</h3>
                {data.trafficSources.slice(0, 3).map((s, i) => (
                  <p key={i} style={{ fontSize: '9px' }}>{s.source}: {s.count}</p>
                ))}
              </div>
            </div>
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

          <div className="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Gestão Danzamerica.</p>
            <span className="brand">DANZAMERICA 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
