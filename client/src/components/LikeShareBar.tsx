import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { getApiBaseUrl } from '../lib/runtimeConfig';

const API_URL = getApiBaseUrl();

interface LikeShareBarProps {
  entityId: string;
  entityType: string; // 'article' | 'novel' | 'chapter' | 'book'
  title?: string;
}

// UI emoji -> backend-accepted emoji value
// Backend only accepts: love, fire, funny, sad, wow, clap, mind_blown, excellent
const EMOJI_MAP: Record<string, string> = {
  '👍': 'clap',
  '😍': 'love',
  '😮': 'wow',
  '🔥': 'fire',
  '👏': 'excellent'
};
const EMOJI_OPTIONS = Object.keys(EMOJI_MAP);

export function LikeShareBar({ entityId, entityType, title }: LikeShareBarProps) {
  const { user } = useAuth();
  const { locale } = useLocale();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  const [emojiCounts, setEmojiCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);

  const query = `type=${entityType}&id=${entityId}`;

  const fetchLike = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/engagement/like?${query}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setLiked(!!d.liked);
        setLikeCount(d.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch like status:', err);
    }
  }, [query]);

  const fetchBookmark = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/engagement/bookmark?${query}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setIsBookmarked(!!d.bookmarked);
        setBookmarkCount(d.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch bookmark status:', err);
    }
  }, [query, user]);

  const fetchRating = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/engagement/rating?${query}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setUserRating(d.userRating || 0);
        setAvgRating(d.average || 0);
        setRatingCount(d.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch rating status:', err);
    }
  }, [query]);

  const fetchReaction = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/engagement/reaction?contentId=${entityId}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setUserReaction(d.userReaction || null);
        setEmojiCounts(d.counts || {});
      }
    } catch (err) {
      console.error('Failed to fetch reaction status:', err);
    }
  }, [entityId]);

  const fetchAll = useCallback(() => {
    fetchLike();
    fetchBookmark();
    fetchRating();
    fetchReaction();
  }, [fetchLike, fetchBookmark, fetchRating, fetchReaction]);

  useEffect(() => {
    fetchAll();
    // Poll every 10 seconds for near-real-time updates
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleLike = async () => {
    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(prev => (wasLiked ? prev - 1 : prev + 1));
    try {
      const res = await fetch(`${API_URL}/api/engagement/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: entityType, id: entityId })
      });
      if (res.ok) {
        const d = await res.json();
        setLiked(!!d.liked);
        setLikeCount(d.count || 0);
      } else {
        // revert on failure
        setLiked(wasLiked);
        setLikeCount(prev => (wasLiked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error('Failed to like:', err);
      setLiked(wasLiked);
      setLikeCount(prev => (wasLiked ? prev + 1 : prev - 1));
    }
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      alert(locale === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    setBookmarkCount(prev => (wasBookmarked ? prev - 1 : prev + 1));
    try {
      const res = await fetch(`${API_URL}/api/engagement/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: entityType, id: entityId })
      });
      if (res.ok) {
        const d = await res.json();
        setIsBookmarked(!!d.bookmarked);
        setBookmarkCount(d.count || 0);
      } else {
        setIsBookmarked(wasBookmarked);
        setBookmarkCount(prev => (wasBookmarked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error('Failed to bookmark:', err);
      setIsBookmarked(wasBookmarked);
      setBookmarkCount(prev => (wasBookmarked ? prev + 1 : prev - 1));
    }
  };

  const handleEmoji = async (uiEmoji: string) => {
    if (!user) return;
    const backendEmoji = EMOJI_MAP[uiEmoji];
    if (!backendEmoji) return;
    // If clicking the same reaction again, remove it; otherwise set/replace it
    const nextEmoji = userReaction === backendEmoji ? 'remove' : backendEmoji;
    try {
      const res = await fetch(`${API_URL}/api/engagement/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentId: entityId, contentType: entityType, emoji: nextEmoji })
      });
      if (res.ok) {
        const d = await res.json();
        setUserReaction(d.userReaction || null);
        setEmojiCounts(d.counts || {});
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) return;
    const prevRating = userRating;
    setUserRating(rating);
    try {
      const res = await fetch(`${API_URL}/api/engagement/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: entityType, id: entityId, value: rating })
      });
      if (res.ok) {
        const d = await res.json();
        setUserRating(d.userRating || 0);
        setAvgRating(d.average || 0);
        setRatingCount(d.count || 0);
      } else {
        setUserRating(prevRating);
      }
    } catch (err) {
      console.error('Failed to rate:', err);
      setUserRating(prevRating);
    }
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title || '');
    let shareUrl = '';
    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${text}%20${url}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    }
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Main Actions */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-sura-navy/80">
        <button onClick={handleLike} className="rounded-full border border-sura-sky/20 bg-white/80 px-3 py-2 transition hover:border-sura-gold/50 hover:text-sura-navy">
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>
        <button onClick={handleShare} className="rounded-full border border-sura-sky/20 bg-white/80 px-3 py-2 transition hover:border-sura-gold/50 hover:text-sura-navy">
          🔗 {locale === 'ar' ? 'مشاركة' : 'Share'}
        </button>
        <button onClick={handleBookmark} disabled={!user} className={`rounded-full border px-3 py-2 transition ${isBookmarked ? 'border-sura-gold bg-sura-gold/20' : 'border-sura-sky/20 bg-white/80'} disabled:opacity-50`}>
          {isBookmarked ? '★' : '☆'} {locale === 'ar' ? 'حفظ' : 'Save'} {bookmarkCount > 0 ? `(${bookmarkCount})` : ''}
        </button>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => handleRating(star)} disabled={!user} className="text-xl transition hover:scale-110 disabled:opacity-50">
              {star <= (userRating || avgRating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        <span className="text-sm text-sura-navy/60">
          {avgRating > 0 ? `${avgRating.toFixed(1)} (${ratingCount} ${locale === 'ar' ? 'تصويت' : 'votes'})` : ''}
        </span>
      </div>

      {/* Emoji Reactions */}
      <div className="flex flex-wrap gap-2">
        {EMOJI_OPTIONS.map((uiEmoji) => {
          const backendEmoji = EMOJI_MAP[uiEmoji];
          const isActive = userReaction === backendEmoji;
          return (
            <button
              key={uiEmoji}
              onClick={() => handleEmoji(uiEmoji)}
              disabled={!user}
              className={`rounded-full border px-3 py-1 text-lg transition hover:bg-sura-teal/20 disabled:opacity-50 ${isActive ? 'border-sura-gold bg-sura-teal/20' : 'border-sura-line bg-white/80'}`}
            >
              {uiEmoji} {emojiCounts[backendEmoji] || 0}
            </button>
          );
        })}
      </div>

      {/* Share to Social */}
      <div className="flex gap-2 pt-2">
        <span className="text-sm text-sura-navy/60">{locale === 'ar' ? 'مشاركة إلى:' : 'Share to:'}</span>
        <button onClick={() => shareToSocial('whatsapp')} className="rounded-full bg-green-500/20 px-3 py-1 text-sm">WhatsApp</button>
        <button onClick={() => shareToSocial('twitter')} className="rounded-full bg-sky-500/20 px-3 py-1 text-sm">Twitter</button>
        <button onClick={() => shareToSocial('facebook')} className="rounded-full bg-blue-500/20 px-3 py-1 text-sm">Facebook</button>
      </div>
    </div>
  );
}
