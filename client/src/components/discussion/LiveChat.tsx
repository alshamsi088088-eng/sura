import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useLiveRoom } from '../../context/LiveRoomContext';
import { Avatar } from '../AvatarUpload';
import { ReactionBar } from '../ReactionBar';
// Local TypingIndicator fallback (original file missing in some setups)
function TypingIndicator() {
  return <div className="text-xs text-sura-ivory/50">...</div>;
}
import {
  fetchMessages,
  sendMessage,
  deleteMessage,
  type ChatMessage,
} from '../../services/discussionService';

interface LiveChatProps {
  roomId: string;
}

export function LiveChat({ roomId }: LiveChatProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const { realtimeMessages, emitMessage, emitTyping, clearRealtimeMessages } = useLiveRoom();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = async (targetPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMessages(roomId, targetPage, 50);
      setMessages((prev) => {
        if (targetPage === 1) return res.messages;
        const merged = [...res.messages, ...prev];
        const seen = new Set<string>();
        return merged.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
      });
      setHasMore(targetPage < res.totalPages);
      setPage(targetPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    clearRealtimeMessages();
    setMessages([]);
    setPage(1);
    setHasMore(false);
    loadMessages(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Merge realtime messages into the list (dedupe by id)
  useEffect(() => {
    if (realtimeMessages.length === 0) return;
    setMessages((prev) => {
      const merged = [...prev, ...realtimeMessages];
      const seen = new Set<string>();
      return merged.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
    });
  }, [realtimeMessages]);

  // Autoscroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !draft.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const parentId = replyTo?.id ?? undefined;
      const message = await sendMessage(roomId, draft.trim(), parentId);
      setMessages((prev) => [...prev, message]);
      emitMessage(message);
      setDraft('');
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setDraft(value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTyping(true);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  const loadOlder = () => {
    if (hasMore && !loading) {
      loadMessages(page + 1);
    }
  };

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label={isArabic ? 'الرسائل' : 'Messages'}
      >
        {hasMore && (
          <button
            type="button"
            onClick={loadOlder}
            className="mx-auto block rounded-full border border-sura-ivory/20 px-4 py-1.5 text-xs text-sura-ivory/70 transition hover:bg-white/5"
          >
            {isArabic ? 'تحميل أقدم' : 'Load older messages'}
          </button>
        )}

        {loading && page === 1 ? (
          <div className="py-10 text-center text-sura-ivory/60">
            {isArabic ? 'جارٍ التحميل...' : 'Loading messages...'}
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="py-10 text-center text-sura-ivory/60">
            {isArabic ? 'لا توجد رسائل بعد. ابدأ المحادثة!' : 'No messages yet. Start the conversation!'}
          </div>
        ) : (
          sortedMessages.map((message) => (
            <MessageItemBubble
              key={message.id}
              message={message}
              isOwn={message.userId === user?.id}
              onReply={() => setReplyTo(message)}
              onDelete={() => handleDelete(message.id)}
              isArabic={isArabic}
            />
          ))
        )}

        <TypingIndicator />
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center justify-between border-t border-sura-ivory/10 bg-sura-ink/40 px-4 py-2">
          <span className="truncate text-xs text-sura-ivory/60">
            {isArabic ? 'الرد على' : 'Replying to'}: {replyTo.user.name}
          </span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="text-sura-ivory/50 hover:text-sura-ivory"
            aria-label={isArabic ? 'إلغاء الرد' : 'Cancel reply'}
          >
            ✕
          </button>
        </div>
      )}

      {/* Composer */}
      <form onSubmit={handleSubmit} className="border-t border-sura-ivory/10 p-3">
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={2}
            placeholder={isArabic ? 'اكتب رسالة...' : 'Type a message...'}
            className="flex-1 resize-none rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 p-3 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
          />
          <button
            type="submit"
            disabled={!user || sending || !draft.trim()}
            className="rounded-full bg-sura-gold px-5 py-2.5 font-inter text-sm font-semibold text-sura-charcoal disabled:opacity-50"
          >
            {sending ? (isArabic ? '...' : '...') : isArabic ? 'إرسال' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface MessageItemBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onReply: () => void;
  onDelete: () => void;
  isArabic: boolean;
}

function MessageItemBubble({ message, isOwn, onReply, onDelete, isArabic }: MessageItemBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const time = new Date(message.createdAt).toLocaleTimeString(isArabic ? 'ar' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar url={message.user.avatar ?? undefined} name={message.user.name} size="sm" />
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`relative rounded-2xl px-4 py-2.5 ${
            isOwn ? 'bg-sura-gold/15 text-sura-ivory' : 'bg-sura-ink/60 text-sura-ivory'
          }`}
        >
          <p className="text-xs font-semibold text-sura-ivory/70">{message.user.name}</p>
          <p className="mt-0.5 whitespace-pre-wrap font-inter text-sm">{message.content}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] text-sura-ivory/40">{time}</span>
            {message.isPinned && (
              <span className="text-[10px] text-sura-gold">📌 {isArabic ? 'مثبت' : 'Pinned'}</span>
            )}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <ReactionBar contentId={message.id} contentType="community" layout="compact" />
          <button
            type="button"
            onClick={onReply}
            className="text-[11px] text-sura-ivory/50 hover:text-sura-ivory"
          >
            {isArabic ? 'رد' : 'Reply'}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="text-sura-ivory/50 hover:text-sura-ivory"
              aria-label={isArabic ? 'المزيد' : 'More'}
              aria-expanded={menuOpen}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 w-36 rounded-lg border border-sura-ivory/10 bg-sura-ink p-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"
                >
                  {isArabic ? 'حذف' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export local TypingIndicator
export { TypingIndicator };
