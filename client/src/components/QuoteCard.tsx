import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { BookmarkButton } from './BookmarkButton';
import { ReactionBar } from './ReactionBar';

export interface QuoteItem {
  id: string;
  contentId: string;
  contentType: 'article' | 'novel' | 'chapter';
  selectedText: string;
  startOffset: number | null;
  endOffset: number | null;
  contentTitle?: string;
  authorName?: string;
  createdAt: string;
}

interface QuoteCardProps {
  quote: QuoteItem;
  showActions?: boolean;
  onDeleted?: (id: string) => void;
}

export function QuoteCard({ quote, showActions = true, onDeleted }: QuoteCardProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  const getContentLink = () => {
    switch (quote.contentType) {
      case 'article':
        return `/articles/${quote.contentId}`;
      case 'novel':
        return `/novels/${quote.contentId}`;
      case 'chapter':
        return `/novels/${quote.contentId}`;
      default:
        return '/';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeLabel = () => {
    switch (quote.contentType) {
      case 'article':
        return isArabic ? 'مقال' : 'Article';
      case 'novel':
        return isArabic ? 'رواية' : 'Novel';
      case 'chapter':
        return isArabic ? 'فصل' : 'Chapter';
      default:
        return '';
    }
  };

  return (
    <div className="group rounded-lg border border-sura-ivory/10 bg-sura-dark/30 p-4 transition hover:border-sura-ivory/30">
      {/* Quote Text */}
      <blockquote className="relative mb-3">
        <svg
          className="absolute -top-1 -left-1 h-4 w-4 text-sura-teal/30"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983z" />
        </svg>
        <p className="pr-4 text-sm text-sura-ivory leading-relaxed">
          {quote.selectedText}
        </p>
      </blockquote>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-sura-ivory/60">
        <Link
          to={getContentLink()}
          className="flex items-center gap-1 hover:text-sura-teal"
        >
          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-purple-400">
            {getTypeLabel()}
          </span>
          {quote.contentTitle && (
            <span className="truncate max-w-[150px]">{quote.contentTitle}</span>
          )}
        </Link>

        {quote.authorName && (
          <span className="truncate">
            {quote.authorName}
          </span>
        )}

        <span>{formatDate(quote.createdAt)}</span>
      </div>

      {/* Actions - Reuse existing components */}
      {showActions && (
        <div className="mt-3 flex items-center gap-2 border-t border-sura-ivory/10 pt-3">
          {/* Bookmark - reuse existing */}
          <BookmarkButton
            contentType={quote.contentType}
            contentId={quote.contentId}
            size="sm"
          />

          {/* Reactions - reuse existing */}
          <ReactionBar
            contentType={quote.contentType}
            contentId={quote.contentId}
          />
        </div>
      )}
    </div>
  );
}

export default QuoteCard;