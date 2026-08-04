import { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { fetchDashboardOverview } from '../services/readerService';
import type { DashboardOverview } from '../services/readerService';
import { ReadingStreakDisplay } from './ReadingStreakDisplay';

interface ReaderDashboardOverviewProps {
  userId: string;
}

export function ReaderDashboardOverview({ userId }: ReaderDashboardOverviewProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const data = await fetchDashboardOverview();
        setOverview(data);
      } catch (err) {
        console.error('Failed to load dashboard overview:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-sura-ivory/10 bg-sura-dark/50 p-5">
            <div className="h-4 w-20 rounded bg-sura-ivory/10" />
            <div className="mt-3 h-8 w-16 rounded bg-sura-ivory/10" />
          </div>
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-2xl border border-sura-ivory/10 bg-sura-dark/50 p-8 text-center text-sura-ivory/50">
        {isArabic ? 'تعذر تحميل البيانات' : 'Failed to load dashboard data'}
      </div>
    );
  }

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins} ${isArabic ? 'دقيقة' : 'min'}`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining}m`;
  };

  const statCards = [
    {
      label: isArabic ? 'إجمالي المقالات المقروءة' : 'Total Articles Read',
      value: overview.totalArticlesRead,
      icon: '📚',
      color: 'text-[#7F77DD]',
    },
    {
      label: isArabic ? 'وقت القراءة' : 'Reading Time',
      value: formatMinutes(overview.readingTimeMinutes),
      icon: '⏱️',
      color: 'text-sura-teal',
    },
    {
      label: isArabic ? 'المقالات المحفوظة' : 'Saved Articles',
      value: overview.savedArticles,
      icon: '🔖',
      color: 'text-sura-gold',
    },
    {
      label: isArabic ? 'الفئة المفضلة' : 'Favorite Category',
      value: overview.favoriteCategory || (isArabic ? 'لا توجد' : 'None'),
      icon: '🏷️',
      color: 'text-purple-400',
    },
    {
      label: isArabic ? 'سلسلة مكتملة' : 'Completed Series',
      value: overview.completedSeries,
      icon: '✅',
      color: 'text-green-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[#7F77DD]/30 bg-sura-dark/90 p-5 text-center transition hover:border-[#7F77DD]/50"
          >
            <div className="text-2xl">{card.icon}</div>
            <div className="mt-2 text-xs uppercase tracking-widest text-[#7F77DD]">
              {card.label}
            </div>
            <div className={`mt-2 font-serif text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Reading Streak */}
      <ReadingStreakDisplay streak={overview.readingStreak} />

      {/* Recently Viewed */}
      {overview.recentlyViewed.length > 0 && (
        <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-sura-ivory">
            {isArabic ? 'آخر المشاهدات' : 'Recently Viewed'}
          </h2>
          <div className="mt-4 space-y-2">
            {overview.recentlyViewed.map((item) => (
              <div
                key={`${item.contentType}-${item.id}`}
                className="flex items-center justify-between rounded-lg bg-sura-ivory/5 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-sura-ivory">
                    {item.title}
                  </div>
                  <div className="text-xs text-sura-ivory/50">
                    {item.contentType === 'article'
                      ? isArabic ? 'مقال' : 'Article'
                      : item.contentType === 'chapter'
                      ? isArabic ? 'فصل' : 'Chapter'
                      : item.contentType}
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-bold text-[#7F77DD]">{item.progress}%</div>
                  <div className="text-xs text-sura-ivory/50">
                    {new Date(item.updatedAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
