import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { AdminMenu } from '../components/AdminMenu';
import { Avatar } from '../components/AvatarUpload';
import { ReactionBar } from '../components/ReactionBar';
import { useSeoTags } from '../hooks/useSeoTags';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  content: string;
  authorName: string;
  publishedAt?: string | null;
}

export function ArticleDetailsPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canonicalUrl = useMemo(() => {
    const base = import.meta.env.VITE_PUBLIC_BASE_URL || '';
    return `${base}/articles/${slug || ''}`;
  }, [slug]);

  useSeoTags({
    title: article?.title || (locale === 'ar' ? 'مقالة — سُرى' : 'Article — Sura Codex'),
    description: article?.excerpt || (locale === 'ar' ? 'محتوى مقال — سُرى' : 'Article content — Sura Codex'),
    canonicalUrl,
    openGraph: {
      type: 'article',
      image: {
        url: article?.coverImage || `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg`,
        alt: article?.title || 'Sura Codex',
      },
    },
    twitter: {
      cardType: 'summary_large_image',
      image: {
        url: article?.coverImage || `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg`,
        alt: article?.title || 'Sura Codex',
      },
    },
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!slug) {
        if (mounted) {
          setError(locale === 'ar' ? 'المقال غير موجود.' : 'Article not found.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // expects backend route that returns full article by slug
        const res = await axios.get(`/api/articles/slug/${encodeURIComponent(slug)}`);
        const data = res.data?.article;

        if (!mounted) return;

        const next: Article = {
          id: String(data?.id || ''),
          title: String(data?.title || ''),
          excerpt: String(data?.excerpt || ''),
          coverImage: data?.coverImage ? String(data.coverImage) : null,
          content: String(data?.content || ''),
          authorName: String(data?.authorName || ''),
          publishedAt: data?.publishedAt ? String(data.publishedAt) : null,
        };

        if (!next.id || !next.title) {
          setError(locale === 'ar' ? 'المقال غير موجود.' : 'Article not found.');
          setArticle(null);
        } else {
          setArticle(next);
        }
      } catch (e) {
        if (!mounted) return;
        setError(locale === 'ar' ? 'فشل تحميل المقال.' : 'Failed to load article.');
        setArticle(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [slug, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-sura-line bg-sura-canvas p-8 text-center">
        <h1 className="text-3xl font-semibold">{locale === 'ar' ? 'خطأ' : 'Error'}</h1>
        <p className="mt-4 text-sm leading-7 text-sura-navy/80">{error || ''}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <article className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <header className="space-y-4">
          <div className="flex items-start justify-between">
            <h1 className="text-4xl font-semibold">{article.title}</h1>
            <AdminMenu
              entityType="article"
              entityId={article.id}
            />
          </div>
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full max-h-[420px] object-cover rounded-2xl"
            />
          ) : null}
          <p className="text-sm leading-7 text-sura-navy/80">{article.excerpt}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={article.authorName} size="sm" />
            <div className="flex flex-wrap items-center gap-2 text-xs text-sura-navy/70">
              <span className="font-medium">{article.authorName}</span>
              {article.publishedAt ? <span>• {new Date(article.publishedAt).toLocaleDateString()}</span> : null}
            </div>
          </div>
        </header>

        <section className="pt-6">
          <div className="prose max-w-none text-sura-ivory" style={{ whiteSpace: 'pre-wrap' }}>
            {article.content}
          </div>
        </section>

        <ReactionBar contentType="article" contentId={article.id} />
      </article>
    </div>
  );
}

