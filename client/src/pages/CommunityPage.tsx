import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DiscussionCard } from '../components/DiscussionCard';
import { DiscussionEditor } from '../components/DiscussionEditor';
import { useSeoTags } from '../hooks/useSeoTags';
import { useLocale } from '../context/LocaleContext';

interface Thread {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  replyCount: number;
}

export function CommunityPage() {
  const { locale } = useLocale();
  const { contentId, contentType } = useParams<{ contentId?: string; contentType?: string }>();

  useSeoTags({
    title: locale === 'ar' ? 'المجتمع | سُرى' : 'Community | Sura Codex',
    description: locale === 'ar'
      ? 'انضم إلى مجتمع سُرى للمناقشات الأدبية والتقنية.'
      : 'Join the Sura Codex community for literary and technical discussions.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/community`,
    openGraph: {
      type: 'website',
      // TODO: Add dedicated 1200×630 OG image when available
    },
    twitter: {
      cardType: 'summary_large_image',
      // TODO: Add dedicated Twitter image when available
    },
    locale,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: locale === 'ar' ? 'المجتمع | سُرى' : 'Community | Sura Codex',
        description: locale === 'ar'
          ? 'انضم إلى مجتمع سُرى للمناقشات الأدبية والتقنية.'
          : 'Join the Sura Codex community for literary and technical discussions.',
        url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/community`,
        inLanguage: locale === 'ar' ? 'ar' : 'en',
      },
    ],
  });

  const [threads, setThreads] = useState<Thread[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sort, setSort] = useState('latest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [contentId, contentType, selectedCategory, sort, search, page]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/community/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('sort', sort);
      if (selectedCategory !== 'All') {
        params.set('category', selectedCategory);
      }
      if (search) {
        params.set('search', search);
      }
      if (contentId) {
        params.set('contentId', contentId);
      }
      if (contentType) {
        params.set('contentType', contentType);
      }

      const res = await fetch(`/api/community/threads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setThreads(threads.filter((t) => t.id !== id));
  };

  const handleSuccess = (thread: unknown) => {
    const t = thread as Thread;
    if (t?.id) setThreads([t, ...threads]);
    setShowEditor(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          {contentId ? 'Content Discussions' : 'Community Discussions'}
        </h1>
        <button
          onClick={() => setShowEditor(!showEditor)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Discussion
        </button>
      </div>

      {showEditor && (
        <div className="mb-6">
          <DiscussionEditor
            contentId={contentId}
            contentType={contentType}
            onSuccess={handleSuccess}
            onCancel={() => setShowEditor(false)}
          />
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="most_liked">Most Liked</option>
            <option value="most_commented">Most Commented</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search..."
            className="flex-1 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 min-w-[150px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No discussions yet. Be the first to start one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <DiscussionCard key={thread.id} thread={thread} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}