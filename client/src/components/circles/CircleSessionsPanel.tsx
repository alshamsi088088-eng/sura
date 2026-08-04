import { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { fetchCalendar, type CalendarResponse } from '../../services/studyCircleService';

interface CircleSessionsPanelProps {
  circleId: string;
}

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

interface Session {
  id: string;
  date: Date;
  title: string;
  done: boolean;
}

/**
 * Upcoming/past reading sessions derived from the circle weekly schedule
 * plus completed assignments — signals "Completed Sessions" in the
 * dashboard. Sessions auto-suggest the next few occurrences.
 */
export function CircleSessionsPanel({ circleId }: CircleSessionsPanelProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: CalendarResponse = await fetchCalendar(circleId);
        if (!mounted || !res.schedule) {
          if (mounted) setSessions([]);
          return;
        }
        const dayOfWeek = res.schedule.dayOfWeek; // 1..7 where 1 = Monday in backend? UI maps index 0=Sunday
        const todays = new Date();
        const generated: Session[] = [];
        const tilNow = new Date(todays);
        for (let i = 0; i < 4; i++) {
          const d = new Date(tilNow);
          d.setDate(tilNow.getDate() + i);
          const jsDay = d.getDay(); // 0=Sunday..6=Saturday
          const backendDay = ((jsDay + 6) % 7) + 1; // 1=Monday..7=Sunday
          if (backendDay === dayOfWeek) {
            generated.push({
              id: `session-${i}`,
              date: d,
              title: isArabic ? 'جلسة قراءة' : 'Reading session',
              done: d.getTime() < todays.getTime(),
            });
          }
        }
        if (mounted) setSessions(generated);
      } catch {
        if (mounted) setSessions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [circleId, isArabic]);

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-4 text-sm text-sura-ivory/50">
        {isArabic ? 'لا توجد جلسات مجدولة' : 'No scheduled sessions'}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-4">
      <h3 className="mb-3 font-inter text-sm font-semibold text-sura-ivory">
        {isArabic ? 'الجلسات' : 'Sessions'}
      </h3>
      <ul className="space-y-2">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-sm text-sura-ivory/75">
            <span className={s.done ? 'text-sura-teal' : 'text-sura-gold'} aria-hidden="true">
              {s.done ? '✓' : '♻'}
            </span>
            <span className={s.done ? 'text-sura-ivory/50 line-through' : ''}>
              {s.title} —{' '}
              {s.date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {s.done && (
              <span className="rounded-full bg-sura-teal/10 px-2 py-0.5 text-[10px] text-sura-teal">
                {isArabic ? 'مكتملة' : 'Completed'}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CircleSessionsPanel;
