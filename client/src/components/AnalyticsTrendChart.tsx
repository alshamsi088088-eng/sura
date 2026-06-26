import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

interface TrendData {
  date: string;
  articles: number;
  views: number;
}

interface WeeklyData {
  week: string;
  articles: number;
}

export function AnalyticsTrendChart() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [daily, setDaily] = useState<TrendData[]>([]);
  const [weekly, setWeekly] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'daily' | 'weekly'>('daily');

  const isArabic = locale === 'ar';

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const endpoint = activeView === 'daily' ? '/api/analytics/daily' : '/api/analytics/weekly';
    fetch(endpoint, { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (activeView === 'daily') {
          setDaily(data);
        } else {
          setWeekly(data);
        }
      })
      .catch(() => [])
      .finally(() => setIsLoading(false));
  }, [user, activeView]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sura-teal border-t-transparent" />
      </div>
    );
  }

  const maxValue = activeView === 'daily'
    ? Math.max(...daily.map(d => d.articles), 1)
    : Math.max(...weekly.map(w => w.articles), 1);

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveView('daily')}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${
            activeView === 'daily'
              ? 'bg-sura-teal text-sura-dark'
              : 'bg-sura-ivory/10 text-sura-ivory hover:bg-sura-ivory/20'
          }`}
        >
          {isArabic ? 'يومي' : 'Daily'}
        </button>
        <button
          onClick={() => setActiveView('weekly')}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${
            activeView === 'weekly'
              ? 'bg-sura-teal text-sura-dark'
              : 'bg-sura-ivory/10 text-sura-ivory hover:bg-sura-ivory/20'
          }`}
        >
          {isArabic ? 'أسبوعي' : 'Weekly'}
        </button>
      </div>

      {/* Chart (simple bar chart) */}
      <div className="flex items-end gap-2 h-32">
        {activeView === 'daily' ? daily.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full bg-sura-teal/80 rounded-t transition-all"
              style={{ height: `${(d.articles / maxValue) * 100}%` }}
            />
            <span className="text-xs text-sura-ivory/40 transform -rotate-45 origin-center">
              {d.date.slice(5)}
            </span>
          </div>
        )) : weekly.map((w, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full bg-sura-teal/80 rounded-t transition-all"
              style={{ height: `${(w.articles / maxValue) * 100}%` }}
            />
            <span className="text-xs text-sura-ivory/40">
              {i + 1}W
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}