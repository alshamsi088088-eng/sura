import { FormEvent, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import {
  createGoal,
  updateGoalProgress,
  type CircleGoal,
} from '../../services/studyCircleService';

interface CircleGoalsPanelProps {
  circleId: string;
  goals: CircleGoal[];
  isMember?: boolean;
  onGoalsChange?: (goals: CircleGoal[]) => void;
}

const currentWeekISO = () => {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  return monday.toISOString().slice(0, 10);
};

/**
 * Weekly goals with progress bars. Any member can add a goal; the goal
 * creator or a moderator can update progress.
 */
export function CircleGoalsPanel({ circleId, goals, isMember = false, onGoalsChange }: CircleGoalsPanelProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const week = currentWeekISO();

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSubmitting(true);
    try {
      const goal = await createGoal(circleId, {
        title: title.trim(),
        target: Math.max(1, parseInt(target, 10) || 1),
        week,
      });
      onGoalsChange?.([goal, ...goals]);
      setTitle('');
      setTarget('10');
      setShowForm(false);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleProgress = async (goalId: string, progress: number) => {
    try {
      const updated = await updateGoalProgress(goalId, progress);
      onGoalsChange?.(goals.map((g) => (g.id === goalId ? updated : g)));
    } catch {
      // ignore
    }
  };

  const canUpdate = (goal: CircleGoal) => {
    if (!user) return false;
    if (goal.createdBy === user.id) return true;
    // Check role via goals' relation is not available here; backend enforces it.
    return false;
  };

  return (
    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-inter text-sm font-semibold text-sura-ivory">
          {isArabic ? 'الأهداف الأسبوعية' : 'Weekly goals'}
        </h3>
        {isMember && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-xs font-semibold text-sura-teal hover:underline"
          >
            {showForm ? (isArabic ? 'إلغاء' : 'Cancel') : isArabic ? '+ إضافة هدف' : '+ Add goal'}
          </button>
        )}
      </div>

      {showForm && isMember && (
        <form onSubmit={handleCreate} className="mb-4 space-y-2 rounded-xl border border-sura-ivory/10 p-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isArabic ? 'عنوان الهدف' : 'Goal title'}
            className="w-full rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={isArabic ? 'المستهدف' : 'Target'}
              className="w-24 rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
            />
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="rounded-full bg-sura-gold px-4 py-2 text-sm font-semibold text-sura-charcoal disabled:opacity-50"
            >
              {submitting ? '…' : isArabic ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="text-xs text-sura-ivory/50">{isArabic ? 'لا توجد أهداف بعد' : 'No goals yet'}</p>
      ) : (
        <ul className="space-y-3">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100));
            return (
              <li key={goal.id}>
                <div className="flex items-center justify-between text-sm text-sura-ivory/80">
                  <span className="truncate font-medium">{goal.title}</span>
                  <span className="shrink-0 text-xs text-sura-ivory/50">
                    {goal.progress}/{goal.target}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-sura-ivory/10">
                  <div
                    className="h-full rounded-full bg-sura-teal transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {canUpdate(goal) && (
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleProgress(goal.id, Math.max(0, goal.progress - 1))}
                      className="text-xs text-sura-ivory/40 hover:text-sura-ivory"
                      aria-label={isArabic ? 'إنقاص التقدم' : 'Decrease progress'}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProgress(goal.id, goal.progress + 1)}
                      className="text-xs text-sura-ivory/40 hover:text-sura-ivory"
                      aria-label={isArabic ? 'زيادة التقدم' : 'Increase progress'}
                    >
                      +
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default CircleGoalsPanel;
