import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackLogin, trackPageView } from '../lib/analytics';

export function AnalyticsTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  useEffect(() => {
    if (!measurementId) return;
    const pagePath = location.pathname + location.search;
    trackPageView(pagePath);
  }, [location, measurementId]);

  useEffect(() => {
    if (!measurementId || !user) return;
    trackLogin(user.id, user.role, 'Firebase');
  }, [user, measurementId]);

  return null;
}
