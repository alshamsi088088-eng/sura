import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ContentType } from './LikeButton';
import { EMOJI_MAP, EMOJI_KEYS } from './emojis';

interface ReactionBarProps {
  contentType: ContentType;
  contentId: string;
  layout?: 'horizontal' | 'compact';
}

export function ReactionBar({ contentType, contentId, layout = 'horizontal' }: ReactionBarProps) {
  const { user } = useAuth();
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [topReaction, setTopReaction] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reaction status (Phase 2 endpoint)
  useEffect(() => {
    if (!contentId) return;

    fetch(`/api/engagement/reaction?contentId=${contentId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUserReaction(data.userReaction);
          setCounts(data.counts || {});
          setTopReaction(data.topReaction || '');
        }
      })
      .catch(() => {});
  }, [contentId]);

  const handleReaction = useCallback(async (emoji: string) => {
    if (!user || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/engagement/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentId, contentType, emoji })
      });

      if (res.ok) {
        const data = await res.json();
        setUserReaction(data.userReaction);
        setCounts(data.counts || {});
        setTopReaction(data.topReaction || '');
      }
    } catch { /* silently fail */ }
    finally {
      setIsLoading(false);
    }
  }, [user, contentId, contentType, isLoading]);

  const totalReactions = useMemo(() => {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }, [counts]);

  if (totalReactions === 0 && !user) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${layout === 'compact' ? 'py-2' : 'py-3'}`}>
      {EMOJI_KEYS.map(key => {
        const count = counts[key] || 0;
        const isActive = userReaction === key;
        const isTop = key === topReaction && count > 0;

        return (
          <button
            key={key}
            onClick={() => user && handleReaction(key)}
            disabled={!user || isLoading}
            className={`
              flex items-center gap-1 rounded-full border transition
              ${layout === 'compact'
                ? 'px-2 py-1 text-xs'
                : 'px-3 py-1.5 text-sm'
              }
              ${isActive
                ? 'border-sura-teal bg-sura-teal/20 text-sura-teal'
                : isTop
                  ? 'border-sura-ivory/30 bg-sura-ivory/5 text-sura-ivory'
                  : 'border-sura-ivory/20 text-sura-ivory/60 hover:border-sura-ivory/40'
              }
              ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
            title={key.replace('_', ' ')}
          >
            <span className={layout === 'compact' ? 'text-sm' : 'text-lg'}>
              {EMOJI_MAP[key]}
            </span>
            {count > 0 && (
              <span className="text-sura-ivory/70">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default memo(ReactionBar);