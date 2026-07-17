import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';
import type { ContentType } from './LikeButton';
import { supabase } from '../lib/supabaseClient';

export type BookmarkButtonProps = {
  contentType?: ContentType;
  contentId?: string;

  // Legacy props
  entityId?: string;
  entityType?: string;

  initialBookmarked?: boolean;
  initialCount?: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (bookmarked: boolean, count: number) => void;
};

function targetColumnFor(contentType: ContentType) {
  switch (contentType) {
    case 'article':
      return 'articleId';
    case 'novel':
      return 'novelId';
    case 'chapter':
      return 'chapterId';
    case 'book':
      return 'bookId';
    case 'community':
      return 'communityId';
    default:
      return 'articleId';
  }
}

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
  const contentType = propContentType || (entityType as ContentType) || 'article';
  const contentId = propContentId || entityId || '';

  const { user } = useAuth();
  const { locale } = useLocale();

  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const isArabic = locale === 'ar';

  useEffect(() => {
    setBookmarked(initialBookmarked);
    setCount(initialCount);
  }, [contentId, initialBookmarked, initialCount]);

  const targetCol = useMemo(() => targetColumnFor(contentType), [contentType]);

  const load = useCallback(async () => {
    if (!contentId || !supabase) return;

    const { data: bookmarkRow, error: bookmarkErr } = await supabase
      .from('Bookmark')
      .select('userId')
      .eq('userId', user?.id ?? '')
      .eq(targetCol, contentId)
      .maybeSingle();

    if (bookmarkErr) {
      // ignore
    }

    const nextBookmarked = Boolean(bookmarkRow);

    const { count: bookmarkCount, error: countErr } = await supabase
      .from('Bookmark')
      .select('*', { count: 'exact', head: true })
      .eq(targetCol, contentId);

    if (countErr) return;

    const nextCount = Number(bookmarkCount ?? 0);
    setBookmarked(nextBookmarked);
    setCount(nextCount);
    onChange?.(nextBookmarked, nextCount);
  }, [contentId, targetCol, user?.id, onChange]);

  useEffect(() => {
    if (!contentId) return;
    load().catch(() => {});
  }, [contentId, load]);

  const handleToggle = useCallback(async () => {
    if (!user) return;
    if (!contentId) return;
    if (!supabase) return;
    if (isLoading) return;

    const prevBookmarked = bookmarked;
    const prevCount = count;
    const nextBookmarked = !prevBookmarked;

    setBookmarked(nextBookmarked);
    setCount(nextBookmarked ? count + 1 : Math.max(0, count - 1));
    onChange?.(nextBookmarked, nextBookmarked ? count + 1 : Math.max(0, count - 1));

    setIsLoading(true);

    try {
      const { data: existing } = await supabase
        .from('Bookmark')
        .select('userId')
        .eq('userId', user.id)
        .eq(targetCol, contentId)
        .maybeSingle();

      if (existing) {
        const { error: delError } = await supabase
          .from('Bookmark')
          .delete()
          .eq('userId', user.id)
          .eq(targetCol, contentId);
        if (delError) throw delError;
      } else {
        const payload: any = { userId: user.id, [targetCol]: contentId };
        const { error: insError } = await supabase.from('Bookmark').insert(payload);
        if (insError) throw insError;
      }

      await load();

      trackEvent(nextBookmarked ? 'bookmark_added' : 'bookmark_removed', {
        content_type: contentType,
        content_id: contentId
      });
    } catch {
      setBookmarked(prevBookmarked);
      setCount(prevCount);
      onChange?.(prevBookmarked, prevCount);
    } finally {
      setIsLoading(false);
    }
  }, [user, contentId, targetCol, supabase, isLoading, bookmarked, count, onChange, load, contentType]);

  const sizeClasses: Record<string, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconStroke: Record<string, string> = {
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
      title={
        bookmarked
          ? isArabic ? 'إزالة منالمفضات' : 'Remove from Library'
          : isArabic ? 'إضافة للمفضات' : 'Add to Library'
      }
    >
      <svg
        className={iconStroke[size]}
        fill={bookmarked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {bookmarked ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.096 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.09.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        ) : (
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.096 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.09.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v4.5M9 9h6" />
          </>
        )}
      </svg>
      <span className="hidden sm:inline">
        {bookmarked ? (isArabic ? 'محفوظ' : 'Saved') : isArabic ? 'حفظ' : 'Save'}
      </span>
    </button>
  );
}

export default memo(BookmarkButton);

