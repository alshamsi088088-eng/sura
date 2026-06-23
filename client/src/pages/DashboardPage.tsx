
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';

interface WeeklyData {
  articles: number;
  chapters: number;
  date: string;
}

interface ReadingEntry {
  id: string;
  title: string;
  type: 'article' | 'novel';
  progress: number;
  lastRead: string;
}

interface UserContent {
  articles: number;
  novels: number;
  chapters: number;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
}

const WEEKLY_READING_KEY = 'sura_weekly_reading';
const PROGRESS_KEY = 'sura_reading_progress';
const READING_STREAK_KEY = 'sura_reading_streak';
const LAST_READ_DATE_KEY = 'sura_last_read_date';

function loadWeeklyData(): WeeklyData {
  try {
    const key = `${WEEKLY_READING_KEY}_${new Date().toISOString().slice(0, 7)}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { articles: 0, chapters: 0, date: new Date().toISOString() };
  } catch {
    return { articles: 0, chapters: 0, date: new Date().toISOString() };
  }
}

function loadLastRead(): ReadingEntry[] {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as Record<string, ReadingEntry>;
    return Object.entries(parsed)
      .map(([id, entry]) => ({ ...entry, id }))
      .sort((a, b) => new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime())
      .slice(0, 10);
  } catch {
    return [];
  }
}

function getReadingStreak(): { days: number; lastDate: string } {
  try {
    const streak = localStorage.getItem(READING_STREAK_KEY);
    const lastDate = localStorage.getItem(LAST_READ_DATE_KEY);
    const today = new Date().toDateString();
    if (lastDate === today) {
      return streak ? JSON.parse(streak) : { days: 0, lastDate: '' };
    }
    const last = lastDate ? new Date(lastDate) : null;
    if (!last) return { days: 0, lastDate: '' };
    const diff = Math.floor((new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 2) {
      return streak ? JSON.parse(streak) : { days: diff, lastDate: lastDate || '' };
    }
    return { days: 0, lastDate: '' };
  } catch {
    return { days: 0, lastDate: '' };
  }
}

function updateReadingStreak() {
  const today = new Date().toDateString();
  const streak = getReadingStreak();
  const newStreak = {
    days: streak.days + 1,
    lastDate: today
  };
  localStorage.setItem(READING_STREAK_KEY, JSON.stringify(newStreak));
  localStorage.setItem(LAST_READ_DATE_KEY, today);
}

function generateWeeklyChartData(localeValue: string): { day: string; articles: number; chapters: number }[] {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = `${WEEKLY_READING_KEY}_${date.toISOString().slice(0, 7)}`;
    const dayData = { day: date.toLocaleDateString(localeValue === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' }), articles: 0, chapters: 0 };
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        dayData.articles = parsed.articles || 0;
        dayData.chapters = parsed.chapters || 0;
      }
    } catch {
      // Ignore
    }
    days.push(dayData);
  }
  return days;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [history, setHistory] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData>({ articles: 0, chapters: 0, date: '' });
  const [lastRead, setLastRead] = useState<ReadingEntry[]>([]);
  const [userContent, setUserContent] = useState<UserContent>({ articles: 0, novels: 0, chapters: 0 });
  const [streak, setStreak] = useState({ days: 0, lastDate: '' });
  const [badges, setBadges] = useState<Badge[]>([
    { id: 'first_article', name: locale === 'ar' ? 'كاتب جديد' : 'New Writer', icon: '✍️', earned: false },
    { id: 'reading_streak', name: locale === 'ar' ? '7 أيام قراءة' : '7 Day Reader', icon: '🔥', earned: false },
    { id: 'bookworm', name: locale === 'ar' ? 'مدمن قراءة' : 'Bookworm', icon: '📚', earned: false },
    { id: 'collector', name: locale === 'ar' ? 'جامع كتب' : 'Collector', icon: '📦', earned: false },
  ]);

  useEffect(() => {
    // Load history from API
    axios.get('/api/dashboard').then((res) => setHistory(res.data.history || [])).catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    // Load reading data from localStorage (offline support)
    const weekly = loadWeeklyData();
    setWeeklyData(weekly);
    const recent = loadLastRead();
    setLastRead(recent);
    const s = getReadingStreak();
    setStreak(s);
    updateReadingStreak();
  }, []);

  useEffect(() => {
    // Load user content from Supabase
    if (!user || !supabase) return;
    const loadUserContent = async () => {
      const { data: articles } = await supabase!.from('Article').select('id').eq('authorId', user.id);
      const { data: novels } = await supabase!.from('Novel').select('id').eq('authorId', user.id);
      const { data: chapters } = await supabase!.from('Chapter').select('id');
      setUserContent({
        articles: articles?.length || 0,
        novels: novels?.length || 0,
        chapters: chapters?.length || 0
      });
    };
    loadUserContent();
  }, [user]);

  // Update badges based on achievements
  useEffect(() => {
    const updated = [...badges];
    const articleCount = userContent?.articles ?? 0;
    const novelCount = userContent?.novels ?? 0;
    const streakDays = streak?.days ?? 0;

    if (articleCount >= 1) {
      const badge = updated.find(b => b.id === 'first_article');
      if (badge) badge.earned = true;
    }
    if (streakDays >= 7) {
      const badge = updated.find(b => b.id === 'reading_streak');
      if (badge) badge.earned = true;
    }
    if (articleCount >= 5) {
      const badge = updated.find(b => b.id === 'bookworm');
      if (badge) badge.earned = true;
    }
    if ((articleCount + novelCount) >= 10) {
      const badge = updated.find(b => b.id === 'collector');
      if (badge) badge.earned = true;
    }
    setBadges(updated);
  }, [userContent, streak]);

  const chartData = useMemo(() => generateWeeklyChartData(locale), [locale]);
  const totalWeekly = weeklyData.articles + weeklyData.chapters;
  const totalRead = lastRead.length;
  const maxChartValue = Math.max(...chartData.map(d => d.articles + d.chapters), 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-8">
        <h1 className="text-4xl font-semibold text-sura-ivory">
          {locale === 'ar' ? 'لوحة الأعضاء' : 'Member Dashboard'}
        </h1>
        <p className="mt-3 text-sm leading-7 text-sura-ivory/60">
          {locale === 'ar'
            ? 'مركز تحكمك الشخصي للكتب والمفضلات والمشتريات.'
            : 'Your hub for bookmarks, reading progress, and purchases.'}
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
        <div className="rounded-2xl border border-[#7F77DD]/30 bg-sura-dark/90 p-5 text-center">
          <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
            {locale === 'ar' ? 'هذا الأسبوع' : 'This Week'}
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-sura-ivory">{totalWeekly}</div>
          <div className="text-xs text-sura-ivory/50">{locale === 'ar' ? 'مقال/فصل' : 'items read'}</div>
        </div>
        <div className="rounded-2xl border border-[#7F77DD]/30 bg-sura-dark/90 p-5 text-center">
          <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
            {locale === 'ar' ? 'المقالات' : 'Articles'}
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-sura-ivory">{userContent?.articles ?? 0}</div>
          <div className="text-xs text-sura-ivory/50">{locale === 'ar' ? 'مقالات لك' : 'your articles'}</div>
        </div>
        <div className="rounded-2xl border border-[#7F77DD]/30 bg-sura-dark/90 p-5 text-center">
          <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
            {locale === 'ar' ? 'الروايات' : 'Novels'}
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-sura-ivory">{userContent?.novels ?? 0}</div>
          <div className="text-xs text-sura-ivory/50">{locale === 'ar' ? 'روايات لك' : 'your novels'}</div>
        </div>
        <div className="rounded-2xl border border-[#7F77DD]/30 bg-sura-dark/90 p-5 text-center">
          <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
            {locale === 'ar' ? 'سلسلة القراءة' : 'Reading Streak'}
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-sura-ivory">{streak?.days ?? 0}</div>
          <div className="text-xs text-sura-ivory/50">{locale === 'ar' ? 'أيام متتالية' : 'days in a row'}</div>
        </div>
        <div className="rounded-2xl border border-[#7F77DD]/30 bg-sura-dark/90 p-5 text-center">
          <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
            {locale === 'ar' ? 'الإجمالي' : 'Total'}
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-sura-ivory">{totalRead}</div>
          <div className="text-xs text-sura-ivory/50">{locale === 'ar' ? 'عنوان مقروء' : 'titles read'}</div>
        </div>
      </div>

      {/* Weekly Chart */}
      <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-sura-ivory">
          {locale === 'ar' ? 'القراءة الأسبوعية' : 'Weekly Reading'}
        </h2>
        <div className="mt-6 flex h-40 items-end gap-2">
          {chartData.map((day, i) => {
            const value = day.articles + day.chapters;
            const height = Math.max(4, (value / maxChartValue) * 100);
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-sm bg-[#7F77DD]/60 transition-all duration-300" style={{ height: `${height}%` }}>
                  {value > 0 && (
                    <div className="text-center text-xs font-bold text-sura-dark">
                      {value}
                    </div>
                  )}
                </div>
                <div className="text-xs text-sura-ivory/50">{day.day}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center gap-6 text-xs text-sura-ivory/50">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#7F77DD]/60" />
            <span>{locale === 'ar' ? 'المقالات' : 'Articles'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#7F77DD]/30" />
            <span>{locale === 'ar' ? 'الفصول' : 'Chapters'}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile */}
        <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7F77DD]/20 text-2xl font-bold text-[#7F77DD]">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-xl font-semibold text-sura-ivory">{user?.name}</div>
              <div className="text-sm text-sura-ivory/60">{user?.role}</div>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm text-sura-ivory/60">
            <div>{locale === 'ar' ? 'البريد الإلكتروني:' : 'Email:'} {user?.email}</div>
            <div>{locale === 'ar' ? 'اللغة' : 'Language'}: {user?.locale.toUpperCase()} / {user?.theme}</div>
          </div>
        </section>

        {/* Last Read */}
        <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-8">
          <h2 className="text-xl font-semibold text-sura-ivory">
            {locale === 'ar' ? 'آخر قراءة' : 'Last Read'}
          </h2>
          <div className="mt-4 space-y-3">
            {lastRead.length === 0 ? (
              <div className="text-sm text-sura-ivory/50">
                {locale === 'ar' ? 'لا توجد قراءات بعد.' : 'No reading history yet.'}
              </div>
            ) : (
              lastRead.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg bg-sura-ivory/5 p-3">
                  <div>
                    <div className="text-sm font-medium text-sura-ivory">{entry.title}</div>
                    <div className="text-xs text-sura-ivory/50">
                      {entry.type === 'article' ? (locale === 'ar' ? 'مقال' : 'Article') : (locale === 'ar' ? 'رواية' : 'Novel')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#7F77DD]">{entry.progress}%</div>
                    <div className="text-xs text-sura-ivory/50">
                      {new Date(entry.lastRead).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Badges */}
      <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-8">
        <h2 className="text-xl font-semibold text-sura-ivory">
          {locale === 'ar' ? 'الإنجازات' : 'Achievements'}
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
                badge.earned
                  ? 'border-[#7F77DD]/50 bg-[#7F77DD]/10'
                  : 'border-[#7F77DD]/20 bg-sura-dark/50 opacity-50'
              }`}
            >
              <div className="text-3xl">{badge.icon}</div>
              <div className={`text-sm font-medium ${badge.earned ? 'text-sura-ivory' : 'text-sura-ivory/50'}`}>
                {badge.name}
              </div>
              {badge.earned && (
                <div className="text-xs text-[#7F77DD]">
                  {locale === 'ar' ? '✓ محقق' : '✓ Earned'}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      {history.length > 0 && (
        <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-8">
          <h2 className="text-xl font-semibold text-sura-ivory">
            {locale === 'ar' ? 'الأنشطة الأخيرة' : 'Recent Activity'}
          </h2>
          <div className="mt-4 space-y-3 text-sm text-sura-ivory/60">
            {history.map((entry, i) => (
              <div key={i} className="border-b border-sura-ivory/10 pb-2">{entry}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
