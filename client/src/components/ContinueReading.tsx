import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';

interface ContinueReadingItem {
  id: string;
  contentType: 'article' | 'novel' | 'chapter' | 'book';
  contentId: string;
  title: string | null;
  progress: number;
  updatedAt: string;
}

interface ContinueReadingProps {
  limit?: number;
  showTitle?: boolean;
}

export function ContinueReading({ limit = 5, showTitle = true }: ContinueReadingProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [items, setItems] = useState<ContinueReadingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isArabic = locale === 'ar';

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !supabase) {
        // Load from localStorage for guests
        const stored = localStorage.getItem('reading_history');
        if (stored) {
          try {
            setItems(JSON.parse(stored));
          } catch {
            setItems([]);
          }
        }
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ReadingHistory')
          .select('id, contentType, contentId, title, progress, updatedAt')
          .eq('userId', user.id)
          .gt('progress', 0)
          .lt('progress', 100)
          .order('updatedAt', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error('Failed to fetch reading history:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, limit]);

  const getLink = (item: ContinueReadingItem) => {
    switch (item.contentType) {
      case 'article':
        return `/articles/${item.contentId}`;
      case 'novel':
        return `/novels/${item.contentId}`;
      case 'chapter':
        return `/novels/${item.contentId.split('_')[0]}?chapter=${item.contentId}`;
      case 'book':
        return `/books/${item.contentId}`;
      default:
        return '/';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'article':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v2H7V8z" />
          </svg>
        );
      case 'novel':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return isArabic ? 'الآن' : 'Just now';
    if (diffMins < 60) return isArabic ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isArabic ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return isArabic ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    return date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {showTitle && <div className="h-6 w-40 animate-pulse rounded bg-sura-dark/50" />}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-sura-dark/30" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <h3 className="text-lg font-semibold text-sura-ivory">
          {isArabic ? 'متابعة القراءة' : 'Continue Reading'}
        </h3>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={`${item.contentType}-${item.contentId}`}
            to={getLink(item)}
            className="group flex items-center gap-3 rounded-lg border border-sura-ivory/10 bg-sura-dark/30 p-3 transition hover:border-sura-ivory/30 hover:bg-sura-dark/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sura-teal/10 text-sura-teal">
              {getIcon(item.contentType)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sura-ivory group-hover:text-sura-teal">
                {item.title || (isArabic ? 'بدون عنوان' : 'Untitled')}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-sura-teal"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="text-xs text-sura-ivory/50">{item.progress}%</span>
              </div>
            </div>
            <span className="text-xs text-sura-ivory/40">{formatDate(item.updatedAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ContinueReading;