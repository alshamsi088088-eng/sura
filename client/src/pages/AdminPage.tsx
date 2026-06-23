import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocale } from '../context/LocaleContext';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { collection, onSnapshot, orderBy, query, updateDoc, doc, where, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface ModerationComment {
  id: string;
  entityId: string;
  entityType: 'article' | 'book' | 'novel';
  author: string;
  message: string;
  status?: 'visible' | 'hidden';
  createdAt?: { seconds?: number };
}

export function AdminPage() {
  const { locale } = useLocale();
  const [overview, setOverview] = useState<any>(null);
  const [comments, setComments] = useState<ModerationComment[]>([]);

  useEffect(() => {
    axios.get('/api/admin/overview').then((res) => setOverview(res.data));
  }, []);

  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setLoadingComments(true);
    setCommentsError(null);

    const hiddenQuery = query(
      collection(db, 'comments'),
      where('status', '==', 'hidden'),
      orderBy('createdAt', 'desc')
    );

    // Firestore does not provide a direct, universal way to query for missing fields.
    // We approximate "missing status" by fetching the newest docs and filtering client-side.
    const recentQuery = query(collection(db, 'comments'), orderBy('createdAt', 'desc'), limit(150));

    let unsubHidden: (() => void) | undefined;
    let unsubRecent: (() => void) | undefined;
    try {
      unsubHidden = onSnapshot(hiddenQuery, (snapshot) => {
        if (!isMounted) return;
        const hidden = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ModerationComment, 'id'>)
        }));
        setComments((prev) => {
          const map = new Map<string, ModerationComment>(prev.map((c) => [c.id, c]));
          for (const c of hidden) map.set(c.id, c);
          return Array.from(map.values()).slice(0, 25);
        });
      });


      unsubRecent = onSnapshot(recentQuery, (snapshot) => {
        if (!isMounted) return;
        const maybeNoStatus = snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ModerationComment, 'id'>) }))
          .filter((c) => !c.status);

        setComments((prev) => {
          const map = new Map<string, ModerationComment>(prev.map((c) => [c.id, c]));
          for (const c of maybeNoStatus) map.set(c.id, c);
          return Array.from(map.values()).slice(0, 25);
        });
        setLoadingComments(false);
      });

    } catch (e) {
      setCommentsError(e instanceof Error ? e.message : 'Failed to load comments');
      setLoadingComments(false);
    }

    return () => {
      isMounted = false;
      if (unsubHidden) unsubHidden();
      if (unsubRecent) unsubRecent();
    };

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
    await updateDoc(doc(db, 'comments', commentId), {
      status,
      moderatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}</h1>
        <p className="mt-3 text-sm leading-7 text-sura-navy/80">
          {locale === 'ar'
            ? 'إحصائيات سريعة حول المستخدمين والمحتوى والإيرادات.'
            : 'Quick insight into users, content, revenue, and reader activity.'}
        </p>
      </header>
      {overview && (
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
      <section className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
        <div className="text-sm uppercase tracking-[0.3em] text-sura-teal">Traffic</div>
        <div className="mt-6 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overview?.traffic || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="day" stroke="#ddd" />
              <YAxis stroke="#ddd" />
              <Tooltip contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#333' }} />
              <Line type="monotone" dataKey="visitors" stroke="#c9a84c" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

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
                    {new Date((comment.createdAt?.seconds || 0) * 1000).toLocaleString()}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

    </div>
  );
}
