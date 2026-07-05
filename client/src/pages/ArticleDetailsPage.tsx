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


export function ArticleDetailsPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();

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

  // Load reading settings
  const { settings: readingSettings, getContentClass } = useReadingSettings();

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

  const navigate = useNavigate();

  const { article: sbArticle, loading: sbLoading, error: sbError } = useSupabaseArticleBySlug(slug);

  useEffect(() => {
    // Kill re-render loops: only mirror state when slug/data changes.
    if (!sbLoading) {
      if (!slug) {
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
  }, [sbLoading, sbArticle, sbError, slug, locale]);

  useEffect(() => {
    // If user becomes unauthenticated, keep reading experience; do not loop.
    // Engagement widgets handle auth internally.
    if (!user) return;
  }, [user, navigate]);

  useEffect(() => {
    if (!article) return;
    setEditTitle(article.title);
    setEditExcerpt(article.excerpt);
    setEditContent(article.content);
  }, [article]);

  const handleDelete = async () => {
    if (!user || !article) return;
    if (user.id !== article.authorId) return;

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
    if (user.id !== article.authorId) return;

    if (!supabase) return;

    setEditError('');

    const updatedSlug = generateSlug(editTitle);

    const payload = {
      title: editTitle.trim(),
      slug: updatedSlug,
      excerpt: editExcerpt.trim(),
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

    // Reload page data by navigating to same route using current slug
    navigate(`/articles/${encodeURIComponent(generateSlug(editTitle))}`);
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
      {/* Reading Progress Bar */}
      {article && (
        <ReadingProgress
          contentType="article"
          contentId={article.id}
          title={article.title}
          content={article.content}
        />
      )}

      <article className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <header className="space-y-4">
          <div className="flex items-start justify-between">
            <h1 className="text-4xl font-semibold">{article.title}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReadingSettings(true)}
                className="rounded-full border border-sura-line p-2"
                title={locale === 'ar' ? 'إعدادات القراءة' : 'Reading Settings'}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {user?.id && article.authorId && user.id === article.authorId ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Toggle edit modal
                      setEditOpen(true);
                    }}
                    className="rounded-full border border-sura-line px-3 py-1 text-xs text-sura-navy/80 hover:bg-sura-navy/10"
                  >
                    {locale === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200 hover:bg-red-500/20"
                  >
                    {locale === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </div>
              ) : (
                <AdminMenu entityType="article" entityId={article.id} />
              )}
            </div>
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
          <QuoteHighlighter
            contentId={article.id}
            contentType="article"
            contentHtml={article.content}
            authorName={article.authorName}
          />
          <div className="prose max-w-none text-sura-ivory" style={{ whiteSpace: 'pre-wrap' }}>
            {article.content}
          </div>
        </section>

        <ReactionBar contentType="article" contentId={article.id} />
      </article>

      <div className="mt-6 p-4 bg-sura-canvas rounded-2xl border border-sura-line">
        <Link
          to={`/community/article/${article.id}`}
          className="block text-center text-blue-400 hover:text-blue-300 py-2"
        >
          Join the Discussion
        </Link>
      </div>

      {/* Author Edit Modal */}
      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-3xl rounded-3xl border border-sura-line bg-sura-canvas p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{locale === 'ar' ? 'تعديل المقال' : 'Edit Article'}</h3>
                <p className="mt-1 text-sm text-sura-navy/70">{locale === 'ar' ? 'قم بتحديث العنوان والملخص والمحتوى.' : 'Update title, excerpt, and content.'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditOpen(false);
                  setEditError('');
                }}
                className="rounded-full border border-sura-line px-3 py-1 text-sm text-sura-navy/80 hover:bg-sura-navy/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-sura-navy/80">{locale === 'ar' ? 'العنوان' : 'Title'}</label>
                <input
                  className="mt-1 w-full rounded-lg border border-sura-line bg-sura-canvas px-4 py-2 text-sm text-sura-navy outline-none focus:border-sura-gold"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sura-navy/80">{locale === 'ar' ? 'الرابط (تلقائي)' : 'URL Slug (auto)'}</label>
                <input
                  className="mt-1 w-full rounded-lg border border-sura-line bg-sura-canvas px-4 py-2 text-sm text-sura-navy outline-none focus:border-sura-gold"
                  value={generateSlug(editTitle)}
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sura-navy/80">{locale === 'ar' ? 'الملخص' : 'Excerpt'}</label>
                <textarea
                  className="mt-1 min-h-24 w-full resize-y rounded-lg border border-sura-line bg-sura-canvas px-4 py-2 text-sm text-sura-navy outline-none focus:border-sura-gold"
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sura-navy/80">{locale === 'ar' ? 'المحتوى' : 'Content'}</label>
                <div className="mt-1">
                  <ReactQuillEditor value={editContent} onChange={setEditContent} />
                </div>
              </div>

              {editError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{editError}</div>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditError('');
                  }}
                  className="flex-1 rounded-full border border-sura-line px-4 py-2 text-sm text-sura-navy/80 hover:bg-sura-navy/10"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="flex-1 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white">
                  {locale === 'ar' ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-sura-line bg-sura-canvas p-6 shadow-xl">
            <h3 className="text-lg font-semibold">{locale === 'ar' ? 'حذف المقال؟' : 'Delete article?'}</h3>
            <p className="mt-2 text-sm text-sura-navy/70">
              {locale === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.'}
            </p>
            {editError ? <p className="mt-3 text-sm text-red-200">{editError}</p> : null}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setEditError('');
                }}
                className="flex-1 rounded-full border border-sura-line px-4 py-2 text-sm text-sura-navy/80 hover:bg-sura-navy/10"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {locale === 'ar' ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reading Settings Modal */}
      <ReadingSettings isOpen={showReadingSettings} onClose={() => setShowReadingSettings(false)} />
    </div>
  );
}


