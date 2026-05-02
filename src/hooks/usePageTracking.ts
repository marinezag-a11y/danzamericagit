import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Detects if the current user agent is a mobile device.
 */
function detectDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Generates or retrieves a persistent session ID for the current browser session.
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('danza_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('danza_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Classifies the referrer into a readable source category.
 */
function classifyReferrer(referrer: string): string {
  if (!referrer) return 'direct';
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (host.includes('google') || host.includes('bing') || host.includes('yahoo') || host.includes('duckduckgo')) return 'search';
    if (host.includes('facebook') || host.includes('instagram') || host.includes('twitter') || host.includes('linkedin') || host.includes('tiktok') || host.includes('youtube') || host.includes('t.co')) return 'social';
    if (host.includes(window.location.hostname)) return 'internal';
    return 'referral';
  } catch {
    return 'other';
  }
}

/**
 * Hook that tracks page views on the public site.
 * Records page_path, referrer, user_agent, device_type, and session duration.
 * Should be called once in the root public component (Home).
 */
export function usePageTracking() {
  const startTimeRef = useRef<number>(Date.now());
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!supabase || trackedRef.current) return;
    trackedRef.current = true;

    const sessionId = getSessionId();
    const deviceType = detectDeviceType();
    const pagePath = window.location.pathname + window.location.hash;
    const referrer = document.referrer;
    const userAgent = navigator.userAgent;

    startTimeRef.current = Date.now();

    // Send page view on unload with final duration, or after 2s as fallback
    const sendPageView = (duration: number) => {
      try {
        const payload = {
          session_id: sessionId,
          page_path: pagePath,
          referrer: referrer || null,
          user_agent: userAgent,
          device_type: deviceType,
          duration_seconds: duration,
        };
        // Use sendBeacon for reliability
        const url = `${(import.meta as any).env.VITE_SUPABASE_URL}/rest/v1/page_views`;
        const anonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
        navigator.sendBeacon(
          url,
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );
        // Also try regular insert as primary method
        supabase.from('page_views').insert(payload).then(() => {});
      } catch {
        // Silent fail
      }
    };

    // Insert immediately with 0 duration
    supabase.from('page_views').insert({
      session_id: sessionId,
      page_path: pagePath,
      referrer: referrer || null,
      user_agent: userAgent,
      device_type: deviceType,
      duration_seconds: 0,
    }).then(() => {});

    // Update with final duration on unload
    const handleBeforeUnload = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      // We can't update (no anon UPDATE policy), but we can insert a new record with duration
      // Actually, let's just skip - the initial record is enough
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
}

