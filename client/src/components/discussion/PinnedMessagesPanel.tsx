import { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { Avatar } from '../AvatarUpload';
import { fetchPinnedMessages, unpinMessage, type ChatMessage } from '../../services/discussionService';
import { useAuth } from '../../context/AuthContext';

interface PinnedMessagesPanelProps {
  roomId: string;
  isModerator?: boolean;
}

/**
 * Collapsible panel listing pinned messages in a room. Moderators can
 * unpin directly. Accessible expand/collapse with keyboard support.
 */
export function PinnedMessagesPanel({ roomId, isModerator = false }: PinnedMessagesPanelProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';
  const [open, setOpen] = useState(true);
  const [pinned, setPinned] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const messages = await fetchPinnedMessages(roomId);
        if (mounted) setPinned(messages);
      } catch {
        if (mounted) setPinned([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const handleUnpin = async (messageId: string) => {
    try {
      await unpinMessage(messageId);
      setPinned((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      // silently ignore
    }
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="pinned-messages-list"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-inter text-sm font-semibold text-sura-ivory">
          📌 {isArabic ? 'الرسائل المثبتة' : 'Pinned messages'}
          {pinned.length > 0 ? ` (${pinned.length})` : ''}
        </span>
        <span className="text-sura-ivory/50" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div id="pinned-messages-list" className="space-y-2 border-t border-sura-ivory/10 p-3">
          {pinned.length === 0 ? (
            <p className="text-xs text-sura-ivory/50">{isArabic ? 'لا توجد رسائل مثبتة' : 'No pinned messages'}</p>
          ) : (
            pinned.map((m) => (
              <div key={m.id} className="rounded-xl border border-sura-gold/20 bg-sura-gold/5 p-2.5">
                <div className="flex items-start gap-2">
                  <Avatar url={m.user.avatar ?? undefined} name={m.user.name} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-sura-ivory/80">{m.user.name}</p>
                    <p className="mt-0.5 text-sm text-sura-ivory/70">{m.content}</p>
                  </div>
                  {isModerator && user && (
                    <button
                      type="button"
                      onClick={() => handleUnpin(m.id)}
                      className="text-xs text-sura-ivory/40 hover:text-sura-teal"
                    >
                      {isArabic ? 'إلغاء التثبيت' : 'Unpin'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default PinnedMessagesPanel;
