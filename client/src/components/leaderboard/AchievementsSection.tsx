import { useLocale } from '../../context/LocaleContext';
import type { LeaderboardMetrics } from '../../services/leaderboardService';

interface AchievementsSectionProps {
  metrics: LeaderboardMetrics;
}

// Achievement definitions derived from the leaderboard metrics.
const ACHIEVEMENTS = (
  isArabic: boolean
): Array<{ key: string; icon: string; label: string; desc: string; threshold: number; metric: keyof LeaderboardMetrics }> => [
  { key: 'reader', icon: '📖', label: isArabic ? 'قارئ نشط' : 'Active Reader', desc: isArabic ? 'قراءة 50+ عنصر' : 'Read 50+ items', threshold: 50, metric: 'readingPoints' },
  { key: 'series', icon: '📚', label: isArabic ? 'مكتمل السلسلة' : 'Series Master', desc: isArabic ? 'إكمال 5+ سلسلات' : 'Complete 5+ series', threshold: 5, metric: 'completedSeries' },
  { key: 'reviewer', icon: '✍️', label: isArabic ? 'ناقد' : 'Reviewer', desc: isArabic ? 'كتابة 10+ مراجعات' : 'Write 10+ reviews', threshold: 10, metric: 'reviews' },
  { key: 'helpful', icon: '👍', label: isArabic ? 'مساعد' : 'Helpful', desc: isArabic ? 'تلقّي 20+ صوت مفيد' : 'Receive 20+ helpful votes', threshold: 20, metric: 'helpfulVotes' },
  { key: 'community', icon: '🤝', label: isArabic ? 'نشط في المجتمع' : 'Community Leader', desc: isArabic ? 'مشاركة 100+ تفاعل' : '100+ community actions', threshold: 100, metric: 'community' },
];

export function AchievementsSection({ metrics }: AchievementsSectionProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const defs = ACHIEVEMENTS(isArabic);

  return (
    <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-sura-ivory">
        {isArabic ? 'الإنجازات' : 'Achievements'}
      </h2>
      <p className="mt-1 text-sm text-sura-ivory/60">
        {isArabic
          ? 'إنجازات مرتبطة بدورك في لوحة المتصدرين.'
          : 'Achievements tied to your leaderboard performance.'}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {defs.map((def) => {
          const value = metrics[def.metric];
          const earned = value >= def.threshold;
          const progress = Math.min(100, Math.round((value / def.threshold) * 100));

          return (
            <div
              key={def.key}
              className={`rounded-2xl border p-4 text-center transition ${
                earned
                  ? 'border-[#7F77DD]/50 bg-[#7F77DD]/10'
                  : 'border-sura-ivory/10 bg-sura-ivory/5 opacity-70'
              }`}
              title={`${def.label}: ${value}/${def.threshold}`}
            >
              <div className="text-4xl">{def.icon}</div>
              <div className="mt-2 text-sm font-semibold text-sura-ivory">{def.label}</div>
              <div className="mt-1 text-xs text-sura-ivory/50">{def.desc}</div>

              {!earned ? (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-sura-ivory/10">
                    <div
                      className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-sura-ivory/40">{progress}%</div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-[#7F77DD]">
                  {isArabic ? '✓ تحقق' : '✓ Earned'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
