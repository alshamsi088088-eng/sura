import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

interface OverviewStats {
  views: number;
  likes: number;
  bookmarks: number;
  ratings: number;
  comments: number;
  articles: number;
  novels: number;
  chapters: number;
}

export function AnalyticsOverview() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isArabic = locale === 'ar';

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    fetch('/api/analytics/overview', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setStats(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sura-teal border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: isArabic ? 'المشاهدات' : 'Views', value: stats.views, color: 'bg-blue-500' },
    { label: isArabic ? 'الإعجابات' : 'Likes', value: stats.likes, color: 'bg-pink-500' },
    { label: isArabic ? 'الإشارات المرجعية' : 'Bookmarks', value: stats.bookmarks, color: 'bg-yellow-500' },
    { label: isArabic ? 'التقييمات' : 'Ratings', value: stats.ratings, color: 'bg-purple-500' },
    { label: isArabic ? 'التعليقات' : 'Comments', value: stats.comments, color: 'bg-green-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-xl bg-sura-dark p-4 border border-sura-ivory/10"
        >
          <div className={`h-2 w-2 rounded-full ${card.color} mb-3`} />
          <p className="text-2xl font-bold text-sura-ivory">
            {card.value.toLocaleString()}
          </p>
          <p className="text-sm text-sura-ivory/60 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}