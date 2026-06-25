import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { ThreadedComments } from '../components/ThreadedComments';
import { AdsenseAd } from '../components/AdsenseAd';
import { LikeShareBar } from '../components/LikeShareBar';
import { trackEvent } from '../lib/analytics';
import { LikeButton } from '../components/LikeButton';
import { BookmarkButton } from '../components/BookmarkButton';
import { RatingStars } from '../components/RatingStars';
import { useSeoTags } from '../hooks/useSeoTags';


interface ArticleRow {
  id?: string;
  slug?: string;
  article_id?: string;
  articleId?: string;
  pk?: string;
  title?: string;
  excerpt?: string;
  category?: string;
  language?: string;
  readingTime?: string;
  reading_time?: string;
  authorName?: string;
  author?: string;
  author_name?: string;
  author_id?: string;
  authorId?: string;
  views?: number;
  view_count?: number;
  claps?: number;
  clap_count?: number;
}


interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  language: string;
  readingTime: string;
  author: string;
  views: number;
  claps: number;
}

const categories = ['Literature', 'Culture', 'Technology', 'Design', 'Arabic'];

function mapArticle(row: ArticleRow): Article {
  const id = String(row.id ?? row.article_id ?? row.articleId ?? row.pk ?? '');
  const slug = String((row as any).slug ?? row.id ?? row.article_id ?? row.articleId ?? row.pk ?? '');
  const title = String(row.title ?? '');
  const excerpt = String(row.excerpt ?? '');
  const category = String(row.category ?? '');
  const language = String(row.language ?? '');
  const readingTime = String(row.readingTime ?? row.reading_time ?? '');
  const author = String(
    row.authorName ??
      row.author ??
      row.author_name ??
      row.author_id ??
      row.authorId ??
      ''
  );
  const views = Number(row.views ?? row.view_count ?? 0);
  const claps = Number(row.claps ?? row.clap_count ?? 0);

  return { id, slug, title, excerpt, category, language, readingTime, author, views, claps };
}



