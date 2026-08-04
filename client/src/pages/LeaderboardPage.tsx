import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';
import { useAuth } from '../context/AuthContext';
import { fetchLeaderboard, fetchMyRank } from '../services/leaderboardService';
import type { LeaderboardPeriod, LeaderboardResponse, LeaderboardEntry, MyRankResponse } from '../services/leaderboardService';
import { TopReadersSection } from '../components/leaderboard/TopReadersSection';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { ProfilePreviewCard } from '../components/leaderboard/ProfilePreviewCard';
import { AchievementsSection } from '../components/leaderboard/AchievementsSection';
import { ReaderLevelBadge } from '../components/leaderboard/ReaderLevelBadge';

const PERIODS: Array<{ key: LeaderboardPeriod; label: string; labelAr: string }> = [
  { key: 'daily', label: 'Daily', labelAr: 'يومي' },
  { key: 'weekly', label: 'Weekly', labelAr: 'أسبوعي' },
  { key: 'monthly', label: 'Monthly', labelAr: 'شهري' },
  { key: 'alltime', label: 'All Time', labelAr: 'كل الوقت' },
];

export function LeaderboardPage() {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const { user } = useAuth();

  useSeoTags({
    title: isArabic ? 'المتصدرون | سُرى' : 'Community Leaderboard | Sura Codex',
    description: isArabic
      ? 'تصنيف أفضل القراء في مجتمع سُرى.'
      : 'See the top readers in the Sura Codex community.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/leaderboard`,
    openGraph: { type: 'website' },
    twitter: { cardType: 'summary_large_image' },
    locale,
  });

  const [period, setPeriod] = useState<LeaderboardPeriod>('alltime');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);
  const [myRank, setMyRank] = useState<MyRankResponse | null>(null);
  const [limit, setLimit] = useState(50);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchLeaderboard(period, limit)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setError(isArabic ? 'تعذر تحميل لوحة المتصدرين.' : 'Failed to load leaderboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period, limit, isArabic]);

  useEffect(() => {
    if (!user) return;
    fetchMyRank(period)
      .then((res) => {
        setMyRank(res);
      })
      .catch(() => {
        // ignore — guest visitors won't have a rank
      });
  }, [period, user]);

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const { refreshLeaderboard } = await import('../services/leaderboardService');
      await refreshLeaderboard();
      const res = await fetchLeaderboard(period, limit);
      setData(res);
    } catch {
      setError(isArabic ? 'تعذر تحديث لوحة المتصدرين.' : 'Failed to refresh leaderboard.');
    } finally {
      setRefreshing(false);
    }
  };

  const topEntries = useMemo(() => data?.entries.slice(0, 3) ?? [], [data]);
  const tableEntries = useMemo(() => data?.entries ?? [], [data]);

  const highlightUserId = user?.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sura-ivory">
            {isArabic ? 'لوحة المتصدرين' : 'Community Leaderboard'}
          </h1>
          <p className="mt-2 text-sura-ivory/60">
            {isArabic
              ? 'أفضل القراء في مجتمع سُرى، مرتبة حسب النقاط والنشاط.'
              : 'Top readers in the Sura Codex community, ranked by points and activity.'}
          </p>
        </div>

        {user && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full border border-[#7F77DD]/40 bg-[#7F77DD]/10 px-4 py-2 text-sm font-medium text-[#7F77DD] transition hover:bg-[#7F77DD]/20 disabled:opacity-50"
          >
            {refreshing
              ? isArabic ? 'جاري التحديث...' : 'Refreshing...'
              : isArabic ? 'تحديث' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Period Tabs */}
      <div
        className="mt-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label={isArabic ? 'فترات المتصدرين' : 'Leaderboard periods'}
      >
        {PERIODS.map((p) => (
          <button
            key={p.key}
            role="tab"
            aria-selected={period === p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              period === p.key
                ? 'bg-[#7F77DD] text-white shadow-lg shadow-[#7F77DD]/30'
                : 'border border-sura-ivory/15 bg-sura-ivory/5 text-sura-ivory/60 hover:text-sura-ivory'
            }`}
          >
            {isArabic ? p.labelAr : p.label}
          </button>
        ))}
      </div>

      {/* My rank card (authenticated only) */}
      {user && myRank?.rank && (
        <div className="mt-6 rounded-2xl border border-[#7F77DD]/30 bg-sura-ivory/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏅</span>
              <div>
                <div className="font-semibold text-sura-ivory">
                  {isArabic ? 'ترتيبك' : 'Your rank'} #{myRank.rank}
                </div>
                <div className="text-sm text-sura-ivory/60">
                  {isArabic ? 'النقاط' : 'Score'}: {myRank.score.toLocaleString()}
                </div>
              </div>
            </div>
            {myRank.user?.level && <ReaderLevelBadge level={myRank.user.level} />}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#7F77DD]/30 border-t-[#7F77DD]" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-300">
          {error}
        </div>
      ) : (
        <>
          {/* Top Readers Podium */}
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-sura-ivory">
              {isArabic ? 'أفضل القراء' : 'Top Readers'}
            </h2>
            <TopReadersSection entries={topEntries} onSelect={setSelected} />
          </div>

          {/* Full Table */}
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-sura-ivory">
                {isArabic ? 'التصنيف الكامل' : 'Full Ranking'}
              </h2>
              <span className="text-sm text-sura-ivory/50">
                {isArabic ? `${data?.total ?? 0} قارئ` : `${data?.total ?? 0} readers`}
              </span>
            </div>
            <LeaderboardTable
              entries={tableEntries}
              onSelect={setSelected}
              highlightUserId={highlightUserId}
            />
          </div>

          {/* Load more */}
          {data && data.total > limit && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setLimit((l) => l + 50)}
                className="rounded-full border border-sura-ivory/20 px-6 py-2 text-sm text-sura-ivory/70 transition hover:border-[#7F77DD]/50 hover:text-sura-ivory"
              >
                {isArabic ? 'عرض المزيد' : 'Load more'}
              </button>
            </div>
          )}

          {/* Achievements — derived from current period's #1 reader metrics */}
          {data && data.entries[0] && (
            <div className="mt-10">
              <AchievementsSection metrics={data.entries[0].metrics} />
            </div>
          )}
        </>
      )}

      {/* Profile preview modal */}
      {selected && (
        <ProfilePreviewCard entry={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default LeaderboardPage;
