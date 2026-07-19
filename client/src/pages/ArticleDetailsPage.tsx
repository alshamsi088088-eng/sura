import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSupabaseArticleBySlug } from '../components/SupabaseArticleDetails';
import { supabase } from '../lib/supabaseClient';
import { ReactQuillEditor } from '../components/ReactQuillEditor';
import { generateSlug } from '../lib/generateSlug';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { AdminMenu } from '../components/AdminMenu';
import { Avatar } from '../components/AvatarUpload';
import { ReactionBar } from '../components/ReactionBar';
import { QuoteHighlighter } from '../components/QuoteHighlighter';
import { ReadingProgress } from '../components/ReadingProgress';
import { ReadingSettings, useReadingSettings } from '../components/ReadingSettings';
import { useSeoTags } from '../hooks/useSeoTags';
// تم استيراد مكون التعليقات الجديد
import { CommentSection } from '../components/CommentSection'; 

interface Article {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  content: string;
  authorName: string;
  publishedAt?: string | null;
  authorId?: string | null;
}

/**
 * Defensive guard: `excerpt` is meant to be a plain-text summary, but bad
 * data has slipped in before (HTML from the rich-text editor pasted into
 * the excerpt field by mistake), which rendered as raw "<h1><strong>..."
 * text on the page. This strips any HTML tags before display/SEO use so a
 * bad excerpt degrades gracefully instead of showing broken markup.
 * This does NOT replace fixing the underlying data — see the DB cleanup.
 */
function stripHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ArticleDetailsPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();

  const decodedSlug = useMemo(() => {
    if (!slug) return '';
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  }, [slug]);


  const [article, setArticle] = useState<Article | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReadingSettings, setShowReadingSettings] = useState(false);

  const { settings: readingSettings, getContentClass } = useReadingSettings();

  const canonicalUrl = useMemo(() => {
    const base = import.meta.env.VITE_PUBLIC_BASE_URL || '';
    return `${base}/articles/${encodeURIComponent(decodedSlug || '')}`;
  }, [decodedSlug]);

  const cleanExcerpt = useMemo(() => stripHtml(article?.excerpt), [article?.excerpt]);

  useSeoTags({
    title: article?.title || (locale === 'ar' ? 'مقالة — سُرى' : 'Article — Sura Codex'),
    description: cleanExcerpt || (locale === 'ar' ? 'محتوى مقال — سُرى' : 'Article content — Sura Codex'),
    canonicalUrl,
    openGraph: {
      type: 'article',
      image: {
        url: article?.coverImage || '/logo.svg',
        alt: article?.title || 'Sura Codex',
      },
    },
    twitter: {
      cardType: 'summary_large_image',
      image: {
        url: article?.coverImage || '/logo.svg',
        alt: article?.title || 'Sura Codex',
      },
    },
  });

  const navigate = useNavigate();

  const { article: sbArticle, loading: sbLoading, error: sbError } = useSupabaseArticleBySlug(decodedSlug);

  useEffect(() => {
    if (!sbLoading) {
      if (!decodedSlug) {
        setArticle(null);
        setError(locale === 'ar' ? 'المقال غير موجود.' : 'Article not found.');
        setLoading(false);
        return;
      }

      if (!sbArticle) {
        setArticle(null);
        setError(sbError || (locale === 'ar' ? 'المقال غير موجود.' : 'Article not found.'));
        setLoading(false);
        return;
      }

      setArticle(sbArticle);
      setError(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [sbLoading, sbArticle, sbError, decodedSlug, locale]);

  useEffect(() => {
    if (!user) return;
  }, [user, navigate]);

  useEffect(() => {
    if (!article) return;
    setEditTitle(article.title);
    setEditExcerpt(article.excerpt);
    setEditContent(article.content);
  }, [article]);

  const isAdmin = user?.role === 'admin';
  const canManageArticle = Boolean(user && article && isAdmin);

  const handleDelete = async () => {
    if (!user || !article || !canManageArticle) return;
    if (!window.confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا المقال؟' : 'Are you sure you want to delete this article?')) {
      return;
    }

    if (!supabase) return;

    const { error: deleteError } = await supabase
      .from('Article')
      .delete()
      .eq('id', article.id);

    if (deleteError) {
      setEditError(deleteError.message);
      return;
    }

    setDeleteOpen(false);
    navigate('/articles');
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !article) return;
    if (!canManageArticle) return;


    if (!supabase) return;

    setEditError('');

    const updatedSlug = generateSlug(editTitle);

    // Defensive: strip any HTML that may have been pasted into the excerpt
    // field (it's meant to be plain text, unlike `content`).
    const payload = {
      title: editTitle.trim(),
      slug: updatedSlug,
      excerpt: stripHtml(editExcerpt).trim(),
      content: editContent,
      publishedAt: article.publishedAt ? article.publishedAt : new Date().toISOString(),
    };


    const { error: updateError } = await supabase
      .from('Article')
      .update(payload)
      .eq('id', article.id);

    if (updateError) {
      setEditError(updateError.message);
      return;
    }

    setEditOpen(false);
    setEditError('');

    navigate(`/articles/${encodeURIComponent(updatedSlug)}`);
  };


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
      <ReadingProgress
        contentType="article"
        contentId={article.id}
        title={article.title}
        content={article.content}
      />

      <article className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold">{article.title}</h1>
              {cleanExcerpt ? (
                <p className="text-sm leading-7 text-sura-navy/80">{cleanExcerpt}</p>
              ) : null}
            </div>
            {isAdmin ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="rounded-full border border-sura-line px-3 py-1.5 text-sm text-sura-navy/80"
                >
                  {locale === 'ar' ? 'تعديل' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-sm text-red-600"
                >
                  {locale === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-sura-navy/70">
            <span>{article.authorName || (locale === 'ar' ? 'مؤلف غير معروف' : 'Unknown author')}</span>
            {article.publishedAt ? <span>•</span> : null}
            {article.publishedAt ? <span>{new Date(article.publishedAt).toLocaleDateString()}</span> : null}
          </div>
        </header>

        <section className="pt-6">
          <QuoteHighlighter
            contentId={article.id}
            contentType="article"
            contentHtml={article.content}
            authorName={article.authorName}
          />
          {/*
            تعديل: عرض المحتوى كـ HTML منسّق بدل نص خام.
            المحتوى قادم من محرر ReactQuill الموثوق (المسؤول/الكاتب فقط يقدر يعدل المقالة)،
            لذلك استخدام dangerouslySetInnerHTML هنا آمن.
          */}
          <div
            className="prose max-w-none text-sura-ivory"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </section>

        <ReactionBar contentType="article" contentId={article.id} />
      </article>

      {/* الجزء الجديد: استدعاء مكون التعليقات */}
      <div className="mt-6">
        <CommentSection articleId={article.id} />
      </div>

      {/* نافذة التعديل المنبثقة (Edit Modal) المعاد بناؤها بالكامل */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-sura-line bg-sura-canvas p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-white text-right">
              {locale === 'ar' ? 'تعديل المقال' : 'Edit Article'}
            </h2>
            
            {editError && <p className="text-red-500 text-sm text-right">{editError}</p>}
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-right">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {locale === 'ar' ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-sura-line bg-transparent p-3 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {locale === 'ar' ? 'المقتطف (الوصف المختصر)' : 'Excerpt'}
                </label>
                <textarea
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  className="w-full rounded-xl border border-sura-line bg-transparent p-3 text-white focus:outline-none focus:border-purple-500 h-20"
                  required
                />
              </div>
              
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-300 mb-1 text-right">
                  {locale === 'ar' ? 'المحتوى' : 'Content'}
                </label>
                <ReactQuillEditor value={editContent} onChange={setEditContent} />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-full border border-sura-line px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
                >
                  {locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}