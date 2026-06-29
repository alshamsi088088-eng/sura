import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

const API_URL = import.meta.env.VITE_API_URL || '';

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

interface DiscussionItem {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  authorName?: string;
}

interface ReadingItem {
  id: string;
  contentType: string;
  contentId: string;
  title: string | null;
  progress: number;
  updatedAt: string;
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
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingItem[]>([]);
  const [activeTab, setActiveTab] = useState<'articles' | 'novels' | 'chapters' | 'books' | 'discussions' | 'history'>('articles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isArabic = locale === 'ar';

  // Fetch bookmarks and saved content
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/engagement/bookmarks`, {
        credentials: 'include'
      });
      const data = await res.json();

      const grouped: BookmarksData = {
        articles: [],
        novels: [],
        chapters: [],
        books: []
      };

      if (data?.bookmarks) {
        data.bookmarks.forEach((bookmark: any) => {
          if (bookmark.article) grouped.articles.push(bookmark.article);
          else if (bookmark.novel) grouped.novels.push(bookmark.novel);
          else if (bookmark.chapter) grouped.chapters.push(bookmark.chapter);
          else if (bookmark.book) grouped.books.push(bookmark.book);
        });
      }

      setBookmarks(grouped);

      // Fetch saved discussions
      const res2 = await fetch(`${API_URL}/api/engagement/community-bookmarks`, {
        credentials: 'include'
      });
      const communityData = await res2.json();

      if (communityData?.bookmarks) {
        setDiscussions(
          communityData.bookmarks.map((cb: any) => ({
            id: cb.thread?.id || cb.threadId,
            title: cb.thread?.title || '',
            category: cb.thread?.category || '',
            createdAt: cb.createdAt
          }))
        );
      }
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
    try {
      await fetch(`${API_URL}/api/engagement/bookmark`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookmarkId })
      });
      fetchBookmarks();
    } catch (err) {
      console.error('Remove bookmark error:', err);
    }
  };

  const handleRemoveDiscussion = async (threadId: string) => {
    try {
      await fetch(`${API_URL}/api/engagement/community-bookmark`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ threadId })
      });
      setDiscussions((prev) => prev.filter((d) => d.id !== threadId));
    } catch (err) {
      console.error('Remove discussion error:', err);
    }
  };

  const tabs = [
    { key: 'articles' as const, label: isArabic ? 'المقالات' : 'Articles', count: bookmarks.articles.length },
    { key: 'novels' as const, label: isArabic ? 'الروايات' : 'Novels', count: bookmarks.novels.length },
    { key: 'chapters' as const, label: isArabic ? 'الفصول' : 'Chapters', count: bookmarks.chapters.length },
    { key: 'books' as const, label: isArabic ? 'الكتب' : 'Books', count: bookmarks.books.length },
    { key: 'discussions' as const, label: isArabic ? 'النقاشات' : 'Discussions', count: discussions.length },
    { key: 'history' as const, label: isArabic ? 'السجل' : 'History', count: readingHistory.length }
  ];

  const renderItems = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sura-ivory/20 border-t-sura-teal" />
        </div>
      );
    }

    if (error) {
      return <div className="py-8 text-center text-red-400">{error}</div>;
    }

    if (activeTab === 'discussions') {
      if (discussions.length === 0) {
        return (
          <div className="py-12 text-center text-sura-ivory/50">
            {isArabic ? 'لا توجد نقاشات محفوظة بعد.' : 'No saved discussions yet.'}
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {discussions.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between rounded-xl border border-sura-ivory/10 bg-sura-dark/50 p-4 transition hover:border-sura-ivory/30"
            >
              <Link
                to={`/community/thread/${item.id}`}
                className="flex-1 min-w-0"
              >
                <p className="truncate text-lg font-medium text-sura-ivory hover:text-sura-teal">
                  {item.title}
                </p>
                <p className="text-sm text-sura-ivory/50">
                  {new Date(item.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </Link>
              <button
                onClick={() => handleRemoveDiscussion(item.id)}
                className="shrink-0 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 opacity-0 transition hover:bg-red-500/20 group-hover:opacity-100"
              >
                {isArabic ? 'إزالة' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'history') {
      if (readingHistory.length === 0) {
        return (
          <div className="py-12 text-center text-sura-ivory/50">
            {isArabic ? 'لا يوجد سجل قراءة بعد.' : 'No reading history yet.'}
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {readingHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-sura-ivory/10 bg-sura-dark/50 p-4"
            >
              <div className="flex-1 min-w-0">
                <Link
                  to={`/${item.contentType}/${item.contentId}`}
                  className="block truncate text-lg font-medium text-sura-ivory hover:text-sura-teal"
                >
                  {item.title || item.contentType}
                </Link>
                <div className="mt-1 h-1 w-full rounded-full bg-sura-ivory/20">
                  <div
                    className="h-1 rounded-full bg-sura-teal"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-sm text-sura-ivory/50">
                  {item.progress}% {isArabic ? 'مكتمل' : 'complete'}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    const items = bookmarks[activeTab];
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
              <img src={item.coverImage} alt={item.title} className="h-16 w-12 shrink-0 rounded object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <Link
                to={`/${activeTab}/${item.slug || item.id}`}
                className="block truncate text-lg font-medium text-sura-ivory hover:text-sura-teal"
              >
                {item.title}
              </Link>
              {item.authorName && <div className="text-sm text-sura-ivory/50">{item.authorName}</div>}
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

      <div className="flex gap-2 overflow-x-auto border-b border-sura-ivory/10 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-sura-teal text-sura-teal'
                : 'border-transparent text-sura-ivory/60 hover:text-sura-ivory'
            }`}
          >
            {tab.label}
            <span className="ml-2 rounded-full bg-sura-ivory/10 px-2 py-0.5 text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-sura-ivory/10 bg-sura-dark/50 p-6">{renderItems()}</div>
    </div>
  );
}