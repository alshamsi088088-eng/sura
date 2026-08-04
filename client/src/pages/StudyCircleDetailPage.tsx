import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';
import { useAuth } from '../context/AuthContext';
import {
  fetchCircle,
  joinCircle,
  leaveCircle,
  type CircleDetail,
} from '../services/studyCircleService';
import { CircleMembersList } from '../components/circles/CircleMembersList';
import { CircleCalendar } from '../components/circles/CircleCalendar';
import { CircleGoalsPanel } from '../components/circles/CircleGoalsPanel';
import { CircleNotesPanel } from '../components/circles/CircleNotesPanel';
import { CircleAssignmentsPanel } from '../components/circles/CircleAssignmentsPanel';
import { CircleSessionsPanel } from '../components/circles/CircleSessionsPanel';
import { ThreadedComments } from '../components/ThreadedComments';
import { ErrorState } from '../components/feed/ErrorState';

/**
 * Study circle dashboard — members, schedule/calendar, weekly goals,
 * shared notes, assignments, sessions and discussion.
 */
export function StudyCircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';

  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  useSeoTags({
    title: circle?.title ? `${circle.title} | Sura Codex` : 'Study Circle | Sura Codex',
    description: circle?.body?.slice(0, 160) || 'Join this study circle on Sura Codex.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/study-circles/${id}`,
    openGraph: { type: 'article' },
    twitter: { cardType: 'summary_large_image' },
    locale,
    jsonLd: circle
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            name: circle.title,
            description: circle.body?.slice(0, 160) || undefined,
            url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/study-circles/${id}`,
            inLanguage: locale,
          },
        ]
      : [],
  });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchCircle(id);
      setCircle(data);
    } catch {
      setError(isArabic ? 'الحلقة غير موجودة' : 'Circle not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const currentMember = circle?.members.find((m) => m.userId === user?.id);
  const isMember = !!currentMember && currentMember.status === 'active';
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'moderator';

  const handleJoin = async () => {
    if (!user || !circle) return;
    setActionBusy(true);
    try {
      await joinCircle(circle.id);
      await load();
    } catch {
      // ignore
    } finally {
      setActionBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!circle) return;
    setActionBusy(true);
    try {
      await leaveCircle(circle.id);
      await load();
    } catch {
      // ignore
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sura-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <ErrorState
          message={error || (isArabic ? 'الحلقة غير موجودة' : 'Circle not found')}
          onRetry={() => navigate('/study-circles')}
          retryLabel={isArabic ? 'كل الحلقات' : 'All circles'}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="mb-2 flex items-center justify-between">
        <Link to="/study-circles" className="text-sm text-sura-teal hover:underline">
          ← {isArabic ? 'كل الحلقات' : 'All circles'}
        </Link>
        <span className="text-xs text-sura-ivory/50">
          🎯 {isArabic ? 'حلقة دراسة' : 'Study circle'}
        </span>
      </div>

      {/* Header */}
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sura-ivory">{circle.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-sura-ivory/60">{circle.body}</p>
            <p className="mt-3 text-xs text-sura-ivory/40">
              {isArabic ? 'بواسطة' : 'By'} {circle.author.name} · 👥 {circle.memberCount}{' '}
              {isArabic ? 'عضواً' : 'members'}
            </p>
          </div>
          {!isMember && user ? (
            <button
              type="button"
              onClick={handleJoin}
              disabled={actionBusy}
              className="rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-charcoal hover:opacity-90 disabled:opacity-50"
            >
              {actionBusy ? '…' : isArabic ? 'انضم للحلقة' : 'Join circle'}
            </button>
          ) : (
            isMember && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sura-teal/10 px-3 py-1 text-xs font-semibold text-sura-teal">
                  {isArabic ? 'عضو' : 'Member'}
                </span>
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={actionBusy}
                  className="rounded-full border border-sura-ivory/20 px-4 py-1.5 text-xs text-sura-ivory/60 hover:bg-white/5 disabled:opacity-50"
                >
                  {isArabic ? 'مغادرة' : 'Leave'}
                </button>
              </div>
            )
          )}
        </div>
      </header>

      {/* Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <CircleSessionsPanel circleId={circle.id} />
          <CircleGoalsPanel
            circleId={circle.id}
            goals={circle.goals}
            isMember={isMember}
            onGoalsChange={(goals) => setCircle((c) => (c ? { ...c, goals } : c))}
          />
          <CircleNotesPanel
            circleId={circle.id}
            notes={circle.notes}
            isMember={isMember}
            onNotesChange={(notes) => setCircle((c) => (c ? { ...c, notes } : c))}
          />
          <CircleAssignmentsPanel
            circleId={circle.id}
            assignments={circle.assignments}
            canManage={canManage}
            isMember={isMember}
            onAssignmentsChange={(assignments) => setCircle((c) => (c ? { ...c, assignments } : c))}
          />

          {/* Discussion */}
          <div className="rounded-2xl border border-sura-line bg-sura-canvas p-4">
            <h2 className="mb-3 font-inter text-sm font-semibold text-sura-ivory">
              {isArabic ? 'النقاش' : 'Discussion'}
            </h2>
            <ThreadedComments entityId={circle.id} entityType="community" />
          </div>
        </div>

        <div className="space-y-4">
          <CircleMembersList
            circleId={circle.id}
            members={circle.members}
            onMembersChange={(members) => setCircle((c) => (c ? { ...c, members } : c))}
          />
          <CircleCalendar circleId={circle.id} isModerator={canManage} />
        </div>
      </div>
    </div>
  );
}

export default StudyCircleDetailPage;
