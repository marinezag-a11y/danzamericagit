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
  Share2
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
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>
      @page{size:A4 portrait;margin:15mm 18mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#1a1a1a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:12px;line-height:1.5}
      .rpt-header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #BE3144;padding-bottom:12px;margin-bottom:20px}
      .rpt-header h1{font-size:22px;font-weight:800;letter-spacing:-0.5px}
      .rpt-header .subtitle{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-top:2px}
      .rpt-header .meta{text-align:right;font-size:10px;color:#999;line-height:1.6}
      .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
      .kpi-card{border:1px solid #e5e5e5;padding:14px 16px;border-radius:4px;background:#fafafa}
      .kpi-card .label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#999;font-weight:700;margin-bottom:6px}
      .kpi-card .value{font-size:26px;font-weight:800;color:#1a1a1a;line-height:1.1}
      .kpi-card .desc{font-size:9px;color:#bbb;margin-top:4px}
      .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#BE3144;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0}
      .two-col{display:grid;grid-template-columns:1.4fr 1fr;gap:16px;margin-bottom:16px}
      .two-col-equal{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700;text-align:left;padding:6px 10px;border-bottom:2px solid #e5e5e5}
      th.right{text-align:right}
      td{padding:6px 10px;font-size:11px;border-bottom:1px solid #eee}
      .rpt-footer{margin-top:20px;padding-top:10px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center}
      .rpt-footer p{font-size:9px;color:#bbb}
      .rpt-footer .brand{font-weight:800;color:#BE3144;font-size:10px;letter-spacing:1px}
      .bar-bg{background:#f0f0f0;border-radius:3px;height:14px;position:relative}
      .bar-fill{background:#BE3144;height:100%;border-radius:3px;min-width:2px}
      .device-bar{display:flex;height:18px;border-radius:4px;overflow:hidden;margin:8px 0 6px}
      .device-legend{display:flex;gap:16px;margin-top:4px}
      .device-legend span{font-size:10px;color:#666;display:flex;align-items:center;gap:4px}
      .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
    </style></head><body>${printContent}</body></html>`);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>

      {/* Chart + Top Pages Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 p-8"
        >
          <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Volume de visitas ao longo da semana</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <CalendarDays className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Acessos por Dia (últimos 7 dias)</h4>
          </div>

          <div className="flex items-end gap-3 h-48">
            {data.dailyViews.map((day, idx) => {
              const barHeight = maxDailyViews > 0 ? (day.count / maxDailyViews) * 100 : 0;
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] text-white/40 font-bold lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                    {day.count}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(barHeight, 2)}%` }}
                    transition={{ delay: 0.3 + idx * 0.05, duration: 0.6, ease: 'easeOut' }}
                    className="w-full bg-brand-orange/30 group-hover:bg-brand-orange transition-all duration-300 rounded-t-sm relative min-h-[2px]"
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-brand-orange rounded-t-sm transition-all duration-500"
                      style={{ height: `${Math.min(barHeight * 1.5, 100)}%` }}
                    />
                  </motion.div>
                  <span className="text-[9px] text-white/30 uppercase tracking-wider font-bold">{dayLabel}</span>
                </div>
              );
            })}
          </div>

          {data.totalViews === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-xs uppercase tracking-widest font-bold">Nenhum dado disponível</p>
              <p className="text-[10px] mt-2 opacity-50">Os acessos começarão a aparecer aqui automaticamente.</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-white/5 border border-white/10 p-8"
        >
          <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Onde as pessoas estão clicando</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <MousePointerClick className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Links mais Clicados</h4>
          </div>

          {data.topEvents.length > 0 ? (
            <div className="space-y-5">
              {data.topEvents.map((event, idx) => {
                const totalEvents = data.topEvents.reduce((sum, e) => sum + e.count, 0) || 1;
                const eventPercentage = (event.count / totalEvents) * 100;
                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white/60 font-sans truncate max-w-[160px] group-hover:text-white transition-colors">
                        {event.name}
                      </span>
                      <span className="text-[10px] text-brand-orange font-bold">{event.count}</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${eventPercentage}%` }}
                        transition={{ delay: 0.4 + idx * 0.05, duration: 0.6 }}
                        className="absolute top-0 left-0 h-full bg-brand-orange/60 group-hover:bg-brand-orange transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <MousePointerClick className="w-8 h-8 mb-4 opacity-10" />
              <p className="text-[10px] uppercase tracking-widest font-bold">Sem cliques registrados</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 border border-white/10 p-8"
        >
          <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-4">Partes do site que geram mais interesse</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-orange/10 rounded-full">
              <Globe className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Páginas Mais Visitadas</h4>
          </div>

          {data.topPages.length > 0 ? (
            <div className="space-y-5">
              {data.topPages.map((page, idx) => {
                const pagePercentage = data.totalViews > 0 ? (page.views / data.totalViews) * 100 : 0;
                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white/60 font-sans truncate max-w-[160px] group-hover:text-white transition-colors">
                        {page.path === '/' ? 'Página Inicial' : page.path}
                      </span>
                      <span className="text-[10px] text-brand-orange font-bold">{page.views}</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pagePercentage}%` }}
                        transition={{ delay: 0.4 + idx * 0.05, duration: 0.6 }}
                        className="absolute top-0 left-0 h-full bg-brand-orange/60 group-hover:bg-brand-orange transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-white/20 italic text-center py-8">Sem dados de páginas ainda.</p>
          )}
        </motion.div>
      </div>

      {/* Hidden Print Section */}
      <div className="hidden">
        <div ref={reportRef}>
          <div className="rpt-header">
            <div>
              <h1>Relatório de Performance</h1>
              <p className="subtitle">Danzamerica - Dashboard Administrativo</p>
            </div>
            <div className="meta">
              <p>Período: {periodLabels[period]}</p>
              <p>Gerado em: {reportDate} às {reportTime}</p>
            </div>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card">
              <p className="label">Visualizações</p>
              <p className="value">{data.totalViews.toLocaleString('pt-BR')}</p>
              <p className="desc">Total de acessos</p>
            </div>
            <div className="kpi-card">
              <p className="label">Visitantes</p>
              <p className="value">{data.uniqueVisitors.toLocaleString('pt-BR')}</p>
              <p className="desc">Pessoas únicas</p>
            </div>
            <div className="kpi-card">
              <p className="label">Permanência</p>
              <p className="value">{formatDuration(data.avgDuration)}</p>
              <p className="desc">Média por sessão</p>
            </div>
            <div className="kpi-card">
              <p className="label">Rejeição</p>
              <p className="value">{data.bounceRate}%</p>
              <p className="desc">Taxa de saída</p>
            </div>
          </div>

          <div className="two-col">
            <div>
              <h3 className="section-title">Páginas Mais Visitadas</h3>
              <table>
                <thead>
                  <tr>
                    <th>URL / Página</th>
                    <th className="right">Visualizações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((page, idx) => (
                    <tr key={idx}>
                      <td>{page.path === '/' ? 'Página Inicial' : page.path}</td>
                      <td className="right">{page.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="section-title">Engajamento (Cliques)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Elemento / Link</th>
                    <th className="right">Cliques</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEvents.map((event, idx) => (
                    <tr key={idx}>
                      <td>{event.name}</td>
                      <td className="right">{event.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="two-col-equal">
            <div>
              <h3 className="section-title">Dispositivos</h3>
              <div className="device-bar">
                <div className="bar-fill" style={{ width: `${desktopPct}%`, background: '#BE3144' }} />
                <div className="bar-fill" style={{ width: `${mobilePct}%`, background: '#e5e5e5' }} />
              </div>
              <div className="device-legend">
                <span><div className="dot" style={{ background: '#BE3144' }} /> Desktop ({desktopPct}%)</span>
                <span><div className="dot" style={{ background: '#e5e5e5' }} /> Mobile ({mobilePct}%)</span>
              </div>
            </div>
            <div>
              <h3 className="section-title">Fontes de Tráfego</h3>
              {data.trafficSources.map((source, idx) => {
                const pct = Math.round((source.count / (data.trafficSources.reduce((s, d) => s + d.count, 0) || 1)) * 100);
                return (
                  <div key={idx} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                      <span>{source.source}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="bar-bg"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rpt-footer">
            <p>Relatório gerado automaticamente pelo Sistema de Gestão Danzamerica.</p>
            <span className="brand">DANZAMERICA 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
