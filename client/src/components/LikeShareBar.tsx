import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc, increment, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

interface LikeShareBarProps {
  entityId: string;
  entityType: string;
  title?: string;
}

interface EngagementData {
  likes: number;
  shares: number;
  bookmarks: string[];
  ratings: { [userId: string]: number };
  emojis: { [key: string]: number };
}

const EMOJI_OPTIONS = ['👍', '😍', '😮', '🔥', '👏'];

export function LikeShareBar({ entityId, entityType, title }: LikeShareBarProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [data, setData] = useState<EngagementData>({ likes: 0, shares: 0, bookmarks: [], ratings: {}, emojis: {} });
  const [userRating, setUserRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const docId = `${entityType}_${entityId}`;

  useEffect(() => {
    const docRef = doc(db, 'engagement', docId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const d = snapshot.data() as EngagementData | undefined;
      setData(d || { likes: 0, shares: 0, bookmarks: [], ratings: {}, emojis: {} });
      if (user) {
        setUserRating(d?.ratings?.[user.id] || 0);
      }
    });
    return () => unsubscribe();
  }, [docId, user]);

  const isBookmarked = user && data.bookmarks?.includes(user.id);

  const avgRating = useMemo(() => {
    const ratings = Object.values(data.ratings || {});
    if (!ratings.length) return 0;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }, [data.ratings]);

  const handleLike = async () => {
    const docRef = doc(db, 'engagement', docId);
    await setDoc(docRef, { likes: increment(1) }, { merge: true });
  };

  const handleShare = async () => {
    const docRef = doc(db, 'engagement', docId);
    await setDoc(docRef, { shares: increment(1) }, { merge: true });
    // Copy to clipboard
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    alert(locale === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
  };

  const handleBookmark = async () => {
    if (!user) return;
    const docRef = doc(db, 'engagement', docId);
    if (isBookmarked) {
      await updateDoc(docRef, { bookmarks: arrayRemove(user.id) });
    } else {
      await updateDoc(docRef, { bookmarks: arrayUnion(user.id) });
    }
  };

  const handleEmoji = async (emoji: string) => {
    const docRef = doc(db, 'engagement', docId);
    const current = data.emojis?.[emoji] || 0;
    await setDoc(docRef, { emojis: { ...data.emojis, [emoji]: current + 1 } }, { merge: true });
  };

  const handleRating = async (rating: number) => {
    if (!user) return;
    setUserRating(rating);
    const docRef = doc(db, 'engagement', docId);
    await setDoc(docRef, { ratings: { ...data.ratings, [user.id]: rating } }, { merge: true });
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
          ❤️ {data.likes}
        </button>
        <button onClick={handleShare} className="rounded-full border border-sura-sky/20 bg-white/80 px-3 py-2 transition hover:border-sura-gold/50 hover:text-sura-navy">
          🔗 {locale === 'ar' ? 'مشاركة' : 'Share'}
        </button>
        <button onClick={handleBookmark} disabled={!user} className={`rounded-full border px-3 py-2 transition ${isBookmarked ? 'border-sura-gold bg-sura-gold/20' : 'border-sura-sky/20 bg-white/80'} disabled:opacity-50`}>
          {isBookmarked ? '★' : '☆'} {locale === 'ar' ? 'حفظ' : 'Save'}
        </button>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => handleRating(star)} className="text-xl transition hover:scale-110">
              {star <= (showRating ? userRating : avgRating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        <span className="text-sm text-sura-navy/60">
          {avgRating > 0 ? `${avgRating.toFixed(1)} (${Object.keys(data.ratings || {}).length} ${locale === 'ar' ? 'تصويت' : 'votes'})` : ''}
        </span>
      </div>

      {/* Emoji Reactions */}
      <div className="flex flex-wrap gap-2">
        {EMOJI_OPTIONS.map((emoji) => (
          <button key={emoji} onClick={() => handleEmoji(emoji)} className="rounded-full border border-sura-line bg-white/80 px-3 py-1 text-lg transition hover:bg-sura-teal/20">
            {emoji} {data.emojis?.[emoji] || 0}
          </button>
        ))}
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
