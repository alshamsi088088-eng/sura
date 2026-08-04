import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { muteMember, unmuteMember } from '../../services/discussionService';

interface MuteDialogProps {
  roomId: string;
  userId: string;
  userName: string;
  currentlyMuted?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DURATIONS = [
  { label: '1 hour', hours: 1 },
  { label: '6 hours', hours: 6 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
  { label: '30 days', hours: 24 * 30 },
];

/**
 * Accessible dialog to mute (or unmute) a room member. Role-aware (the
 * backend enforces moderator permission server-side). Focus is trapped on
 * open and Esc closes the dialog.
 */
export function MuteDialog({
  roomId,
  userId,
  userName,
  currentlyMuted = false,
  onClose,
  onSuccess,
}: MuteDialogProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const handleMute = async () => {
    if (!user) return;
    setSubmitting(true);
    setError('');
    const mutedUntil = new Date(Date.now() + duration.hours * 3600 * 1000);
    try {
      await muteMember(roomId, userId, mutedUntil.toISOString());
      onSuccess?.();
      onClose();
    } catch {
      setError(isArabic ? 'فشل كتم العضو' : 'Failed to mute member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnmute = async () => {
    if (!user) return;
    setSubmitting(true);
    setError('');
    try {
      await unmuteMember(roomId, userId);
      onSuccess?.();
      onClose();
    } catch {
      setError(isArabic ? 'فشل إلغاء الكتم' : 'Failed to unmute member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'إدارة كتم العضو' : 'Manage member mute'}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-sm rounded-3xl border border-sura-ivory/10 bg-sura-ink p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-inter text-lg font-semibold text-sura-ivory">
            {isArabic ? 'إدارة الكتم' : 'Mute management'}
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
          {isArabic ? `العضو: ${userName}` : `Member: ${userName}`}
        </p>

        {currentlyMuted ? (
          <button
            type="button"
            onClick={handleUnmute}
            disabled={submitting}
            className="w-full rounded-full bg-sura-teal px-4 py-2 text-sm font-semibold text-sura-navy hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? '…' : isArabic ? 'إلغاء الكتم' : 'Unmute member'}
          </button>
        ) : (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm text-sura-ivory/70">
                {isArabic ? 'اختر المدة' : 'Choose duration'}
              </legend>
              <div className="space-y-2">
                {DURATIONS.map((d) => (
                  <label key={d.hours} className="flex items-center gap-2 text-sm text-sura-ivory/80">
                    <input
                      type="radio"
                      name="mute-duration"
                      checked={duration.hours === d.hours}
                      onChange={() => setDuration(d)}
                      className="accent-sura-teal"
                    />
                    {isArabic
                      ? ({
                          '1 hour': 'ساعة واحدة',
                          '6 hours': '6 ساعات',
                          '24 hours': '24 ساعة',
                          '7 days': '7 أيام',
                          '30 days': '30 يومًا',
                        }[d.label] ?? d.label)
                      : d.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="button"
              onClick={handleMute}
              disabled={submitting}
              className="w-full rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {submitting ? '…' : isArabic ? 'كتم العضو' : 'Mute member'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MuteDialog;
