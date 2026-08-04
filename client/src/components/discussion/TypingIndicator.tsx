import { useLiveRoom } from '../../context/LiveRoomContext';
import { useLocale } from '../../context/LocaleContext';

/**
 * Live typing indicator — reads the set of currently-typing users from
 * LiveRoomContext and shows an accessible "typing…" message.
 */
export function TypingIndicator() {
  const { typingUsers } = useLiveRoom();
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? isArabic
        ? 'يكتب الآن…'
        : 'is typing…'
      : isArabic
        ? 'يكتبون الآن…'
        : 'are typing…';

  return (
    <div className="flex items-center gap-2 px-1 py-1 text-xs text-sura-ivory/50" aria-live="polite">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sura-gold" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sura-gold" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sura-gold" style={{ animationDelay: '300ms' }} />
      </span>
      <span>{text}</span>
    </div>
  );
}

export default TypingIndicator;
