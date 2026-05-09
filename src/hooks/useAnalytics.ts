import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'all';

export interface DailyView {
  date: string;
  count: number;
}

export interface TopPage {
  path: string;
  views: number;
}

export interface TopEvent {
  name: string;
  count: number;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
}

export interface TrafficSource {
  source: string;
  count: number;
}

export interface PeakHour {
  hour: number;
  count: number;
}

export interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  avgDuration: number;
  bounceRate: number;
  topPages: TopPage[];
  topEvents: TopEvent[];
  deviceBreakdown: DeviceBreakdown;
  trafficSources: TrafficSource[];
  dailyViews: DailyView[];
  conversionRate: string;
  peakHours: PeakHour[];
  topProducts: TopEvent[];
}

function getDateFilter(period: AnalyticsPeriod): string | null {
  const now = new Date();
  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return start.toISOString();
    }
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString();
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d.toISOString();
    }
    case 'all':
    default:
      return null;
  }
}

/**
 * Classifies a referrer URL into a human-readable traffic source.
 */
function classifyReferrer(referrer: string | null): string {
  if (!referrer) return 'Direto';
  const r = referrer.toLowerCase();
  if (r.includes('google') || r.includes('bing') || r.includes('yahoo') || r.includes('duckduckgo')) return 'Busca';
  if (r.includes('facebook') || r.includes('instagram') || r.includes('twitter') || r.includes('linkedin') || r.includes('tiktok') || r.includes('youtube') || r.includes('t.co')) return 'Redes Sociais';
  return 'Referência';
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalViews: 0,
    uniqueVisitors: 0,
    avgDuration: 0,
    bounceRate: 0,
    topPages: [],
    topEvents: [],
    deviceBreakdown: { desktop: 0, mobile: 0 },
    trafficSources: [],
    dailyViews: [],
    conversionRate: '0.0',
    peakHours: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<AnalyticsPeriod>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    try {
      const dateFilter = getDateFilter(period);

      // Fetch total count and data separately
      let baseQuery = supabase
        .from('page_views')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (dateFilter) {
        baseQuery = baseQuery.gte('created_at', dateFilter);
      }

      // Limit data fetching to 5000 for stats calculation
      const { data: rows, error: fetchError, count } = await baseQuery.limit(5000);
      
      if (fetchError) {
        console.error('[Analytics] Fetch error:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      // Total views from the 'count' property (bypasses row limit)
      const totalViews = count || (rows?.length || 0);

      // Unique visitors (distinct session_id)
      const uniqueSessions = new Set(rows.map((r: any) => r.session_id));
      const uniqueVisitors = uniqueSessions.size;

      // Average duration (excluding 0-second views)
      const withDuration = rows.filter((r: any) => r.duration_seconds > 0);
      const avgDuration = withDuration.length > 0
        ? Math.round(withDuration.reduce((sum: number, r: any) => sum + r.duration_seconds, 0) / withDuration.length)
        : 0;

      // Bounce rate: sessions with exactly 1 page view
      const sessionCounts: Record<string, number> = {};
      rows.forEach((r: any) => {
        sessionCounts[r.session_id] = (sessionCounts[r.session_id] || 0) + 1;
      });
      const totalSessions = Object.keys(sessionCounts).length;
      const bounceSessions = Object.values(sessionCounts).filter(c => c === 1).length;
      const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

      // Top pages
      const pageCounts: Record<string, number> = {};
      rows.forEach((r: any) => {
        const path = r.page_path || '/';
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([path, views]) => ({ path, views }));

      // Top events (clicks)
      let eventQuery = supabase
        .from('analytics_events')
        .select('event_name')
        .order('created_at', { ascending: false });

      if (dateFilter) {
        eventQuery = eventQuery.gte('created_at', dateFilter);
      }

      const { data: eventRows } = await eventQuery.limit(5000);
      const eventCounts: Record<string, number> = {};
      (eventRows || []).forEach((r: any) => {
        eventCounts[r.event_name] = (eventCounts[r.event_name] || 0) + 1;
      });
      const topEvents = Object.entries(eventCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Device breakdown
      const deviceBreakdown: DeviceBreakdown = { desktop: 0, mobile: 0 };
      rows.forEach((r: any) => {
        if (r.device_type === 'mobile') deviceBreakdown.mobile++;
        else deviceBreakdown.desktop++;
      });

      // Traffic sources
      const sourceCounts: Record<string, number> = {};
      rows.forEach((r: any) => {
        const source = classifyReferrer(r.referrer);
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      const trafficSources = Object.entries(sourceCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([source, count]) => ({ source, count }));

      // Daily views (last 7 days for chart)
      const dailyMap: Record<string, number> = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyMap[key] = 0;
      }
      rows.forEach((r: any) => {
        const dateKey = new Date(r.created_at).toISOString().split('T')[0];
        if (dailyMap[dateKey] !== undefined) {
          dailyMap[dateKey]++;
        }
      });
      const dailyViews = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

      // Horários de Pico (heatmap)
      const peakHoursMap = Array(24).fill(0);
      rows.forEach((r: any) => {
        const date = new Date(r.created_at);
        const hour = date.getHours();
        if (hour >= 0 && hour < 24) {
          peakHoursMap[hour]++;
        }
      });
      const peakHours = peakHoursMap.map((count, hour) => ({ hour, count }));

      // Produtos Mais Desejados (baseado nos eventos "Abrir ...")
      const productClicks: Record<string, number> = {};
      (eventRows || []).forEach((r: any) => {
        if (r.event_name.startsWith('Abrir ')) {
          const product = r.event_name.replace('Abrir ', '');
          productClicks[product] = (productClicks[product] || 0) + 1;
        }
      });
      const topProducts = Object.entries(productClicks)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Taxa de Conversão (Pedidos Loja + Rifas)
      let ordersQuery = supabase.from('help_orders').select('id', { count: 'exact', head: true });
      if (dateFilter) ordersQuery = ordersQuery.gte('created_at', dateFilter);
      const { count: ordersCount } = await ordersQuery;

      let rafflesQuery = supabase.from('raffle_purchases').select('id', { count: 'exact', head: true });
      if (dateFilter) rafflesQuery = rafflesQuery.gte('created_at', dateFilter);
      const { count: rafflesCount } = await rafflesQuery;

      const totalConversions = (ordersCount || 0) + (rafflesCount || 0);
      const conversionRate = uniqueVisitors > 0 ? ((totalConversions / uniqueVisitors) * 100).toFixed(1) : '0.0';

      setData({
        totalViews,
        uniqueVisitors,
        avgDuration,
        bounceRate,
        topPages,
        topEvents,
        deviceBreakdown,
        trafficSources,
        dailyViews,
        conversionRate,
        peakHours,
        topProducts,
      });
    } catch (err) {
      console.error('[Analytics] Error:', err);
    }

    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    period,
    setPeriod,
    refresh: fetchAnalytics,
  };
}
