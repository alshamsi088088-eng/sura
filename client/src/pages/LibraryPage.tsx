import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';

interface BookmarkItem {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  coverImage?: string;
  authorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BookmarksData {
  articles: BookmarkItem[];
  novels: BookmarkItem[];
  chapters: BookmarkItem[];
  books: BookmarkItem[];
}

export function LibraryPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [bookmarks, setBookmarks] = useState<BookmarksData>({
    articles: [],
    novels: [],
    chapters: [],
    books: []
  });
  const [activeTab, setActiveTab] = useState<'articles' | 'novels' | 'chapters' | 'books'>('articles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isArabic = locale === 'ar';

  // Fetch bookmarks
  const fetchBookmarks = useCallback(async () => {
    if (!user || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase!
        .from('Bookmark')
        .select('*, article:Article(id, title, slug, excerpt, authorName), novel:Novel(id, title, slug, authorName), chapter:Chapter(id, title, number, novelId), book:Book(id, title, author, coverImage)')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (fetchError) throw fetchError;

      // Group by content type
      const grouped: BookmarksData = {
        articles: [],
        novels: [],
        chapters: [],
        books: []
      };

      data?.forEach((bookmark) => {
        if (bookmark.article) {
          grouped.articles.push(bookmark.article);
        } else if (bookmark.novel) {
          grouped.novels.push(bookmark.novel);
        } else if (bookmark.chapter) {
          grouped.chapters.push(bookmark.chapter);
        } else if (bookmark.book) {
          grouped.books.push(bookmark.book);
        }
      });

      setBookmarks(grouped);
    } catch (err) {
      console.error('Bookmarks fetch error:', err);
      setError(isArabic ? 'فشل تحميل المفضلات' : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [user, isArabic]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRemove = async (bookmarkId: string) => {
    if (!supabase) return;
    try {
      await supabase.from('Bookmark').delete().eq('id', bookmarkId);
      // Refetch after removal
      fetchBookmarks();
    } catch (err) {
      console.error('Remove bookmark error:', err);
    }
  };

  const tabs = [
    { key: 'articles' as const, label: isArabic ? 'المقالات' : 'Articles', count: bookmarks.articles.length },
    { key: 'novels' as const, label: isArabic ? 'الروايات' : 'Novels', count: bookmarks.novels.length },
    { key: 'chapters' as const, label: isArabic ? 'الفصول' : 'Chapters', count: bookmarks.chapters.length },
    { key: 'books' as const, label: isArabic ? 'الكتب' : 'Books', count: bookmarks.books.length }
  ];

  const renderItems = () => {
    const items = bookmarks[activeTab];

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sura-ivory/20 border-t-sura-teal" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-8 text-center text-red-400">{error}</div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="py-12 text-center text-sura-ivory/50">
          {isArabic ? 'لا توجد عناصر محفوظة بعد.' : 'No saved items yet.'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-4 rounded-xl border border-sura-ivory/10 bg-sura-dark/50 p-4 transition hover:border-sura-ivory/30"
          >
            {item.coverImage && (
              <img
                src={item.coverImage}
                alt={item.title}
                className="h-16 w-12 shrink-0 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <Link
                to={`/${activeTab}/${item.slug || item.id}`}
                className="block truncate text-lg font-medium text-sura-ivory hover:text-sura-teal"
              >
                {item.title}
              </Link>
              {item.authorName && (
                <div className="text-sm text-sura-ivory/50">{item.authorName}</div>
              )}
            </div>
            <button
              onClick={() => handleRemove(item.id)}
              className="shrink-0 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 opacity-0 transition hover:bg-red-500/20 group-hover:opacity-100"
            >
              {isArabic ? 'إزالة' : 'Remove'}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-8">
        <h1 className="text-3xl font-semibold text-sura-ivory">
          {isArabic ? 'مكتبتي' : 'My Library'}
        </h1>
        <p className="mt-2 text-sura-ivory/60">
          {isArabic
            ? 'قائمة الكتب والمقالات المحفوظة للقراءة لاحقاً.'
            : 'Your saved books and articles for later reading.'}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-sura-ivory/10 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-sura-teal text-sura-teal'
                : 'border-transparent text-sura-ivory/60 hover:text-sura-ivory'
            }`}
          >
            {tab.label}
            <span className="ml-2 rounded-full bg-sura-ivory/10 px-2 py-0.5 text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-sura-ivory/10 bg-sura-dark/50 p-6">
        {renderItems()}
      </div>
    </div>
  );
}