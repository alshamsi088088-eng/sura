import { FormEvent, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { Avatar } from '../AvatarUpload';
import { searchMessages, type ChatMessage } from '../../services/discussionService';

interface MessageSearchBarProps {
  roomId: string;
  onSelect?: (message: ChatMessage) => void;
}

/**
 * Message search within a live room. Results are clickable to jump to a
 * message (optional onSelect callback). Fully keyboard accessible.
 */
export function MessageSearchBar({ roomId, onSelect }: MessageSearchBarProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const messages = await searchMessages(roomId, query.trim());
      setResults(messages);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  return (
    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-3">
      <form onSubmit={handleSearch} role="search">
        <label className="sr-only" htmlFor="message-search-input">
          {isArabic ? 'ابحث في الرسائل' : 'Search messages'}
        </label>
        <div className="flex gap-2">
          <input
            id="message-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isArabic ? 'ابحث في الرسائل...' : 'Search messages...'}
            className="flex-1 rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="rounded-full bg-sura-teal px-4 py-2 text-sm font-semibold text-sura-navy disabled:opacity-50"
          >
            {searching ? '…' : isArabic ? 'بحث' : 'Search'}
          </button>
        </div>
      </form>

      {searched && (
        <div className="mt-3 space-y-2 border-t border-sura-ivory/10 pt-3" role="listbox" aria-label={isArabic ? 'نتائج البحث' : 'Search results'}>
          {results.length === 0 ? (
            <p className="text-xs text-sura-ivory/50">{isArabic ? 'لا نتائج' : 'No results'}</p>
          ) : (
            results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect?.(m)}
                className="flex w-full items-start gap-2 rounded-xl p-2 text-left transition hover:bg-white/5"
              >
                <Avatar url={m.user.avatar ?? undefined} name={m.user.name} size="xs" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-sura-ivory/80">{m.user.name}</span>
                  <span className="block truncate text-sm text-sura-ivory/60">{m.content}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MessageSearchBar;
