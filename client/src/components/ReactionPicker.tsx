import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import type { ContentType } from './LikeButton';
import { EMOJI_MAP, EMOJI_KEYS } from './emojis';

interface ReactionCounts {
  [emoji: string]: number;
}

interface ReactionPickerProps {
  contentType: ContentType;
  contentId: string;
  onChange?: (userReaction: string | null, counts: ReactionCounts, topReaction: string) => void;
}

export function ReactionPicker({
  contentType,
  contentId,
  onChange
}: ReactionPickerProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [counts, setCounts] = useState<ReactionCounts>({});
  const [topReaction, setTopReaction] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const isArabic = locale === 'ar';

  // Fetch reaction status on mount
  useEffect(() => {
    if (!contentId) return;

    fetch(`/api/engagement/reaction?contentId=${contentId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUserReaction(data.userReaction);
          setCounts(data.counts);
          setTopReaction(data.topReaction);
        }
      })
      .catch(() => {});
  }, [contentId]);

  const handleReaction = useCallback(async (emoji: string) => {
    if (!user || isLoading) return;
    if (!contentId || !contentType) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/engagement/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentId, contentType, emoji })
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setUserReaction(data.userReaction);
      setCounts(data.counts);
      setTopReaction(data.topReaction);
      setShowPicker(false);
      onChange?.(data.userReaction, data.counts, data.topReaction);
    } catch (error) {
      console.error('Reaction error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, contentId, contentType, isLoading, onChange]);

  const totalReactions = useMemo(() => {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }, [counts]);

  const topEmojiDisplay = topReaction ? EMOJI_MAP[topReaction] : null;

  return (
    <div className="relative">
      {/* Current reaction display / trigger */}
      <button
        onClick={() => user && setShowPicker(!showPicker)}
        disabled={!user}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
          userReaction
            ? 'border-sura-teal bg-sura-teal/10 text-sura-teal'
            : 'border-sura-ivory/20 text-sura-ivory/60 hover:border-sura-ivory/40'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        {userReaction ? (
          <span>{EMOJI_MAP[userReaction]}</span>
        ) : (
          <span className="text-sura-ivory/40">React</span>
        )}
        {totalReactions > 0 && (
          <span className="text-sura-ivory/60">{totalReactions}</span>
        )}
        {topEmojiDisplay && (
          <span className="ml-1 text-lg" title={topReaction}>
            {topEmojiDisplay}
          </span>
        )}
      </button>

      {/* Reaction picker */}
      {showPicker && (
        <div className="absolute left-0 top-full z-50 mt-2 rounded-xl border border-sura-ivory/20 bg-sura-dark p-2 shadow-lg">
          <div className="flex gap-1">
            {EMOJI_KEYS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                disabled={isLoading}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition hover:scale-110 ${
                  userReaction === emoji
                    ? 'bg-sura-teal/20'
                    : 'hover:bg-sura-ivory/10'
                }`}
                title={emoji.replace('_', ' ')}
              >
                {EMOJI_MAP[emoji]}
              </button>
            ))}
          </div>
          {userReaction && (
            <button
              onClick={() => handleReaction('remove')}
              disabled={isLoading}
              className="mt-2 w-full rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/30"
            >
              {isArabic ? '\u0625\u0644\u0639\u0629 \u0627\u0644\u062a\u0639\u0644\u064a\u0629' : 'Remove'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}