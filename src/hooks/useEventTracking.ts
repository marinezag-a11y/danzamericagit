import { supabase } from '../lib/supabase';

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('danza_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('danza_session_id', sessionId);
  }
  return sessionId;
}

export function useEventTracking() {
  const trackEvent = async (name: string, type: string = 'click', metadata: any = {}) => {
    if (!supabase) return;

    const sessionId = getSessionId();
    const pagePath = window.location.pathname + window.location.hash;

    try {
      await supabase
        .from('analytics_events')
        .insert({
          session_id: sessionId,
          event_type: type,
          event_name: name,
          page_path: pagePath,
          metadata: metadata
        });
    } catch (err) {
      console.debug('[Analytics] Event tracking error:', err);
    }
  };

  return { trackEvent };
}
