import { useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, doc, getDoc, onSnapshot, query, setDoc, where, serverTimestamp } from 'firebase/firestore';

interface RatingStarsProps {
  entityId: string;
  entityType: 'article' | 'novel' | 'book';
}

export function RatingStars({ entityId, entityType }: RatingStarsProps) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [userScore, setUserScore] = useState(0);

  useEffect(() => {
    const currentUser = auth.currentUser;
    const ratingsQuery = query(
      collection(db, 'ratings'),
      where('entityId', '==', entityId),
      where('entityType', '==', entityType)
    );

    const unsubscribe = onSnapshot(ratingsQuery, async (snapshot) => {
      const values = snapshot.docs.map((doc) => (doc.data() as any).value || 0);
      const total = values.reduce((sum, next) => sum + next, 0);
      setAverage(values.length ? total / values.length : 0);
      setCount(values.length);
      if (currentUser) {
        const currentRatingRef = doc(db, 'ratings', `${currentUser.uid}_${entityId}`);
        const currentSnapshot = await getDoc(currentRatingRef);
        setUserScore((currentSnapshot.exists() ? (currentSnapshot.data() as any).value : 0) as number);
      }
    });

    return () => unsubscribe();
  }, [entityId, entityType]);

  const stars = useMemo(() => Array.from({ length: 5 }, (_, index) => index + 1), []);

  const setRating = async (ratingValue: number) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const ratingRef = doc(db, 'ratings', `${currentUser.uid}_${entityId}`);
    try {
      await setDoc(ratingRef, {
        uid: currentUser.uid,
        entityId,
        entityType,
        value: ratingValue,
        createdAt: serverTimestamp()
      });
      setUserScore(ratingValue);
    } catch (error) {
      console.error('Rating save failed', error);
    }
  };

  return (
    <div className="space-y-2 text-sm text-sura-navy/80">
      <div className="flex items-center gap-1">
        {stars.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`text-xl transition ${userScore >= value ? 'text-sura-teal' : 'text-sura-navy/40 hover:text-sura-teal'}`}
            aria-label={`Rate ${value} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="text-xs text-sura-navy/60">{`${count} ratings • ${average.toFixed(1)} avg`}</div>
    </div>
  );
}
