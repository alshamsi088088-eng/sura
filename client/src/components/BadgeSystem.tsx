import { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { fetchBadges, evaluateBadges } from '../services/readerService';
import type { BadgeInfo } from '../services/readerService';

interface BadgeSystemProps {
  userId: string;
}

export function BadgeSystem({ userId }: BadgeSystemProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const loadBadges = async (evaluate = false) => {
    try {
      const data = await fetchBadges(evaluate);
      setBadges(data);
    } catch (err) {
      console.error('Failed to load badges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadBadges(true); // Auto-evaluate on mount
  }, [userId]);

  const handleReEvaluate = async () => {
    setEvaluating(true);
    try {
      const result = await evaluateBadges();
      if (result.badges) setBadges(result.badges);
    } catch (err) {
      console.error('Failed to re-evaluate badges:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-sura-ivory/10 bg-sura-dark/50 p-4 text-center"
          >
            <div className="mx-auto h-12 w-12 rounded-full bg-sura-ivory/10" />
            <div className="mt-3 h-4 w-20 mx-auto rounded bg-sura-ivory/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sura-ivory">
            {isArabic ? 'الإنجازات' : 'Achievements'}
          </h2>
          <p className="mt-1 text-sm text-sura-ivory/60">
            {isArabic
              ? `${earnedCount} من ${totalCount} تم تحقيقها`
              : `${earnedCount} of ${totalCount} earned`}
          </p>
        </div>
        <button
          onClick={handleReEvaluate}
          disabled={evaluating}
          className="rounded-lg border border-[#7F77DD]/30 bg-[#7F77DD]/10 px-4 py-2 text-sm text-[#7F77DD] transition hover:bg-[#7F77DD]/20 disabled:opacity-50"
          type="button"
        >
          {evaluating
            ? isArabic ? 'جاري التقييم...' : 'Evaluating...'
            : isArabic ? 'تحديث الإنجازات' : 'Refresh Achievements'}
        </button>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {badges.map((badge) => (
          <div
            key={badge.badgeKey}
            className={`relative rounded-2xl border p-4 text-center transition ${
              badge.earned
                ? 'border-[#7F77DD]/50 bg-[#7F77DD]/10'
                : 'border-[#7F77DD]/20 bg-sura-dark/50 opacity-60'
            }`}
            title={badge.description}
          >
            {/* Badge Icon */}
            <div className="text-4xl">{badge.icon}</div>

            {/* Badge Title */}
            <div
              className={`mt-2 text-sm font-medium ${
                badge.earned ? 'text-sura-ivory' : 'text-sura-ivory/50'
              }`}
            >
              {isArabic ? getArabicBadgeTitle(badge.badgeKey) : badge.title}
            </div>

            {/* Badge Description */}
            <div className="mt-1 text-xs text-sura-ivory/40">
              {isArabic ? getArabicBadgeDesc(badge.badgeKey) : badge.description}
            </div>

            {/* Progress Bar */}
            {!badge.earned && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-sura-ivory/10">
                  <div
                    className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-sura-ivory/40">{badge.progress}%</div>
              </div>
            )}

            {/* Earned Badge */}
            {badge.earned && (
              <>
                <div className="mt-2 text-xs text-[#7F77DD]">
                  {isArabic ? '✓ تم التحقيق' : '✓ Earned'}
                </div>
                {badge.earnedAt && (
                  <div className="mt-1 text-xs text-sura-ivory/30">
                    {new Date(badge.earnedAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getArabicBadgeTitle(key: string): string {
  const titles: Record<string, string> = {
    first_article: 'أول مقال',
    streak_7: '7 أيام متتالية',
    streak_30: '30 يوماً متتالياً',
    book_explorer: 'مستكشف الكتب',
    top_reader: 'قارئ مميز',
    reviewer: 'مراجع',
    community_helper: 'مساعد المجتمع',
  };
  return titles[key] || key;
}

function getArabicBadgeDesc(key: string): string {
  const descs: Record<string, string> = {
    first_article: 'قراءة أول مقال كامل',
    streak_7: 'القراءة لـ 7 أيام متتالية',
    streak_30: 'القراءة لـ 30 يوماً متتالياً',
    book_explorer: 'استكشاف مقالات من 3+ تصنيفات مختلفة',
    top_reader: 'قراءة 50+ مقال أو فصل',
    reviewer: 'ترك 5+ تعليقات على المقالات أو الفصول',
    community_helper: 'المشاركة في 3+ نقاشات مجتمعية',
  };
  return descs[key] || key;
}
