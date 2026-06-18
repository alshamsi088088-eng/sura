import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface LikeShareBarProps {
  contentId: string;
}

interface EngagementCounts {
  likes: number;
  shares: number;
}

export function LikeShareBar({ contentId }: LikeShareBarProps) {
  const [counts, setCounts] = useState<EngagementCounts>({ likes: 0, shares: 0 });

  useEffect(() => {
    const docRef = doc(db, 'engagement', contentId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      setCounts({ likes: data?.likes || 0, shares: data?.shares || 0 });
    });
    return () => unsubscribe();
  }, [contentId]);

  const incrementField = async (field: 'likes' | 'shares') => {
    const docRef = doc(db, 'engagement', contentId);
    await setDoc(docRef, { [field]: increment(1) }, { merge: true });
  };

  const debounce = <F extends (...args: unknown[]) => void>(func: F, wait: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleLike = useMemo(() => debounce(() => incrementField('likes'), 300), [contentId]);
  const handleShare = useMemo(() => debounce(() => incrementField('shares'), 300), [contentId]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-sura-navy/80">
      <button onClick={handleLike} className="rounded-full border border-sura-sky/20 bg-white/80 px-3 py-2 transition hover:border-sura-gold/50 hover:text-sura-navy">
        Like • {counts.likes}
      </button>
      <button onClick={handleShare} className="rounded-full border border-sura-sky/20 bg-white/80 px-3 py-2 transition hover:border-sura-gold/50 hover:text-sura-navy">
        Share • {counts.shares}
      </button>
    </div>
  );
}
