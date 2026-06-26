import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';
import type { ContentType } from './LikeButton';

export type BookmarkButtonProps = {
  // New props
  contentType?: ContentType;
  contentId?: string;
  // Legacy props (for backward compatibility)
  entityId?: string;
  entityType?: string;
  initialBookmarked?: boolean;
  initialCount?: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (bookmarked: boolean, count: number) => void;
};

export function BookmarkButton({
  contentType: propContentType,
  contentId: propContentId,
  entityId,
  entityType,
  initialBookmarked = false,
  initialCount = 0,
  size = 'md',
  onChange
}: BookmarkButtonProps) {
  // Support both new and legacy prop names
  const contentType = propContentType || (entityType as ContentType) || 'article';
  const contentId = propContentId || entityId || '';

  const { user } = useAuth();
  const { locale } = useLocale();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const isArabic = locale === 'ar';

  // Sync with props
  useEffect(() => {
    setBookmarked(initialBookmarked);
    setCount(initialCount);
  }, [contentId, initialBookmarked, initialCount]);

  // Fetch status on mount
  useEffect(() => {
    if (!contentId) return;

    fetch(`/api/engagement/bookmark?type=${contentType}&id=${contentId}`, {
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setBookmarked(data.bookmarked);
          setCount(data.count);
        }
      })
      .catch(() => {});
  }, [contentId, contentType]);

  const handleToggle = useCallback(async () => {
    if (!user) return;
    if (isLoading) return;

    const prevBookmarked = bookmarked;
    const prevCount = count;
    const nextBookmarked = !bookmarked;

    // Optimistic update
    setBookmarked(nextBookmarked);
    setCount(nextBookmarked ? count + 1 : Math.max(0, count - 1));
    onChange?.(nextBookmarked, nextBookmarked ? count + 1 : Math.max(0, count - 1));

    setIsLoading(true);

    try {
      const res = await fetch('/api/engagement/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: contentType, id: contentId })
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setBookmarked(data.bookmarked);
      setCount(data.count);
      onChange?.(data.bookmarked, data.count);

      trackEvent(nextBookmarked ? 'bookmark_added' : 'bookmark_removed', {
        content_type: contentType,
        content_id: contentId
      });
    } catch {
      // Revert on error
      setBookmarked(prevBookmarked);
      setCount(prevCount);
      onChange?.(prevBookmarked, prevCount);
    } finally {
      setIsLoading(false);
    }
  }, [user, contentType, contentId, bookmarked, count, isLoading, onChange]);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const iconStroke = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!user || isLoading}
      className={`flex items-center gap-1.5 rounded-full font-semibold transition ${
        bookmarked
          ? 'bg-sura-gold text-sura-dark'
          : 'border border-sura-ivory/20 bg-sura-beige/80 text-sura-navy/80 hover:border-sura-gold/60'
      } ${sizeClasses[size]} ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={bookmarked ? (isArabic ? 'إزالة منالمفضات' : 'Remove from Library') : (isArabic ? 'إضافة للمفضات' : 'Add to Library')}
    >
      <svg
        className={iconStroke[size]}
        fill={bookmarked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {bookmarked ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.096 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.09.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        ) : (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.096 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.09.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v4.5M9 9h6" />
          </>
        )}
      </svg>
      <span className="hidden sm:inline">
        {bookmarked ? (isArabic ? 'محفوظ' : 'Saved') : (isArabic ? 'حفظ' : 'Save')}
      </span>
    </button>
  );
}