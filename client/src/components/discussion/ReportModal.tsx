import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { reportMessage } from '../../services/discussionService';

interface ReportModalProps {
  roomId: string;
  reportedUserId: string;
  reportedUserName: string;
  commentId?: string;
  onClose: () => void;
  onReported?: () => void;
}

const REASONS = [
  'Spam',
  'Harassment',
  'Hate speech',
  'Inappropriate content',
  'Misinformation',
  'Other',
];

/**
 * Accessible modal for reporting a message/member within a live room.
 * Implements role="dialog", aria-modal, Esc-to-close, and returns focus
 * to the trigger on close (handled by parent via onClose).
 */
export function ReportModal({
  roomId,
  reportedUserId,
  reportedUserName,
  commentId,
  onClose,
  onReported,
}: ReportModalProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';
  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Focus the close button on mount for keyboard users
    closeRef.current?.focus();
    // Lock body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError('');
    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      setError(isArabic ? 'يرجى إدخال سبب التبليغ' : 'Please provide a reason');
      setSubmitting(false);
      return;
    }
    try {
      await reportMessage(roomId, {
        commentId,
        reportedUserId,
        reason: finalReason,
      });
      onReported?.();
      onClose();
    } catch {
      setError(isArabic ? 'فشل الإرسال، حاول مرة أخرى' : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'الإبلاغ عن محتوى' : 'Report content'}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md rounded-3xl border border-sura-ivory/10 bg-sura-ink p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-inter text-lg font-semibold text-sura-ivory">
            {isArabic ? 'الإبلاغ عن محتوى' : 'Report content'}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-sura-ivory/60 hover:bg-white/5 hover:text-sura-ivory"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-sura-ivory/60">
          {isArabic ? `تقرير عن: ${reportedUserName}` : `Reporting: ${reportedUserName}`}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div role="radiogroup" aria-label={isArabic ? 'سبب التبليغ' : 'Reason'} className="space-y-2">
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm text-sura-ivory/80">
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-sura-teal"
                />
                {isArabic
                  ? ({
                      Spam: 'رسائل مزعجة',
                      Harassment: 'تحرش',
                      'Hate speech': 'خطاب كراهية',
                      'Inappropriate content': 'محتوى غير لائق',
                      Misinformation: 'معلومات مضللة',
                      Other: 'أخرى',
                    }[r] ?? r)
                  : r}
              </label>
            ))}
          </div>

          {reason === 'Other' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              placeholder={isArabic ? 'اشرح السبب...' : 'Explain the reason...'}
              className="w-full resize-none rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 p-3 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
            />
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-sura-ivory/20 px-4 py-2 text-sm text-sura-ivory/70 hover:bg-white/5"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {submitting ? '…' : isArabic ? 'إرسال التبليغ' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;
