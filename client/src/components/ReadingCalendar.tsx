import { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { fetchReadingCalendar } from '../services/readerService';
import type { CalendarDay } from '../services/readerService';

interface ReadingCalendarProps {
  userId: string;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function ReadingCalendar({ userId }: ReadingCalendarProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const data = await fetchReadingCalendar(selectedYear);
        setCalendarData(data);
      } catch (err) {
        console.error('Failed to load calendar:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
      </div>
    );
  }

  // Group by month
  const monthGroups = new Map<string, CalendarDay[]>();
  calendarData.forEach((day) => {
    const month = day.date.slice(0, 7);
    if (!monthGroups.has(month)) monthGroups.set(month, []);
    monthGroups.get(month)!.push(day);
  });

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-sura-ivory/5';
      case 1: return 'bg-[#7F77DD]/20';
      case 2: return 'bg-[#7F77DD]/40';
      case 3: return 'bg-[#7F77DD]/60';
      case 4: return 'bg-[#7F77DD]/90';
      default: return 'bg-sura-ivory/5';
    }
  };

  const getIntensityLabel = (level: number) => {
    if (level === 0) return isArabic ? 'لا توجد قراءة' : 'No reading';
    if (level === 1) return isArabic ? '1 مقال' : '1 article';
    if (level <= 2) return isArabic ? '2-3 مقالات' : '2-3 articles';
    if (level <= 3) return isArabic ? '4-5 مقالات' : '4-5 articles';
    return isArabic ? '6+ مقالات' : '6+ articles';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-sura-ivory">
          {isArabic ? 'تقويم القراءة' : 'Reading Calendar'}
        </h3>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          className="rounded-lg border border-sura-ivory/10 bg-sura-dark/50 px-3 py-1.5 text-sm text-sura-ivory"
        >
          {[2024, 2025, 2026].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="flex gap-2">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pt-5">
              {(isArabic ? DAYS_AR : DAYS_EN).map((day, i) => (
                <div key={i} className="h-3 text-xs text-sura-ivory/40">
                  {i % 2 === 0 ? day : ''}
                </div>
              ))}
            </div>

            {/* Month columns */}
            {[...monthGroups.entries()].map(([month, days]) => {
              const monthIndex = parseInt(month.split('-')[1], 10) - 1;
              const monthName = isArabic ? MONTHS_AR[monthIndex] : MONTHS_EN[monthIndex];
              // Get first day of month
              const firstDay = new Date(days[0]?.date || `${month}-01`);
              const startPad = firstDay.getDay();

              return (
                <div key={month} className="flex-1">
                  <div className="mb-1 text-center text-xs text-sura-ivory/60">
                    {monthName}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {/* Padding cells */}
                    {Array.from({ length: startPad }).map((_, i) => (
                      <div key={`pad-${i}`} className="h-3 w-3" />
                    ))}
                    {days.map((day) => (
                      <div
                        key={day.date}
                        className={`h-3 w-3 rounded-sm ${getLevelColor(day.level)}`}
                        title={`${day.date}: ${day.count} ${isArabic ? 'قراءة' : 'reads'}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-sura-ivory/50">
        <span>{isArabic ? 'أقل' : 'Less'}</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`h-3 w-3 rounded-sm ${getLevelColor(level)}`} />
        ))}
        <span>{isArabic ? 'أكثر' : 'More'}</span>
      </div>
    </div>
  );
}
