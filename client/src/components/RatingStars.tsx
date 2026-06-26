import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';
import type { ContentType } from './LikeButton';

export type RatingStarsProps = {
  // New props
  contentType?: ContentType;
  contentId?: string;
  // Legacy props (for backward compatibility)
  entityId?: string;
  entityType?: string;
  initialUserRating?: number | null;
  initialAverage?: number;
  initialCount?: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (userRating: number | null, average: number, count: number) => void;
};

export function RatingStars({
  contentType: propContentType,
  contentId: propContentId,
  entityId,
  entityType,
  initialUserRating = null,
  initialAverage = 0,
  initialCount = 0,
  size = 'md',
  onChange
}: RatingStarsProps) {
  // Support both new and legacy prop names
  const contentType = propContentType || (entityType as ContentType) || 'article';
  const contentId = propContentId || entityId || '';
  const { user } = useAuth();
  const { locale } = useLocale();
  const [userRating, setUserRating] = useState<number | null>(initialUserRating);
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const isArabic = locale === 'ar';

  const stars = useMemo(() => Array.from({ length: 5 }, (_, index) => index + 1), []);

  // Sync with props
  useEffect(() => {
    setUserRating(initialUserRating);
    setAverage(initialAverage);
    setCount(initialCount);
  }, [contentId, initialUserRating, initialAverage, initialCount]);

  // Fetch status on mount
  useEffect(() => {
    if (!contentId) return;

    fetch(`/api/engagement/rating?type=${contentType}&id=${contentId}`, {
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUserRating(data.userRating);
          setAverage(data.average);
          setCount(data.count);
        }
      })
      .catch(() => {});
  }, [contentId, contentType]);

  const handleRate = useCallback(async (ratingValue: number) => {
    if (!user) return;
    if (isLoading) return;

    const prevUserRating = userRating;

    // Optimistic update - immediate visual feedback
    setUserRating(ratingValue);
    setIsLoading(true);

    try {
      const res = await fetch('/api/engagement/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: contentType, id: contentId, value: ratingValue })
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setUserRating(data.userRating);
      setAverage(data.average);
      setCount(data.count);
      onChange?.(data.userRating, data.average, data.count);

      trackEvent('rating_set', {
        content_type: contentType,
        content_id: contentId,
        value: ratingValue
      });
    } catch {
      // Revert on error
      setUserRating(prevUserRating);
      onChange?.(prevUserRating, average, count);
    } finally {
      setIsLoading(false);
    }
  }, [user, contentType, contentId, userRating, average, count, isLoading, onChange]);

  const starSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-0.5">
        {stars.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRate(value)}
            disabled={!user || isLoading}
            className={`${starSizes[size]} transition ${
              userRating !== null && userRating >= value
                ? 'text-sura-teal'
                : 'text-sura-ivory/40 hover:text-sura-teal'
            } ${!user ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={isArabic ? `تصنيف ${value} نجوم` : `Rate ${value} stars`}
          >
            ★
          </button>
        ))}
      </div>
      {count > 0 && (
        <div className="text-xs text-sura-ivory/60">
          {count} {count === 1 ? (isArabic ? 'تصنيف' : 'rating') : (isArabic ? 'تصنيفات' : 'ratings')}
          {' • '}
          {average.toFixed(1)} {isArabic ? 'المتوسط' : 'avg'}
        </div>
      )}
    </div>
  );
}

export default memo(RatingStars);