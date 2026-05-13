import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Monitor,
  Smartphone,
  ShoppingCart,
  ShoppingBag,
  TrendingUp,
  BarChart3
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
    
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Danzamerica - Web Analytics (${periodLabels[period]})</title>
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
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th { text-align: left; font-size: 8px; color: #999; text-transform: uppercase; padding: 6px 8px; border-bottom: 2px solid #eee; }
            td { padding: 6px 8px; border-bottom: 1px solid #f9f9f9; font-size: 10px; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Performance Web - ${periodLabels[period]}</h1>
              <p style="font-size: 10px; color: #888; margin-top: 2px;">Danzamerica - Dashboard Administrativo</p>
            </div>
            <div class="meta">
              <p>Gerado em: ${reportDate} às ${reportTime}</p>
            </div>
          </div>
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
      {/* Header & Main Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-orange/10 rounded-2xl">
            <BarChart3 className="w-6 h-6 text-brand-orange" />
          </div>
          <div>
            <h3 className="text-xl font-serif italic text-white">Estatísticas do Site</h3>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Monitoramento Global de Performance</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            {(Object.keys(periodLabels) as AnalyticsPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border ${
                  period === p
                    ? 'bg-white text-brand-dark border-white'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                } rounded-full`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 border border-white/10 bg-white/5 text-white/40 hover:text-white transition-all rounded-full"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-6 py-3 border border-brand-orange bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white text-[10px] uppercase tracking-widest font-black transition-all rounded-full"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório Web
            </button>
          </div>
        </div>
      </div>

      {/* SEO & Search Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-orange/5 border border-brand-orange/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6 rounded-[1.5rem]"
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

      {/* Full KPI Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 p-8 rounded-2xl group hover:border-brand-orange/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
             <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold">Total de Visualizações</p>
             <Eye className="w-4 h-4 text-brand-orange/40" />
          </div>
          <p className="text-4xl font-sans text-white mb-1">{data.totalViews.toLocaleString('pt-BR')}</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Páginas carregadas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 p-8 rounded-2xl group hover:border-brand-orange/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
             <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold">Visitantes Únicos</p>
             <Users className="w-4 h-4 text-emerald-500/40" />
          </div>
          <p className="text-4xl font-sans text-white mb-1">{data.uniqueVisitors.toLocaleString('pt-BR')}</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Pessoas diferentes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 p-8 rounded-2xl group hover:border-brand-orange/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
             <p className="text-[9px] uppercase tracking-widest text-blue-500 font-bold">Permanência Média</p>
             <Clock className="w-4 h-4 text-blue-500/40" />
          </div>
          <p className="text-4xl font-sans text-white mb-1">{formatDuration(data.avgDuration)}</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Tempo médio no site</p>
        </motion.div>
      </div>

      {/* Full KPI Cards Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 p-8 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
             <p className="text-[9px] uppercase tracking-widest text-purple-500 font-bold">Taxa de Rejeição</p>
             <MousePointerClick className="w-4 h-4 text-purple-500/40" />
          </div>
          <p className="text-4xl font-sans text-white mb-1">{data.bounceRate}%</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Saíram sem interação</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 p-8 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
             <p className="text-[9px] uppercase tracking-widest text-pink-500 font-bold">Taxa de Conversão</p>
             <TrendingUp className="w-4 h-4 text-pink-500/40" />
          </div>
          <p className="text-4xl font-sans text-white mb-1">{data.conversionRate}%</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Vendas/Acessos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 p-8 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
             <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold">Abandono de Carrinho</p>
             <ShoppingBag className="w-4 h-4 text-brand-orange/40" />
          </div>
          <p className="text-4xl font-sans text-white mb-1">{data.cartAbandonment}%</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Iniciaram mas não pagaram</p>
        </motion.div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <CalendarDays className="w-4 h-4 text-brand-orange" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Acessos Diários</h4>
          </div>
          <div className="flex items-end gap-3 h-48 pt-4">
            {data.dailyViews.map((day, idx) => {
              const chartMax = Math.max(maxDailyViews * 1.1, 5); 
              const barHeight = (day.count / chartMax) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative pt-6">
                  <div className="w-full bg-white/5 rounded-t-sm relative h-32 flex items-end">
                    {day.count > 0 && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-brand-orange opacity-0 group-hover:opacity-100 transition-all">
                        {day.count}
                      </span>
                    )}
                    {day.count > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white/40 group-hover:hidden transition-all">
                        {day.count}
                      </span>
                    )}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(barHeight, day.count > 0 ? 5 : 0)}%` }}
                      className="w-full bg-brand-orange/40 group-hover:bg-brand-orange transition-all rounded-t-sm"
                    />
                  </div>
                  <span className="text-[8px] text-white/30 font-bold mt-2">{new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-8 italic">Páginas mais Populares</h4>
          <div className="space-y-4">
            {data.topPages.slice(0, 5).map((page, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-white/60 truncate max-w-[150px]">{page.path === '/' ? 'Home' : page.path}</span>
                <span className="text-brand-orange font-bold">{page.views} views</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-white/5">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase text-white/30 font-bold">Dispositivos</span>
             </div>
             <div className="flex gap-4">
                <div className="flex items-center gap-2 text-white/60">
                   <Monitor className="w-3 h-3" />
                   <span className="text-[10px]">{desktopPct}%</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                   <Smartphone className="w-3 h-3" />
                   <span className="text-[10px]">{mobilePct}%</span>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Row 4: Peak Hours & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-4 h-4 text-brand-orange" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Horários de Pico de Acesso</h4>
          </div>

          <div className="flex items-end justify-between gap-1 h-40 pt-4">
            {data.peakHours.map((hourData, idx) => {
              const maxPeak = Math.max(...data.peakHours.map(h => h.count), 1);
              const barHeight = (hourData.count / maxPeak) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative pt-4">
                  <div className="w-full bg-white/5 rounded-t-sm relative h-28 flex items-end">
                    {hourData.count > 0 && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-bold text-brand-orange opacity-0 group-hover:opacity-100 transition-all">
                        {hourData.count}
                      </span>
                    )}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(barHeight, hourData.count > 0 ? 5 : 0)}%` }}
                      className="w-full bg-brand-orange/40 group-hover:bg-brand-orange transition-all rounded-t-sm"
                    />
                  </div>
                  <span className="text-[7px] text-white/30 font-bold mt-1">{hourData.hour}h</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <ShoppingCart className="w-4 h-4 text-brand-orange" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Mais Desejados</h4>
          </div>

          <div className="space-y-4">
            {data.topProducts.map((product, idx) => {
              const maxProdClicks = Math.max(...data.topProducts.map(p => p.count), 1);
              return (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1 text-[10px]">
                    <span className="text-white/60 truncate max-w-[140px]">{product.name}</span>
                    <span className="text-brand-orange font-bold">{product.count}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
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
          <h3 className="section-title">Páginas Mais Visitadas</h3>
          <table>
            <thead>
              <tr><th>URL / Página</th><th className="right">Visitas</th></tr>
            </thead>
            <tbody>
              {data.topPages.slice(0, 10).map((page, idx) => (
                <tr key={idx}>
                  <td>{page.path}</td>
                  <td className="right">{page.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="section-title">Acessos por Dispositivo</h3>
          <p style={{ fontSize: '10px' }}>Desktop: {desktopPct}% | Mobile: {mobilePct}%</p>
        </div>
      </div>
    </div>
  );
}
