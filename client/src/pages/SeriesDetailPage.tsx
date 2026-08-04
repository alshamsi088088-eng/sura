import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useSeoTags } from '../hooks/useSeoTags';
import {
  fetchSeriesBySlug,
  fetchSeriesProgress,
  type SeriesDetail,
  type SeriesProgressInfo,
} from '../services/seriesService';
import { SeriesProgressBar } from '../components/SeriesProgressBar';
import { SeriesNavigation } from '../components/SeriesNavigation';
import { RecommendedSeries } from '../components/RecommendedSeries';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-green-400 border-green-400/30 bg-green-400/10',
  intermediate: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  advanced: 'text-red-400 border-red-400/30 bg-red-400/10',
};

export function SeriesDetailPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();

  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [progress, setProgress] = useState<SeriesProgressInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSeoTags({
    title: series ? `${series.title} — سُرى` : (locale === 'ar' ? 'السلسلة — سُرى' : 'Series — Sura Codex'),
    description: series?.description || (locale === 'ar' ? 'تفاصيل السلسلة' : 'Series details'),
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/series/${encodeURIComponent(slug || '')}`,
    openGraph: {
      type: 'article',
      ...(series?.coverImage ? { image: { url: series.coverImage, alt: series.title } } : {}),
    },
    twitter: { cardType: 'summary_large_image' },
    locale,
    jsonLd: series
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Series',
            name: series.title,
            description: series.description,
            image: series.coverImage,
            author: { '@type': 'Person', name: series.authorName },
            numberOfItems: series.itemCount,
            difficulty: series.difficulty,
          },
        ]
      : [],
  });

  useEffect(() => {
    if (!slug) {
      setError(locale === 'ar' ? 'السلسلة غير موجودة.' : 'Series not found.');
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    const decodedSlug = (() => {
      try {
        return decodeURIComponent(slug);
      } catch {
        return slug;
      }
    })();

    fetchSeriesBySlug(decodedSlug)
      .then((data) => {
        if (mounted) setSeries(data);

        // Fetch progress if logged in
        if (user) {
          fetchSeriesProgress(decodedSlug)
            .then((p) => { if (mounted) setProgress(p); })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (mounted) setError(locale === 'ar' ? 'فشل تحميل السلسلة.' : 'Failed to load series.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [slug, locale, user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-72 animate-pulse rounded-3xl bg-sura-ivory/10" />
        <div className="h-24 animate-pulse rounded-3xl bg-sura-ivory/10" />
        <div className="h-48 animate-pulse rounded-3xl bg-sura-ivory/10" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-sura-line bg-sura-canvas p-8 text-center">
        <h1 className="text-3xl font-semibold">
          {locale === 'ar' ? 'خطأ' : 'Error'}
        </h1>
        <p className="mt-4 text-sm leading-7 text-sura-navy/80">{error || ''}</p>
      </div>
    );
  }

  const difficultyColor = DIFFICULTY_COLORS[series.difficulty] || 'text-sura-ink/60 border-white/10 bg-white/5';

  const getContentUrl = (item: { contentType: string; slug: string }): string => {
    if (item.contentType === 'article') return `/articles/${encodeURIComponent(item.slug)}`;
    if (item.contentType === 'novel') return `/novels/${encodeURIComponent(item.slug)}`;
    return '#';
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Series Header */}
      <div className="rounded-3xl border border-sura-line bg-sura-canvas overflow-hidden">
        {series.coverImage && (
          <div className="h-48 sm:h-64 overflow-hidden">
            <img
              src={series.coverImage}
              alt={series.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs uppercase tracking-[0.3em] text-sura-teal">
                  {series.category}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${difficultyColor}`}>
                  {series.difficulty}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-semibold">{series.title}</h1>
              <p className="text-sm leading-7 text-sura-navy/80">{series.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-sura-navy/60">
                <span>{locale === 'ar' ? 'بواسطة' : 'By'} {series.authorName}</span>
                <span>•</span>
                <span>{series.itemCount} {locale === 'ar' ? 'مُحتوى' : series.itemCount === 1 ? 'item' : 'items'}</span>
                <span>•</span>
                <span>{series.estimatedReadingTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress + Navigation */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {progress && (
            <SeriesProgressBar
              progress={progress.progress}
              totalItems={progress.totalItems}
              completedItems={progress.completedItems}
            />
          )}

          {/* Article List */}
          <div className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
            <h2 className="text-lg font-semibold mb-4">
              {locale === 'ar' ? 'المحتوى' : 'Content'}
              <span className="ml-2 text-sm font-normal text-sura-navy/50">
                ({series.items.length} {locale === 'ar' ? 'مادة' : 'items'})
              </span>
            </h2>

            <div className="space-y-2">
              {series.items.map((item) => (
                <Link
                  key={item.seriesItemId}
                  to={getContentUrl(item)}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition hover:bg-white/5 ${
                    item.completed
                      ? 'border-green-400/20 bg-green-400/5'
                      : 'border-sura-line'
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    {item.completed ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-400/20">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : item.progress > 0 ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sura-gold/20">
                        <span className="text-[10px] font-bold text-sura-gold">{item.progress}%</span>
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sura-ivory/10">
                        <span className="text-xs text-sura-navy/40">{item.order + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`truncate text-sm font-medium ${item.completed ? 'text-green-400' : 'text-sura-ink'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-sura-navy/40">
                        {item.contentType}
                      </span>
                    </div>
                    {item.readingTime && (
                      <div className="mt-0.5 text-xs text-sura-navy/50">{item.readingTime}</div>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-sura-navy/30">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {user && progress && (
            <SeriesNavigation
              previousItem={progress.previousItem}
              nextItem={progress.nextItem}
              continueItem={progress.continueItem}
              completed={progress.completed}
              seriesSlug={series.slug}
            />
          )}

          <RecommendedSeries
            currentSeriesId={series.id}
            category={series.category}
          />
        </div>
      </div>
    </div>
  );
}
