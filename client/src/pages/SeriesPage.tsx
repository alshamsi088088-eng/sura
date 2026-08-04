import { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';
import { fetchAllSeries, type SeriesListItem } from '../services/seriesService';
import { SeriesCard } from '../components/SeriesCard';

export function SeriesPage() {
  const { locale, strings } = useLocale();
  const [series, setSeries] = useState<SeriesListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  useSeoTags({
    title: locale === 'ar' ? 'السلاسل — سُرى' : 'Series — Sura Codex',
    description:
      locale === 'ar'
        ? 'استعرض السلاسل المنظمة من المقالات والروايات حسب الصعوبة والفئة.'
        : 'Browse curated reading series organized by difficulty and category.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/series`,
    openGraph: { type: 'website' },
    twitter: { cardType: 'summary_large_image' },
    locale,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: locale === 'ar' ? 'السلاسل — سُرى' : 'Series — Sura Codex',
        description:
          locale === 'ar'
            ? 'استعرض السلاسل المنظمة من المقالات والروايات حسب الصعوبة والفئة.'
            : 'Browse curated reading series organized by difficulty and category.',
        url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/series`,
        inLanguage: locale === 'ar' ? 'ar' : 'en',
      },
    ],
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchAllSeries()
      .then((data) => {
        if (mounted) setSeries(data);
      })
      .catch(() => {
        if (mounted) setError(locale === 'ar' ? 'فشل تحميل السلاسل.' : 'Failed to load series.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [locale]);

  // Extract unique categories and difficulties
  const categories = ['All', ...new Set(series.map((s) => s.category))];
  const difficulties = ['All', ...new Set(series.map((s) => s.difficulty))];

  // Filter
  const filtered = series.filter((s) => {
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'All' || s.difficulty === difficultyFilter;
    return matchesCategory && matchesDifficulty;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">
              {locale === 'ar' ? 'السلاسل' : 'Reading Series'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">
              {locale === 'ar'
                ? 'مجموعات منظمة من المقالات والروايات لمتابعة قراءة متسلسلة.'
                : 'Curated collections of articles and novels for sequential reading.'}
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
        <div className="flex flex-wrap gap-3">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-4 py-2 text-sm ${
                  categoryFilter === cat
                    ? 'bg-sura-navy text-white'
                    : 'border border-sura-line text-sura-navy/80 hover:border-sura-gold/50'
                }`}
              >
                {cat === 'All' ? (locale === 'ar' ? 'الكل' : 'All') : cat}
              </button>
            ))}
          </div>

          {/* Difficulty Filter */}
          <div className="flex flex-wrap gap-2">
            {difficulties.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={`rounded-full px-4 py-2 text-sm ${
                  difficultyFilter === diff
                    ? 'bg-sura-teal text-white'
                    : 'border border-sura-line text-sura-navy/80 hover:border-sura-teal/50'
                }`}
              >
                {diff === 'All' ? (locale === 'ar' ? 'الكل' : 'All') : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-sura-line bg-sura-canvas p-6 animate-pulse">
              <div className="h-40 rounded-2xl bg-sura-ivory/10 mb-4" />
              <div className="h-4 w-24 rounded bg-sura-ivory/10 mb-3" />
              <div className="h-6 w-48 rounded bg-sura-ivory/10 mb-2" />
              <div className="h-4 w-full rounded bg-sura-ivory/10 mb-1" />
              <div className="h-4 w-3/4 rounded bg-sura-ivory/10" />
            </div>
          ))}
        </div>
      )}

      {/* Series Grid */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-sura-line bg-sura-canvas p-8 text-center">
              <p className="text-sura-navy/60">
                {locale === 'ar' ? 'لا توجد سلاسل متطابقة.' : 'No matching series found.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
