declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsParams = Record<string, unknown>;

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
    }
  } catch (error) {
    console.warn(`Analytics event "${eventName}" failed`, error);
  }
}

export function trackPageView(pagePath: string) {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: typeof document !== 'undefined' ? document.title : '',
    page_location: typeof window !== 'undefined' ? window.location.href : ''
  });
}

export function trackLogin(userId: string, role: string, method = 'Supabase') {
  trackEvent('login', {
    method,
    user_id: userId,
    user_role: role
  });
}

export function trackReadingProgress(entityId: string, entityType: string, progress: number) {
  trackEvent('reading_progress_update', {
    entity_id: entityId,
    entity_type: entityType,
    progress_percent: progress
  });
}

export function trackPurchaseIntent(itemCount: number, totalAmount?: number) {
  trackEvent('begin_checkout', {
    item_count: itemCount,
    value: totalAmount
  });
}

export function trackBookmark(entityId: string, entityType: string, action: 'add' | 'remove') {
  trackEvent('bookmark_update', {
    entity_id: entityId,
    entity_type: entityType,
    action
  });
}