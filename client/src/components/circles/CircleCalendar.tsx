import { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { fetchCalendar, type CalendarResponse } from '../../services/studyCircleService';

interface CircleCalendarProps {
  circleId: string;
  isModerator?: boolean;
}

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/**
 * Circle agenda — combines weekly schedule, upcoming assignment due
 * dates, and goal weeks into a single readable calendar list.
 */
export function CircleCalendar({ circleId, isModerator = false }: CircleCalendarProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [data, setData] = useState<CalendarResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchCalendar(circleId);
        if (mounted) setData(res);
      } catch {
        if (mounted) setData(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [circleId]);

  if (!data) {
    return (
      <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-4 text-sm text-sura-ivory/50">
        {isArabic ? 'لا يوجد جدول بعد' : 'No schedule yet'}
      </div>
    );
  }

  const schedule = data.schedule;
  const hasAssignments = (data.assignments ?? []).length > 0;
  const hasGoals = (data.goals ?? []).length > 0;

  return (
    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-4">
      <h3 className="mb-3 font-inter text-sm font-semibold text-sura-ivory">
        {isArabic ? 'التقويم' : 'Calendar'}
        {isModerator ? ' ⚙' : ''}
      </h3>

      {/* Weekly schedule */}
      {schedule && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-sura-teal/20 bg-sura-teal/5 px-3 py-2">
          <span className="text-sura-teal" aria-hidden="true">
            🗓
          </span>
          <span className="text-sm text-sura-ivory/80">
            {isArabic ? 'اللقاء الأسبوعي' : 'Weekly session'}:{' '}
            <strong>
              {(isArabic ? DAY_NAMES_AR : DAY_NAMES_EN)[schedule.dayOfWeek - 1] ?? schedule.dayOfWeek}
            </strong>{' '}
            {schedule.timeOfDay || (isArabic ? 'مساءً' : 'evening')}
          </span>
        </div>
      )}

      {!hasAssignments && !hasGoals && (
        <p className="text-xs text-sura-ivory/50">
          {isArabic ? 'لا توجد أحداث مجدولة' : 'No upcoming events'}
        </p>
      )}

      {/* Assignments */}
      {hasAssignments && (
        <div className="mb-3">
          <h4 className="mb-1.5 text-xs uppercase tracking-wide text-sura-ivory/50">
            {isArabic ? 'الواجبات' : 'Assignments'}
          </h4>
          <ul className="space-y-1">
            {data.assignments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm text-sura-ivory/75">
                <span className="text-sura-gold" aria-hidden="true">
                  📝
                </span>
                <span className="truncate">{a.title}</span>
                {a.dueDate && (
                  <span className="ml-auto shrink-0 text-xs text-sura-ivory/50">
                    {new Date(a.dueDate).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Goals by week */}
      {hasGoals && (
        <div>
          <h4 className="mb-1.5 text-xs uppercase tracking-wide text-sura-ivory/50">
            {isArabic ? 'الأهداف' : 'Goals'}
          </h4>
          <ul className="space-y-1">
            {data.goals.map((g) => (
              <li key={g.id} className="flex items-center gap-2 text-sm text-sura-ivory/75">
                <span className="text-sura-teal" aria-hidden="true">
                  🎯
                </span>
                <span className="truncate">{g.title}</span>
                <span className="ml-auto shrink-0 text-xs text-sura-ivory/50">
                  {g.week} · {g.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CircleCalendar;
