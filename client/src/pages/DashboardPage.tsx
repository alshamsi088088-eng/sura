
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

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

const WEEKLY_READING_KEY = 'sura_weekly_reading';
const PROGRESS_KEY = 'sura_reading_progress';

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

  useEffect(() => {
    // Load history from API
    axios.get('/api/dashboard').then((res) => setHistory(res.data.history)).catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    // Load reading data from localStorage (offline support)
    const weekly = loadWeeklyData();
    setWeeklyData(weekly);
    const recent = loadLastRead();
    setLastRead(recent);
  }, []);

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
      <div className="grid gap-4 sm:grid-cols-4">
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
          <div className="mt-2 font-serif text-2xl font-bold text-sura-ivory">{weeklyData.articles}</div>
          <div className="text-xs text-sura-ivory/50">{locale === 'ar' ? 'مكتملة' : 'completed'}</div>
        </div>
        <div className="rounded-2xl border border-[#7F77DD]/30 bg-sura-dark/90 p-5 text-center">
          <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
            {locale === 'ar' ? 'الفصول' : 'Chapters'}
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-sura-ivory">{weeklyData.chapters}</div>
          <div className="text-xs text-sura-ivory/50">{locale === 'ar' ? 'مكتملة' : 'completed'}</div>
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
