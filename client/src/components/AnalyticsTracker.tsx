import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackEvent, trackLogin, trackPageView } from '../lib/analytics';

export function AnalyticsTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  const pageStartRef = useRef<number>(Date.now());
  const lastPingRef = useRef<number>(Date.now());
  const pingedForPathRef = useRef<string>('');

  useEffect(() => {
    if (!measurementId) return;

    const pagePath = location.pathname + location.search;
    trackPageView(pagePath);

    // Reset timers
    pageStartRef.current = Date.now();
    lastPingRef.current = Date.now();
    pingedForPathRef.current = pagePath;
  }, [location, measurementId]);

  useEffect(() => {
    if (!measurementId || !user) return;
    trackLogin(user.id, user.role, 'Firebase');
  }, [user, measurementId]);

  useEffect(() => {
    if (!measurementId) return;

    const interval = window.setInterval(() => {
      const now = Date.now();
      const activePage = location.pathname + location.search;

      // Throttle to every 30s per page.
      if (activePage !== pingedForPathRef.current) return;
      if (now - lastPingRef.current < 30_000) return;

      const timeOnPageSec = Math.max(0, Math.round((now - pageStartRef.current) / 1000));
      trackEvent('time_on_page', {
        page_path: activePage,
        page_title: typeof document !== 'undefined' ? document.title : '',
        time_on_page_seconds: timeOnPageSec
      });

      lastPingRef.current = now;
    }, 10_000);

    return () => {
      window.clearInterval(interval);

      // Send one final ping when leaving/unmounting
      const now = Date.now();
      const activePage = location.pathname + location.search;
      if (activePage && activePage === pingedForPathRef.current) {
        const timeOnPageSec = Math.max(0, Math.round((now - pageStartRef.current) / 1000));
        trackEvent('time_on_page', {
          page_path: activePage,
          page_title: typeof document !== 'undefined' ? document.title : '',
          time_on_page_seconds: timeOnPageSec
        });
      }
    };
  }, [location, measurementId]);

  return null;
}

