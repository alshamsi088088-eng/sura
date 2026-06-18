import { useEffect, useRef, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { trackReadingProgress } from '../lib/analytics';

interface ReadingProgressTrackerProps {
  entityId: string;
  entityType: 'article' | 'novel';
  contentId: string;
  currentStep: number;
  totalSteps: number;
}

export function ReadingProgressTracker({ entityId, entityType, contentId, currentStep, totalSteps }: ReadingProgressTrackerProps) {
  const [progress, setProgress] = useState(0);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const progressRef = doc(db, 'readingProgress', `${currentUser.uid}_${entityId}`);
    const unsubscribe = onSnapshot(progressRef, (snapshot) => {
      const value = snapshot.exists() ? (snapshot.data() as any).progress : 0;
      setProgress(value);
    });
    return () => unsubscribe();
  }, [entityId]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || totalSteps <= 0) return;
    const percentage = Math.min(100, Math.round((currentStep / totalSteps) * 100));
    setProgress(percentage);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const ref = doc(db, 'readingProgress', `${currentUser.uid}_${entityId}`);
        await setDoc(ref, {
          uid: currentUser.uid,
          entityId,
          entityType,
          currentStep,
          totalSteps,
          progress: percentage,
          updatedAt: serverTimestamp()
        });
        trackReadingProgress(entityId, entityType, percentage);
      } catch (error) {
        console.error('Failed to save reading progress', error);
      }
    }, 400);
  }, [currentStep, entityId, entityType, totalSteps]);

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;
    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const height = rect.height || 1;
      const offset = Math.min(Math.max(0, window.innerHeight - rect.top), window.innerHeight + height);
      const scrollPercent = Math.min(100, Math.round((offset / (height + window.innerHeight)) * 100));
      setProgress(scrollPercent);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [contentId]);

  return (
    <div className="rounded-3xl border border-sura-ivory/10 bg-sura-dark/80 p-4 text-sura-ivory/80">
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-sura-gold">
        <span>Reading progress</span>
        <span>{progress}%</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-sura-ivory/10">
        <div className="h-full rounded-full bg-sura-gold" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-xs text-sura-ivory/60">Track progress automatically while scrolling or switching chapters.</p>
    </div>
  );
}
