import { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

export function WeeklyTargetBanner() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [target, setTarget] = useState(5);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const targetRef = doc(db, 'weeklyTargets', currentUser.uid);
    const unsubscribe = onSnapshot(targetRef, (snapshot) => {
      const data = snapshot.exists() ? (snapshot.data() as any) : null;
      if (data?.target) setTarget(data.target);
      if (typeof data?.progress === 'number') setProgress(data.progress);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const updateTarget = async (value: number) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'weeklyTargets', currentUser.uid), {
        uid: currentUser.uid,
        target: value,
        progress,
        updatedAt: serverTimestamp()
      });
      setTarget(value);
    } catch (error) {
      console.error('Failed to update weekly target', error);
    } finally {
      setLoading(false);
    }
  };

  const percent = Math.min(100, Math.round((progress / (target || 1)) * 100));

  return (
    <section className="glass-card p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="eyebrow mb-3">{locale === 'ar' ? 'هدف القراءة الأسبوعي' : 'Weekly reading target'}</div>
          <h2 className="text-2xl font-bold text-sura-ink">{locale === 'ar' ? 'ابقَ على المسار' : 'Stay on track'}</h2>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-7 text-sura-ink/50">
            {locale === 'ar'
              ? 'حدد هدفك الأسبوعي وسجّل تقدمك خلال المقالات والروايات.'
              : 'Set your weekly reading goal and keep your progress visible across articles and novels.'}
          </p>
        </div>
        <div className="glass rounded-2xl !rounded-2xl p-5 text-center">
          <div className="font-sans text-xs text-sura-ink/45">{locale === 'ar' ? 'نشاطك هذا الأسبوع' : 'Your activity this week'}</div>
          <div className="mt-2 font-serif text-3xl font-bold text-sura-ink">{progress}/{target}</div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full border border-white/10 bg-white/5">
            <div className="h-full rounded-full bg-sura-sky/70" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-3 font-sans text-xs text-sura-ink/45">{percent}% {locale === 'ar' ? 'اكتمال الهدف' : 'goal complete'}</div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[5, 7, 10, 12].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => updateTarget(value)}
                disabled={loading}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 font-sans text-xs text-sura-ink/65 transition hover:border-sura-sky/40 hover:text-sura-ink"
              >
                {value} {locale === 'ar' ? 'يومًا' : 'items'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
