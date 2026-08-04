import { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { Ad, AdMetrics, adminGetAdMetrics } from '../../services/adService';

interface AdAnalyticsPanelProps {
  ad: Ad;
}

export function AdAnalyticsPanel({ ad }: AdAnalyticsPanelProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [metrics, setMetrics] = useState<AdMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminGetAdMetrics(ad.id)
      .then((m) => {
        if (mounted) setMetrics(m);
      })
      .catch(() => {
        if (mounted) setMetrics(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [ad.id]);

  const impressions = metrics?.impressions ?? 0;
  const clicks = metrics?.clicks ?? 0;
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
      <h3 className="text-lg font-semibold">{ad.title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sura-line bg-sura-canvas p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-sura-navy/60">
            {isArabic ? 'المرات الظاهرة' : 'Impressions'}
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {loading ? '...' : impressions.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-sura-line bg-sura-canvas p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-sura-navy/60">
            {isArabic ? 'النقرات' : 'Clicks'}
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {loading ? '...' : clicks.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-sura-line bg-sura-canvas p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-sura-navy/60">
            {isArabic ? 'نسبة النقر' : 'CTR'}
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {loading ? '...' : `${ctr}%`}
          </div>
        </div>
      </div>
    </div>
  );
}