export function ArticlesPage() {
  const { locale, strings } = useLocale();
  useSeoTags({
    title: locale === 'ar' ? 'المقالات — سُرى' : 'Articles — Sura Codex',
    description:
      locale === 'ar'
        ? 'مجموعة مقالات منظمة مع قراءة أعمق: المؤلف، وقت القراءة، وفئات مختارة.'
        : 'Browse curated articles with deeper reading: author details, reading time, and categories.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/articles`,
    openGraph: {
      type: 'website',
      image: { url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg`, alt: 'Sura Codex' },
    },
    twitter: {
      cardType: 'summary_large_image',
      image: { url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg`, alt: 'Sura Codex' },
    },
  });

  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const pageSize = 6;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      if (!supabase) {
        setError(locale === 'ar' ? 'Supabase غير مهيأ.' : 'Supabase is not initialized.');
        setIsLoading(false);
        return;
      }

      try {
        // قراءة كل الأعمدة برمجياً لضمان توافق الاسماء مع الواقع
        const { data, error: selectError } = await supabase
          .from('Article')
          .select('*');

        if (selectError) throw selectError;

        const rows = Array.isArray(data) ? (data as ArticleRow[]) : [];
        const mapped = rows.map(mapArticle).filter((a) => a.id && a.title);

        if (mounted) setArticles(mapped);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch articles from Supabase', e);
        if (mounted) setError(locale === 'ar' ? 'فشل تحميل المقالات.' : 'Failed to load articles.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [locale]);

  const allTags = useMemo(() => ['All', ...Array.from(new Set(articles.flatMap((a) => [a.category, a.language])))], [articles]);
  const authors = useMemo(() => ['All', ...Array.from(new Set(articles.map((a) => a.author)))], [articles]);

  const filtered = useMemo(() => {
    const byCategory = selected === 'All' ? articles : articles.filter((item) => item.category === selected);
    const byAuthor = authorFilter === 'All' ? byCategory : byCategory.filter((item) => item.author === authorFilter);
    const byTag = tagFilter === 'All' ? byAuthor : byAuthor.filter((item) => item.category === tagFilter || item.language === tagFilter);
    const text = search.trim().toLowerCase();
    if (!text) return byTag;
    return byTag.filter((item) => `${item.title} ${item.excerpt}`.toLowerCase().includes(text));
  }, [articles, selected, authorFilter, tagFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [selected, authorFilter, tagFilter, search]);

  useEffect(() => {
    if (paginated.length && !paginated.some((a) => a.id === activeArticleId)) {
      setActiveArticleId(paginated[0].id);
    } else if (!paginated.length) {
      setActiveArticleId(null);
    }
  }, [paginated, activeArticleId]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">{strings.articles}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">
              {locale === 'ar'
                ? 'مجموعة المقالات المنظمة مع قراءة أعمق لكل نص.'
                : 'Browse essays with reading time, author details, and curated categories.'}
            </p>
          </div>

          {user ? (
            <Link
              to="/create-post"
              className="self-start rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-dark transition hover:opacity-95"
            >
              {locale === 'ar' ? 'Write New Post' : 'Write New Post'}
            </Link>
          ) : null}
        </div>
      </header>
      <div className="flex flex-col gap-4 rounded-3xl border border-sura-line bg-sura-canvas p-6">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelected('All')} className={`rounded-full px-4 py-2 text-sm ${selected === 'All' ? 'bg-sura-navy text-white' : 'border border-sura-line text-sura-navy/80'}`}>All</button>
          {(Array.isArray(categories) ? categories : []).map((category) => (
            <button key={category} onClick={() => setSelected(category)} className={`rounded-full px-4 py-2 text-sm ${selected === category ? 'bg-sura-navy text-white' : 'border border-sura-line text-sura-navy/80'}`}>{category}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'ابحث في المقالات...' : 'Search title/content...'}
            className="rounded-full border border-sura-line bg-sura-canvas px-4 py-2 text-sm text-sura-navy outline-none focus:border-sura-gold"
          />
          <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="rounded-full border border-sura-line bg-sura-canvas px-4 py-2 text-sm">
            {authors.map((author) => <option key={author} value={author}>{author}</option>)}
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-full border border-sura-line bg-sura-canvas px-4 py-2 text-sm">
            {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <div className="flex items-center gap-3 text-sm text-sura-navy/80">
            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'font-semibold text-sura-teal' : ''}>Grid</button>
            <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'font-semibold text-sura-teal' : ''}>List</button>
          </div>
        </div>
      </div>
      {viewMode === 'grid' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {(Array.isArray(paginated) ? paginated : []).map((item, idx) => (
            <div key={item.id} className={idx === 2 ? 'lg:col-span-2' : undefined}>
              {idx === 2 ? (
                <AdsenseAd
                  adSlot={import.meta.env.VITE_ADSENSE_ARTICLES_SLOT as string}
                  minHeightPx={280}
                  className="my-0"
                />
              ) : null}

              <article className="rounded-3xl border border-sura-line bg-sura-canvas p-6 transition hover:-translate-y-1 hover:bg-sura-canvas">
                <Link to={`/articles/${encodeURIComponent(item.slug || '')}`} className="sr-only">
                  {item.title}
                </Link>

                <div className="text-xs uppercase tracking-[0.3em] text-sura-teal">{item.category}</div>
                <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-sura-navy/80">{item.excerpt}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-sura-navy/70">
                  <span>{item.author}</span>
                  <span>•</span>
                  <span>{item.readingTime}</span>
                  <span>•</span>
                  <span>{item.views} views</span>
                </div>
                <button
                  className={`mt-4 rounded-full border px-3 py-1 text-xs ${activeArticleId === item.id ? 'border-sura-gold text-sura-teal' : 'border-sura-line text-sura-navy/80'}`}
                  onClick={() => {
                    setActiveArticleId(item.id);
                    trackEvent('article_read', {
                      article_id: item.id,
                      article_title: item.title
                    });
                  }}
                >
                  {locale === 'ar' ? 'عرض التعليقات' : 'Open comments'}
                </button>
              </article>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(Array.isArray(paginated) ? paginated : []).map((item, idx) => (
            <div key={item.id}>
              {idx === 2 ? (
                <AdsenseAd
                  adSlot={import.meta.env.VITE_ADSENSE_ARTICLES_SLOT as string}
                  minHeightPx={280}
                />
              ) : null}

              <article className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-sura-teal">{item.category}</div>
                    <h2 className="mt-2 text-2xl font-semibold">{item.title}</h2>
                  </div>
                  <div className="text-sm text-sura-navy/70">{item.readingTime}</div>
                </div>
                <p className="mt-4 text-sm leading-7 text-sura-navy/80">{item.excerpt}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-sura-navy/70">
                  <span>{item.author}</span>
                  <span>•</span>
                  <span>{item.views} views</span>
                  <span>•</span>
                  <span>{item.claps} claps</span>
                </div>
                <button
                  className={`mt-4 rounded-full border px-3 py-1 text-xs ${activeArticleId === item.id ? 'border-sura-gold text-sura-teal' : 'border-sura-line text-sura-navy/80'}`}
                  onClick={() => {
                    setActiveArticleId(item.id);
                    trackEvent('article_read', {
                      article_id: item.id,
                      article_title: item.title
                    });
                  }}
                >
                  {locale === 'ar' ? 'عرض التعليقات' : 'Open comments'}
                </button>
              </article>
            </div>
          ))}
        </div>
      )}


      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded-full border border-sura-line px-4 py-2 text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-sura-navy/80">{page} / {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="rounded-full border border-sura-line px-4 py-2 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Engagement Bar */}
      {activeArticleId ? (
        <div className="rounded-3xl border border-sura-line bg-sura-canvas p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <LikeShareBar
              entityId={activeArticleId}
              entityType="article"
              title={articles.find((a) => a.id === activeArticleId)?.title}
            />

            <div className="flex flex-wrap items-center gap-3">
              <LikeButton itemId={activeArticleId} />
              <BookmarkButton entityId={activeArticleId} entityType="article" />
              <RatingStars entityId={activeArticleId} entityType="article" />
            </div>
          </div>
        </div>
      ) : null}

      {activeArticleId ? <ThreadedComments entityId={activeArticleId} entityType="article" /> : null}


    </div>
  );
}
