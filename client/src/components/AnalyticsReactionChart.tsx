import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { EMOJI_MAP } from './emojis';

interface ReactionBreakdown {
  [emoji: string]: number;
}

export function AnalyticsReactionChart() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [reactions, setReactions] = useState<ReactionBreakdown>({});
  const [isLoading, setIsLoading] = useState(true);

  const isArabic = locale === 'ar';

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    fetch('/api/analytics/reactions', { credentials: 'include' })
      .then(res => res.ok ? res.json() : {})
      .then(data => {
        setReactions(data);
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

  const hasReactions = Object.keys(reactions).length > 0;
  if (!hasReactions) {
    return (
      <p className="text-sura-ivory/60 text-center py-8">
        {isArabic ? 'لا توجد تفاعلات بعد' : 'No reactions yet'}
      </p>
    );
  }

  // Sort by percentage
  const sorted = Object.entries(reactions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-3">
      {sorted.map(([emoji, percent]) => (
        <div key={emoji}>
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-2 text-sura-ivory">
              <span className="text-xl">{EMOJI_MAP[emoji] || emoji}</span>
              <span className="text-sm">{emoji.replace('_', ' ')}</span>
            </span>
            <span className="text-sura-ivory/60 text-sm">{percent}%</span>
          </div>
          <div className="h-2 bg-sura-ivory/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-sura-teal rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}