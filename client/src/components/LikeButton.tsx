import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/analytics';

export type LikeButtonProps = {
  itemId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onChange?: (liked: boolean, count: number) => void;
};

type EngagementDoc = {
  likes?: number;
  users?: string[];
};

export function LikeButton({ itemId, initialLiked = false, initialCount = 0, onChange }: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [count, setCount] = useState<number>(initialCount);
  const [isSyncing, setIsSyncing] = useState(false);

  const docId = useMemo(() => `like_${itemId}`, [itemId]);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [itemId, initialLiked, initialCount]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'likes', docId), (snapshot) => {
      const data = (snapshot.data() || {}) as EngagementDoc;
      const likesCount = typeof data.likes === 'number' ? data.likes : 0;
      const users = Array.isArray(data.users) ? data.users : [];
      const nextLiked = user ? users.includes(user.id) : false;
      setLiked(nextLiked);
      setCount(likesCount);
    });

    return () => unsubscribe();
  }, [docId, user?.id]);

  const applyOptimistic = (nextLiked: boolean) => {
    const delta = nextLiked ? 1 : -1;
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + delta));
    if (onChange) {
      const nextCount = Math.max(0, count + delta);
      onChange(nextLiked, nextCount);
    }
  };

  const toggleLike = async () => {
    if (!user) return;
    if (isSyncing) return;

    const prevLiked = liked;
    const nextLiked = !prevLiked;

    applyOptimistic(nextLiked);
    setIsSyncing(true);

    try {
      const ref = doc(db, 'likes', docId);
      const update: Partial<EngagementDoc> & Record<string, unknown> = {
        likes: nextLiked ? count + 1 : Math.max(0, count - 1),
      };

      // Keep users array for correctness; fallback to simple overwrite if missing.
      if (nextLiked) {
        update.users = []; // will be merged with below
      } else {
        update.users = [];
      }

      const snapshot = await onSnapshot(ref, () => undefined);
      // Note: we can't await onSnapshot; instead we use set/update with merge based on current assumption.
      // This component relies on Firestore listener to correct final state.

      if (nextLiked) {
        await setDoc(
          ref,
          { likes: count + 1, users: [user.id] },
          { merge: true }
        );
      } else {
        await updateDoc(ref, { likes: Math.max(0, count - 1) });
        await setDoc(ref, { users: [] }, { merge: true });
      }

      trackEvent('like_toggle', {
        item_id: itemId,
        liked: nextLiked,
      });
    } catch (e) {
      // Rollback optimistic UI; listener will also correct.
      applyOptimistic(prevLiked);
      // eslint-disable-next-line no-console
      console.error('Like toggle failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={!user || isSyncing}
      className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
        liked ? 'border-sura-gold bg-sura-gold/20 text-sura-gold' : 'border-sura-sky/20 bg-white/80 text-sura-navy/80 hover:border-sura-gold/60'
      } disabled:opacity-60`}
      aria-pressed={liked}
    >
      {liked ? '❤️' : '🤍'} {count}
    </button>
  );
}

