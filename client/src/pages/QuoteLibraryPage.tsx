import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { QuoteCard, type QuoteItem } from '../components/QuoteCard';

interface QuoteWithContent extends QuoteItem {
  contentTitle?: string;
  contentSlug?: string;
  authorName?: string;
}

export function QuoteLibraryPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'article' | 'novel' | 'chapter'>('all');

  const isArabic = locale === 'ar';

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch quotes
  useEffect(() => {
    if (!user) return;

    const fetchQuotes = async () => {
      setLoading(true);

      try {
        const res = await fetch('/api/quotes', {
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          setQuotes(data.quotes || []);
        }
      } catch (err) {
        console.error('Failed to fetch quotes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user]);

  const filteredQuotes = filter === 'all'
    ? quotes
    : quotes.filter(q => q.contentType === filter);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article':
        return isArabic ? 'مقالات' : 'Articles';
      case 'novel':
        return isArabic ? 'روايات' : 'Novels';
      case 'chapter':
        return isArabic ? 'فصول' : 'Chapters';
      default:
        return isArabic ? 'الكل' : 'All';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-sura-navy pt-20">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-sura-ivory">
            {isArabic ? 'مكتبتي' : 'My Library'}
          </h1>
          <p className="mt-1 text-sm text-sura-ivory/60">
            {isArabic
              ? 'اقتباساتك المحفوظة'
              : 'Your saved quotes'}
          </p>
        </div>

        {/* Tabs / Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-sura-ivory/10 pb-1">
          {(['all', 'article', 'novel', 'chapter'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium transition ${
                filter === type
                  ? 'border-b-2 border-sura-teal text-sura-teal'
                  : 'text-sura-ivory/60 hover:text-sura-ivory'
              }`}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-sura-dark/30"
              />
            ))}
          </div>
        ) : filteredQuotes.length > 0 ? (
          <div className="space-y-4">
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-sura-ivory/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.643m5.326-1.32a3 3 0 014.952-1.31m-4.952 1.31l6.632-3.642m0 0a3 3 0 01-4.952-1.31m4.952 4.964l-6.632-3.642m0 0a3 3 0 01-4.952-1.31m4.952 4.964l-4.952-1.31"
              />
            </svg>
            <p className="mt-4 text-sura-ivory/60">
              {isArabic
                ? 'لا توجد اقتباسات محفوظة'
                : 'No saved quotes yet'}
            </p>
            <p className="mt-1 text-sm text-sura-ivory/40">
              {isArabic
                ? 'حدد نصاً واستمتع بحفظه'
                : 'Select text while reading to save quotes'}
            </p>
            <Link
              to="/articles"
              className="mt-4 inline-block rounded-lg bg-sura-teal px-4 py-2 text-sm font-medium text-white"
            >
              {isArabic ? 'تصفح المقالات' : 'Browse Articles'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuoteLibraryPage;