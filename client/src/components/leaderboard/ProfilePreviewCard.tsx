import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { Avatar } from '../AvatarUpload';
import { ReaderLevelBadge } from './ReaderLevelBadge';
import { fetchProfilePreview } from '../../services/leaderboardService';
import type { LeaderboardEntry, ProfilePreview } from '../../services/leaderboardService';

interface ProfilePreviewCardProps {
  entry: LeaderboardEntry;
  onClose: () => void;
}

export function ProfilePreviewCard({ entry, onClose }: ProfilePreviewCardProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [preview, setPreview] = useState<ProfilePreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProfilePreview(entry.userId)
      .then((data) => {
        if (active) setPreview(data);
      })
      .catch(() => {
        if (active) setPreview(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [entry.userId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'معاينة الملف الشخصي' : 'Profile preview'}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-sura-ivory/15 bg-sura-navy p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar url={entry.avatar || undefined} name={entry.name} size="lg" />
            <div>
              <div className="text-lg font-bold text-sura-ivory">{entry.name}</div>
              <ReaderLevelBadge level={entry.level} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-sura-ivory/60 transition hover:bg-sura-ivory/10 hover:text-sura-ivory"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {preview?.bio && (
          <p className="mt-4 text-sm text-sura-ivory/70">{preview.bio}</p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-sura-ivory/10 bg-sura-ivory/5 p-3">
            <div className="text-xl font-bold text-[#7F77DD]">
              {preview?.xp?.toLocaleString() ?? '—'}
            </div>
            <div className="text-xs text-sura-ivory/60">
              {isArabic ? 'نقاط الخبرة' : 'XP'}
            </div>
          </div>
          <div className="rounded-xl border border-sura-ivory/10 bg-sura-ivory/5 p-3">
            <div className="text-xl font-bold text-[#7F77DD]">
              {preview?.allTimeRank ? `#${preview.allTimeRank}` : '—'}
            </div>
            <div className="text-xs text-sura-ivory/60">
              {isArabic ? 'الترتيب العام' : 'All-time rank'}
            </div>
          </div>
          <div className="rounded-xl border border-sura-ivory/10 bg-sura-ivory/5 p-3">
            <div className="text-xl font-bold text-[#7F77DD]">
              {entry.score.toLocaleString()}
            </div>
            <div className="text-xs text-sura-ivory/60">
              {isArabic ? 'النقاط' : 'Score'}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-wider text-sura-ivory/50">
            {isArabic ? 'تفاصيل النقاط' : 'Score breakdown'}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <ScoreRow label={isArabic ? 'نقاط القراءة' : 'Reading'} value={entry.metrics.readingPoints} />
            <ScoreRow label={isArabic ? 'مقالات' : 'Articles'} value={entry.metrics.completedArticles} />
            <ScoreRow label={isArabic ? 'سلسلات' : 'Series'} value={entry.metrics.completedSeries} />
            <ScoreRow label={isArabic ? 'مراجعات' : 'Reviews'} value={entry.metrics.reviews} />
            <ScoreRow label={isArabic ? 'أصوات مفيدة' : 'Helpful'} value={entry.metrics.helpfulVotes} />
            <ScoreRow label={isArabic ? 'مشاركة' : 'Community'} value={entry.metrics.community} />
          </div>
        </div>

        <Link
          to={`/profile/${entry.userId}`}
          className="mt-5 block w-full rounded-xl bg-[#7F77DD] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#6f67cc]"
        >
          {isArabic ? 'عرض الملف الكامل' : 'View full profile'}
        </Link>
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-sura-ivory/5 px-3 py-2">
      <span className="text-sura-ivory/70">{label}</span>
      <span className="font-semibold text-sura-ivory">{value}</span>
    </div>
  );
}
