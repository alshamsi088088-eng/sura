import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';

export type ContentType = 'article' | 'novel' | 'chapter' | 'book' | 'community';

export type LikeButtonProps = {
  contentType?: ContentType;
  contentId?: string;

  // Legacy props
  itemId?: string;
  entityType?: string;

  initialLiked?: boolean;
  initialCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (liked: boolean, count: number) => void;
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
  const contentType = propContentType || (entityType as ContentType) || 'article';
  const contentId = propContentId || itemId || '';

  const { user } = useAuth();
  const { locale } = useLocale();

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const isArabic = locale === 'ar';

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [contentId, initialLiked, initialCount]);

  const targetCol = useMemo(() => targetColumnFor(contentType), [contentType]);

  const load = useCallback(async () => {
    if (!contentId || !supabase) return;

    // liked?
    const { data: likeRow, error: likeRowErr } = await supabase
      .from('Like')
      .select('userId')
      .eq('userId', user?.id ?? '')
      .eq(targetCol, contentId)
      .maybeSingle();

    if (likeRowErr) {
      // ignore (keep optimistic/initial)
    }

    const nextLiked = Boolean(likeRow);

    // count
    const { count: likeCount, error: countErr } = await supabase
      .from('Like')
      .select('*', { count: 'exact', head: true })
      .eq(targetCol, contentId);

    if (countErr) {
      // ignore
      return;
    }

    const nextCount = Number(likeCount ?? 0);
    setLiked(nextLiked);
    setCount(nextCount);
    onChange?.(nextLiked, nextCount);
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

    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !prevLiked;

    // Optimistic update
    setLiked(nextLiked);
    setCount(nextLiked ? count + 1 : Math.max(0, count - 1));
    onChange?.(nextLiked, nextLiked ? count + 1 : Math.max(0, count - 1));

    setIsLoading(true);
    try {
      // check existing
      const { data: existing } = await supabase
        .from('Like')
        .select('userId')
        .eq('userId', user.id)
        .eq(targetCol, contentId)
        .maybeSingle();

      if (existing) {
        const { error: delError } = await supabase
          .from('Like')
          .delete()
          .eq('userId', user.id)
          .eq(targetCol, contentId);
        if (delError) throw delError;
      } else {
        const payload: any = {
          userId: user.id,
          [targetCol]: contentId
        };
        const { error: insError } = await supabase.from('Like').insert(payload);
        if (insError) throw insError;
      }

      await load();

      trackEvent(nextLiked ? 'like_added' : 'like_removed', {
        content_type: contentType,
        content_id: contentId
      });
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
      onChange?.(prevLiked, prevCount);
    } finally {
      setIsLoading(false);
    }
  }, [user, contentId, supabase, isLoading, liked, count, onChange, targetCol, load, contentType]);

  const sizeClasses: Record<string, string> = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const iconSizes: Record<string, string> = {
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
        } ${sizeClasses[size]} ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
        aria-label={liked ? 'Unlike' : 'Like'}
        title={liked ? (isArabic ? 'إلغاء الإعجاب' : 'Unlike') : isArabic ? 'إعجاب' : 'Like'}
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
        <span className="text-sm font-medium text-sura-ivory/80">{count}</span>
      )}
    </div>
  );
}

export default memo(LikeButton);


