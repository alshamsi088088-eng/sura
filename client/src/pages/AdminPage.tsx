import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLocale } from '../context/LocaleContext';

const API_URL = import.meta.env.VITE_API_URL || '';

interface ModerationComment {
  id: string;
  entityId: string;
  entityType: 'article' | 'book' | 'novel';
  author: string;
  message: string;
  status?: 'visible' | 'hidden';
  createdAt?: string;
}

interface OverviewData {
  totalUsers?: number;
  totalArticles?: number;
  totalNovels?: number;
  users?: number;
  revenue?: number;
  recentActivity?: unknown[];
}

export function AdminPage() {
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [comments, setComments] = useState<ModerationComment[]>([]);
  const activeTab = searchParams.get('tab') || 'overview';

  const tabs = [
    { id: 'overview', label: locale === 'ar' ? 'نظرة عامة' : 'Overview' },
    { id: 'comments', label: locale === 'ar' ? 'التعليقات' : 'Comments' },
    { id: 'books', label: locale === 'ar' ? 'الكتب' : 'Books' },
    { id: 'users', label: locale === 'ar' ? 'المستخدمون' : 'Users' },
  ];

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    setOverviewLoading(true);
    axios.get(`${API_URL}/api/admin/overview`)
      .then((res) => setOverview(res.data as OverviewData))
      .catch(() => setOverviewError(locale === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data'))
      .finally(() => setOverviewLoading(false));
  }, [locale]);

  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoadingComments(true);
    setCommentsError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/comments?limit=150`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      setCommentsError(e instanceof Error ? e.message : 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const visibleCount = useMemo(
    () => comments.filter((comment) => (comment.status || 'visible') === 'visible').length,
    [comments]
  );

  const hiddenCount = useMemo(
    () => comments.filter((comment) => (comment.status || 'visible') === 'hidden').length,
    [comments]
  );

  const moderate = async (commentId: string, status: 'visible' | 'hidden') => {
    try {
      await fetch(`${API_URL}/api/admin/comments/${commentId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchComments();
    } catch (err) {
      console.error('Failed to moderate comment:', err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}</h1>
        <p className="mt-3 text-sm leading-7 text-sura-navy/80">
          {locale === 'ar'
            ? 'إحصائيات سريعة حو�� المستخدمين والمحتوى والإيرادات.'
            : 'Quick insight into users, content, revenue, and reader activity.'}
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-sura-line bg-sura-canvas p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-sura-teal text-white'
                : 'text-sura-navy/70 hover:bg-sura-teal/10 hover:text-sura-teal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && overview && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-sura-teal">Users</div>
            <div className="mt-4 text-4xl font-semibold">{overview.users}</div>
            <div className="mt-2 text-sm text-sura-navy/70">Active readers, writers, and admins</div>
          </div>
          <div className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-sura-teal">Revenue</div>
            <div className="mt-4 text-4xl font-semibold">${overview.revenue}</div>
            <div className="mt-2 text-sm text-sura-navy/70">Stripe orders and digital sales</div>
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
      <section className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'Comment Moderation' : 'Comment Moderation'}</h2>
            <p className="text-sm text-sura-navy/70">
              {locale === 'ar'
                ? 'عرض التعليقات المخفية فقط (hidden) بالإضافة إلى التعليقات بدون حقل status.'
                : 'Shows hidden comments (status="hidden") plus comments without a status field.'}
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full border border-sura-line px-3 py-1 text-sura-navy/80">
              {locale === 'ar' ? 'مرئي' : 'Visible'}: {visibleCount}
            </span>
            <span className="rounded-full border border-sura-line px-3 py-1 text-sura-navy/80">
              {locale === 'ar' ? 'مخفي' : 'Hidden'}: {hiddenCount}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {loadingComments ? (
            <div className="text-sm text-sura-navy/70">{locale === 'ar' ? 'جارٍ تحميل التعليقات...' : 'Loading comments...'}</div>
          ) : commentsError ? (
            <div className="text-sm text-red-400">{commentsError}</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-sura-navy/70">{locale === 'ar' ? 'لا توجد تعليقات.' : 'No comments found.'}</div>
          ) : (
            comments.map((comment) => {
              const effectiveStatus: 'visible' | 'hidden' = (comment.status || 'visible') === 'hidden' ? 'hidden' : 'visible';
              return (
                <article key={comment.id} className="rounded-2xl border border-sura-line bg-sura-canvas p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-sura-navy/85">
                      <span className="font-semibold">{comment.author || 'Reader'}</span>
                      <span className="mx-2">•</span>
                      <span>{comment.entityType}</span>
                      <span className="mx-2">•</span>
                      <span className="text-sura-navy/70">{comment.entityId}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moderate(comment.id, 'visible')}
                        className="rounded-full border border-sura-line px-3 py-1 text-xs disabled:opacity-60"
                        disabled={effectiveStatus === 'visible'}
                      >
                        {locale === 'ar' ? 'إظهار' : 'Show'}
                      </button>
                      <button
                        onClick={() => moderate(comment.id, 'hidden')}
                        className="rounded-full border border-sura-line px-3 py-1 text-xs disabled:opacity-60"
                        disabled={effectiveStatus === 'hidden'}
                      >
                        {locale === 'ar' ? 'إخفاء' : 'Hide'}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-sura-navy/85">{comment.message}</p>
                  <div className="mt-2 text-xs text-sura-navy/60">
                    {effectiveStatus.toUpperCase()} •{' '}
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
      )}

    </div>
  );
}