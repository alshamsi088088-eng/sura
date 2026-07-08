import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { getApiBaseUrl } from '../lib/runtimeConfig';
import { supabase } from '../lib/supabaseClient';


const API_URL = getApiBaseUrl();

async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    const token = data?.session?.access_token ?? null;

    return token;
  } catch {
    return null;
  }
}

const WEEKLY_TARGET_KEY = 'sura_weekly_target';
const WEEKLY_READING_KEY = 'sura_weekly_reading';

interface WeeklyData {
  articles: number;
  chapters: number;
  date: string;
}

function loadWeeklyReadingFromLocalStorage(): WeeklyData {
  try {
    const key = `${WEEKLY_READING_KEY}_${new Date().toISOString().slice(0, 7)}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { articles: 0, chapters: 0, date: new Date().toISOString() };
  } catch {
    return { articles: 0, chapters: 0, date: new Date().toISOString() };
  }
}

function loadTargetFromLocalStorage(): number {
  try {
    const data = localStorage.getItem(WEEKLY_TARGET_KEY);
    return data ? JSON.parse(data).target || 5 : 5;
  } catch {
    return 5;
  }
}

function saveTargetToLocalStorage(target: number) {
  try {
    localStorage.setItem(WEEKLY_TARGET_KEY, JSON.stringify({ target, updatedAt: new Date().toISOString() }));
  } catch {
    // Ignore
  }
}

export function WeeklyTargetBanner() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [target, setTarget] = useState(5);
  const [weeklyData, setWeeklyData] = useState<WeeklyData>({ articles: 0, chapters: 0, date: '' });
  const [loading, setLoading] = useState(false);


  useEffect(() => {

    const savedTarget = loadTargetFromLocalStorage();
    setTarget(savedTarget);

    const savedWeekly = loadWeeklyReadingFromLocalStorage();
    setWeeklyData(savedWeekly);

    if (!user) return;

    // Sync from API if logged in
    const fetchTarget = async () => {
      try {
        const token = await getSupabaseAccessToken();
        const res = await fetch(`${API_URL}/api/weekly-target`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.target) {
            setTarget(data.target);
            saveTargetToLocalStorage(data.target);
          }
          if (typeof data.articles === 'number' || typeof data.chapters === 'number') {
            setWeeklyData({
              articles: data.articles || 0,
              chapters: data.chapters || 0,
              date: data.date || new Date().toISOString()
            });
          }
          return;
        }
      } catch {
        // Keep the local weekly state when the backend is unavailable.
      }

      const savedWeekly = loadWeeklyReadingFromLocalStorage();
      setWeeklyData(savedWeekly);
    };

    fetchTarget();
  }, [user?.id]);

  const progress = weeklyData.articles + weeklyData.chapters;
  const percent = Math.min(100, Math.round((progress / (target || 1)) * 100));
  const completed = progress >= target;

  const updateTarget = async (value: number) => {

    setLoading(true);
    setTarget(value);
    saveTargetToLocalStorage(value);

    if (user) {
      try {
        const token = await getSupabaseAccessToken();
        await fetch(`${API_URL}/api/weekly-target`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            target: value,
            articles: weeklyData.articles,
            chapters: weeklyData.chapters
          })
        });
      } catch (error) {
        console.error('Failed to update weekly target', error);
      }
    }
    setLoading(false);
  };

  return (
    <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-widest text-[#7F77DD]">
            {locale === 'ar' ? 'هدف القراءة الأسبوعي' : 'WEEKLY READING TARGET'}
          </div>
          <h2 className="text-2xl font-bold text-sura-ivory">
            {locale === 'ar' ? 'ابقَ على المسار' : 'Stay on track'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-sura-ivory/60">
            {locale === 'ar'
              ? 'حدد هدفك الأسبوعي وسجّل تقدمك خلال المقالات والروايات.'
              : 'Set your weekly reading goal and keep your progress visible across articles and novels.'}
          </p>
        </div>
        <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ivory/5 p-5 text-center">
          <div className="mb-2 text-xs text-sura-ivory/50">
            {locale === 'ar' ? 'نشاطك هذا الأسبوع' : 'Your activity this week'}
          </div>
          <div className="font-serif text-3xl font-bold text-[#7F77DD]">
            {progress}/{target}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full border border-sura-ivory/10 bg-sura-ivory/5">
            <div
              className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-center gap-3 text-xs text-sura-ivory/50">
            <span>{weeklyData.articles} {locale === 'ar' ? 'مقالات' : 'articles'}</span>
            <span>•</span>
            <span>{weeklyData.chapters} {locale === 'ar' ? 'فصول' : 'chapters'}</span>
          </div>
          <div className="mt-2 text-xs text-sura-ivory/40">
            {completed
              ? (locale === 'ar' ? '🎉 الهدف حقق! 🎉' : '🎉 Goal achieved! 🎉')
              : `${percent}% ${locale === 'ar' ? 'متبقي' : 'remaining'}`}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[5, 7, 10, 12].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => updateTarget(value)}
                disabled={loading || target === value}
                className="rounded-full border border-[#7F77DD]/30 bg-transparent px-3 py-1.5 text-xs text-[#7F77DD] transition hover:bg-[#7F77DD]/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}