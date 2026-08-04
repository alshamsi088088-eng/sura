import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';

interface HistoryEntry {
  id: string;
  contentType: string;
  contentId: string;
  title: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export function ReadingHistoryList() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

useEffect(() => {
    if (!user || !supabase) return;
    const client = supabase;

    const loadHistory = async () => {
      setLoading(true);
      try {
        let query = client
          .from('ReadingHistory')
          .select('*')
          .eq('userId', user.id)
          .order('updatedAt', { ascending: false })
          .limit(50);

        if (filter !== 'all') {
          query = query.eq('contentType', filter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Failed to load reading history:', err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user, filter]);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'article': return '📄';
      case 'chapter': return '📖';
      case 'novel': return '📚';
      case 'book': return '📕';
      default: return '📄';
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      article: { en: 'Article', ar: 'مقال' },
      chapter: { en: 'Chapter', ar: 'فصل' },
      novel: { en: 'Novel', ar: 'رواية' },
      book: { en: 'Book', ar: 'كتاب' },
    };
    const label = labels[type];
    return label ? (isArabic ? label.ar : label.en) : type;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-sura-ivory/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: isArabic ? 'الكل' : 'All' },
          { value: 'article', label: isArabic ? 'مقالات' : 'Articles' },
          { value: 'chapter', label: isArabic ? 'فصول' : 'Chapters' },
          { value: 'novel', label: isArabic ? 'روايات' : 'Novels' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              filter === f.value
                ? 'bg-[#7F77DD] text-white'
                : 'border border-sura-ivory/20 text-sura-ivory/70 hover:border-[#7F77DD]/50'
            }`}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sura-ivory/20 bg-sura-dark/50 py-12 text-center">
          <div className="text-4xl">📖</div>
          <p className="mt-4 text-sm text-sura-ivory/50">
            {isArabic ? 'لا توجد قراءات بعد' : 'No reading history yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 rounded-lg border border-sura-ivory/10 bg-sura-dark/30 p-4 transition hover:border-sura-ivory/20"
            >
              <div className="text-2xl">{getContentIcon(entry.contentType)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-sura-ivory">
                  {entry.title || (isArabic ? 'بدون عنوان' : 'Untitled')}
                </div>
                <div className="flex items-center gap-2 text-xs text-sura-ivory/50">
                  <span>{getContentTypeLabel(entry.contentType)}</span>
                  <span>•</span>
                  <span>
                    {new Date(entry.updatedAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[#7F77DD]">{entry.progress}%</div>
                <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-sura-ivory/10">
                  <div
                    className="h-full rounded-full bg-[#7F77DD]"
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
