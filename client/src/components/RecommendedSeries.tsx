import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { fetchRecommendedSeries, type SeriesListItem } from '../services/seriesService';

interface RecommendedSeriesProps {
  currentSeriesId?: string;
  category?: string;
}

export function RecommendedSeries({ currentSeriesId, category }: RecommendedSeriesProps) {
  const { locale } = useLocale();
  const [series, setSeries] = useState<SeriesListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchRecommendedSeries(category, 4)
      .then((data) => {
        if (mounted) {
          // Filter out current series
          setSeries(currentSeriesId ? data.filter((s) => s.id !== currentSeriesId) : data);
        }
      })
      .catch(() => {
        if (mounted) setSeries([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [category, currentSeriesId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-sura-ivory/10" />
        <div className="h-20 animate-pulse rounded-2xl bg-sura-ivory/10" />
        <div className="h-20 animate-pulse rounded-2xl bg-sura-ivory/10" />
      </div>
    );
  }

  if (series.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-sura-ink/80">
        {locale === 'ar' ? 'سلاسل مقترحة' : 'Recommended Series'}
      </h3>

      <div className="space-y-2">
        {series.map((s) => (
          <Link
            key={s.id}
            to={`/series/${encodeURIComponent(s.slug)}`}
            className="flex items-center gap-3 rounded-2xl border border-sura-line bg-sura-canvas p-3 transition hover:bg-white/5"
          >
            {s.coverImage && (
              <img
                src={s.coverImage}
                alt={s.title}
                className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-sura-ink">{s.title}</div>
              <div className="flex items-center gap-2 text-[10px] text-sura-navy/50">
                <span>{s.difficulty}</span>
                <span>•</span>
                <span>{s.itemCount} {s.itemCount === 1 ? 'item' : 'items'}</span>
              </div>
              {s.progress !== undefined && s.progress > 0 && (
                <div className="mt-1 h-1 rounded-full bg-sura-ivory/10">
                  <div
                    className="h-full rounded-full bg-sura-gold"
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
