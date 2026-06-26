import { useCallback, useEffect, useState, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';

export type ContentType = 'article' | 'novel' | 'chapter' | 'book' | 'community';

export type LikeButtonProps = {
  // New props
  contentType?: ContentType;
  contentId?: string;
  // Legacy props (for backward compatibility)
  itemId?: string;
  entityType?: string;
  initialLiked?: boolean;
  initialCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (liked: boolean, count: number) => void;
};

export function LikeButton({
  contentType: propContentType,
  contentId: propContentId,
  itemId,
  entityType,
  initialLiked = false,
  initialCount = 0,
  showCount = true,
  size = 'md',
  onChange
}: LikeButtonProps) {
  // Support both new and legacy prop names
  const contentType = propContentType || (entityType as ContentType) || 'article';
  const contentId = propContentId || itemId || '';
  const { user } = useAuth();
  const { locale } = useLocale();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const isArabic = locale === 'ar';

  // Sync with props
  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [contentId, initialLiked, initialCount]);

  // Fetch current status on mount or when content changes
  useEffect(() => {
    if (!contentId) return;

    fetch(`/api/engagement/like?type=${contentType}&id=${contentId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setLiked(data.liked);
          setCount(data.count);
        }
      })
      .catch(() => {
        // Keep initial values on error
      });
  }, [contentId, contentType]);

  const handleToggle = useCallback(async () => {
    if (!user) {
      // Could redirect to login or show modal
      return;
    }
    if (isLoading) return;

    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !prevLiked;

    // Optimistic update
    setLiked(nextLiked);
    setCount(nextLiked ? count + 1 : Math.max(0, count - 1));
    onChange?.(nextLiked, nextLiked ? count + 1 : Math.max(0, count - 1));

    setIsLoading(true);

    try {
      const res = await fetch('/api/engagement/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: contentType, id: contentId })
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();

      // Sync with server
      setLiked(data.liked);
      setCount(data.count);
      onChange?.(data.liked, data.count);

      trackEvent(nextLiked ? 'like_added' : 'like_removed', {
        content_type: contentType,
        content_id: contentId
      });
    } catch {
      // Revert on error
      setLiked(prevLiked);
      setCount(prevCount);
      onChange?.(prevLiked, prevCount);
    } finally {
      setIsLoading(false);
    }
  }, [user, contentType, contentId, liked, count, isLoading, onChange]);

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={!user || isLoading}
        className={`relative flex items-center justify-center rounded-full transition-all ${
          liked
            ? 'bg-pink-500/20 text-pink-500 hover:bg-pink-500/30'
            : 'bg-sura-ivory/10 text-sura-ivory/60 hover:bg-sura-ivory/20 hover:text-sura-ivory'
        } ${sizeClasses[size]} ${
          !user ? 'cursor-not-allowed opacity-50' : ''
        }`}
        aria-label={liked ? 'Unlike' : 'Like'}
        title={liked ? (isArabic ? 'إلغاء الإعجاب' : 'Unlike') : (isArabic ? 'إعجاب' : 'Like')}
      >
        <svg
          className={iconSizes[size]}
          fill={liked ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={liked ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.668 3.5 3.5 5.667 3.5 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button>

      {showCount && count > 0 && (
        <span className="text-sm font-medium text-sura-ivory/80">
          {count}
        </span>
      )}
    </div>
  );
}

export default memo(LikeButton);