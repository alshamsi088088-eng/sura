import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';
import { useAuth } from '../context/AuthContext';
import { fetchCircles, type Circle } from '../services/studyCircleService';
import { CircleCard } from '../components/circles/CircleCard';
import { EmptyState } from '../components/feed/EmptyState';
import { ErrorState } from '../components/feed/ErrorState';

/**
 * Study Circles — browse circles, search, CTA to create.
 */
export function StudyCirclesPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useSeoTags({
    title: isArabic ? 'حلقات الدراسة | سُرى' : 'Study Circles | Sura Codex',
    description: isArabic
      ? 'انضم إلى حلقات الدراسة: جداول قراءة، أهداف أسبوعية، ملاحظات مشتركة ومهام.'
      : 'Join study circles: reading schedules, weekly goals, shared notes and assignments.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/study-circles`,
    openGraph: { type: 'website' },
    twitter: { cardType: 'summary_large_image' },
    locale,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: isArabic ? 'حلقات الدراسة | سُرى' : 'Study Circles | Sura Codex',
        url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/study-circles`,
        inLanguage: locale,
      },
    ],
  });

  const loadCircles = async (targetPage = 1, q = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchCircles({ search: q || undefined, page: targetPage, limit: 12 });
      setCircles(res.circles);
      setTotalPages(res.totalPages);
    } catch {
      setError(isArabic ? 'فشل تحميل الحلقات' : 'Failed to load circles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCircles(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-sura-ivory">
              {isArabic ? 'حلقات الدراسة' : 'Study Circles'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-sura-ivory/60">
              {isArabic
                ? 'ادرس بانتظام مع مجموعة: جداول قراءة، أهداف أسبوعية، ملاحظات ومهام مشتركة.'
                : 'Study consistently with a group: reading schedules, weekly goals, shared notes and assignments.'}
            </p>
          </div>
          {user && (
            <Link
              to="/study-circles/new"
              className="rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-charcoal hover:opacity-90"
            >
              {isArabic ? '+ حلقة جديدة' : '+ New Circle'}
            </Link>
          )}
        </div>
      </header>

      <div className="flex justify-end">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={isArabic ? 'ابحث...' : 'Search circles...'}
          className="w-full max-w-xs rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
        />
      </div>

      {error && <ErrorState message={error} onRetry={() => loadCircles(1, search)} />}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl border border-sura-line bg-sura-canvas" />
          ))}
        </div>
      ) : circles.length === 0 ? (
        <EmptyState
          title={isArabic ? 'لا توجد حلقات' : 'No circles yet'}
          description={isArabic ? 'ابدأ حلقة الدراسة الأولى!' : 'Start the first study circle!'}
          action={
            user ? (
              <Link to="/study-circles/new" className="rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-charcoal">
                {isArabic ? 'إنشاء حلقة' : 'Create a circle'}
              </Link>
            ) : (
              <Link to="/login" className="rounded-full border border-sura-gold px-5 py-2 text-sm font-semibold text-sura-gold">
                {isArabic ? 'تسجيل الدخول' : 'Log in'}
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {circles.map((circle) => (
            <CircleCard key={circle.id} circle={circle} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-sura-ivory/20 px-4 py-1.5 text-sm text-sura-ivory/70 disabled:opacity-40"
          >
            {isArabic ? 'السابق' : 'Prev'}
          </button>
          <span className="px-2 py-1.5 text-sm text-sura-ivory/50">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-sura-ivory/20 px-4 py-1.5 text-sm text-sura-ivory/70 disabled:opacity-40"
          >
            {isArabic ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}

export default StudyCirclesPage;
