import { FormEvent, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../AvatarUpload';
import {
  createAssignment,
  submitAssignment,
  scoreSubmission,
  type CircleAssignment,
} from '../../services/studyCircleService';

interface CircleAssignmentsPanelProps {
  circleId: string;
  assignments: CircleAssignment[];
  canManage?: boolean; // owner/moderator
  isMember?: boolean;
  onAssignmentsChange?: (assignments: CircleAssignment[]) => void;
}

/**
 * Assignments list with submissions + scoring. Owner/moderators can
 * create assignments and score submissions; members can submit work.
 */
export function CircleAssignmentsPanel({
  circleId,
  assignments,
  canManage = false,
  isMember = false,
  onAssignmentsChange,
}: CircleAssignmentsPanelProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openAssignment, setOpenAssignment] = useState<string | null>(null);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSubmitting(true);
    try {
      const assignment = await createAssignment(circleId, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
      });
      onAssignmentsChange?.([assignment, ...assignments]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowForm(false);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitWork = async (assignmentId: string, content: string) => {
    if (!user || !content.trim()) return;
    try {
      await submitAssignment(assignmentId, content.trim());
      setOpenAssignment(null);
    } catch {
      // ignore
    }
  };

  const handleScore = async (submissionId: string, score: string) => {
    const value = parseInt(score, 10);
    if (Number.isNaN(value)) return;
    try {
      await scoreSubmission(submissionId, value);
      setOpenAssignment(null);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-inter text-sm font-semibold text-sura-ivory">
          {isArabic ? 'الواجبات' : 'Assignments'}
        </h3>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-xs font-semibold text-sura-teal hover:underline"
          >
            {showForm ? (isArabic ? 'إلغاء' : 'Cancel') : isArabic ? '+ واجب' : '+ Assignment'}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleCreate} className="mb-4 space-y-2 rounded-xl border border-sura-ivory/10 p-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isArabic ? 'عنوان الواجب' : 'Assignment title'}
            className="w-full rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={isArabic ? 'الوصف' : 'Description'}
            className="w-full resize-none rounded-xl border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="rounded-full bg-sura-gold px-4 py-2 text-sm font-semibold text-sura-charcoal disabled:opacity-50"
          >
            {submitting ? '…' : isArabic ? 'نشر' : 'Post'}
          </button>
        </form>
      )}

      {assignments.length === 0 ? (
        <p className="text-xs text-sura-ivory/50">
          {isArabic ? 'لا توجد واجبات بعد' : 'No assignments yet'}
        </p>
      ) : (
        <ul className="space-y-3">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="rounded-xl border border-sura-ivory/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-inter text-sm font-semibold text-sura-ivory/85">{assignment.title}</h4>
                <span className="shrink-0 rounded-full bg-sura-ivory/10 px-2 py-0.5 text-[10px] text-sura-ivory/60">
                  {assignment.submissionCount ?? 0} {(isArabic ? 'تسليم' : 'submissions')}
                </span>
              </div>
              {assignment.description && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-sura-ivory/65">{assignment.description}</p>
              )}
              {assignment.dueDate && (
                <p className="mt-1 text-xs text-sura-ivory/45">
                  {isArabic ? 'الاستحقاق' : 'Due'}:{' '}
                  {new Date(assignment.dueDate).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                </p>
              )}

              {isMember && (
                <button
                  type="button"
                  onClick={() => setOpenAssignment(openAssignment === assignment.id ? null : assignment.id)}
                  className="mt-2 text-xs font-semibold text-sura-teal hover:underline"
                >
                  {openAssignment === assignment.id
                    ? isArabic ? 'إغلاق' : 'Close'
                    : isArabic ? 'تقديم العمل' : 'Submit work'}
                </button>
              )}

              {openAssignment === assignment.id && (
                <div className="mt-2 space-y-2 border-t border-sura-ivory/10 pt-2">
                  {/* My submission input */}
                  {isMember && (
                    <Form
                      onSubmit={(content) => handleSubmitWork(assignment.id, content)}
                      placeholder={isArabic ? 'اكتب إجابتك...' : 'Write your answer...'}
                      submitLabel={isArabic ? 'تسليم' : 'Submit'}
                    />
                  )}
                  {/* Submissions list (visible to moderators) */}
                  {canManage && assignment.submissions && assignment.submissions.length > 0 && (
                    <div className="space-y-2">
                      {assignment.submissions.map((sub) => (
                        <div key={sub.id} className="rounded-lg bg-sura-dark/60 p-2">
                          <div className="flex items-center gap-2">
                            <Avatar url={sub.user.avatar ?? undefined} name={sub.user.name} size="xs" />
                            <span className="flex-1 truncate text-xs text-sura-ivory/70">{sub.user.name}</span>
                            {sub.score !== null ? (
                              <span className="text-xs text-sura-gold">{sub.score}</span>
                            ) : (
                              <span className="text-xs text-sura-ivory/40">{isArabic ? 'غير مصحح' : 'Unscored'}</span>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-xs text-sura-ivory/60">{sub.content}</p>
                          {canManage && sub.score === null && (
                            <ScoreForm onScore={(score) => handleScore(sub.id, score)} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Form({
  onSubmit,
  placeholder,
  submitLabel,
}: {
  onSubmit: (content: string) => void;
  placeholder: string;
  submitLabel: string;
}) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value.trim());
        setValue('');
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-1.5 text-sm text-sura-ivory outline-none focus:border-sura-gold"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="rounded-full bg-sura-teal px-4 py-1.5 text-xs font-semibold text-sura-navy disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function ScoreForm({ onScore }: { onScore: (score: string) => void }) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;
        onScore(value.trim());
        setValue('');
      }}
      className="mt-1 flex items-center gap-2"
    >
      <label className="text-xs text-sura-ivory/50">{isArabic ? 'الدرجة' : 'Score'}</label>
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-3 py-1 text-sm text-sura-ivory outline-none focus:border-sura-gold"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="rounded-full bg-sura-gold px-3 py-1 text-xs font-semibold text-sura-charcoal disabled:opacity-50"
      >
        {isArabic ? 'حفظ' : 'Save'}
      </button>
    </form>
  );
}

export default CircleAssignmentsPanel;
