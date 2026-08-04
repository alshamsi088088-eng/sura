import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';

interface NavItem {
  seriesItemId: string;
  contentType: string;
  contentId: string;
  title: string;
  slug: string;
}

interface SeriesNavigationProps {
  previousItem: NavItem | null;
  nextItem: NavItem | null;
  continueItem: NavItem | null;
  completed: boolean;
  seriesSlug: string;
}

export function SeriesNavigation({
  previousItem,
  nextItem,
  continueItem,
  completed,
  seriesSlug,
}: SeriesNavigationProps) {
  const { locale } = useLocale();

  const getContentUrl = (item: NavItem): string => {
    if (item.contentType === 'article') {
      return `/articles/${encodeURIComponent(item.slug)}`;
    }
    if (item.contentType === 'novel') {
      return `/novels/${encodeURIComponent(item.slug)}`;
    }
    return '#';
  };

  return (
    <div className="rounded-3xl border border-sura-line bg-sura-canvas p-6 space-y-4">
      {/* Completed Badge */}
      {completed && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-400/10 border border-green-400/20 px-4 py-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-green-400 font-semibold text-sm">
            {locale === 'ar' ? 'أكملت السلسلة! 🎉' : 'Series Completed! 🎉'}
          </span>
        </div>
      )}

      {/* Continue Reading */}
      {continueItem && !completed && (
        <Link
          to={getContentUrl(continueItem)}
          className="flex items-center justify-center gap-2 rounded-xl bg-sura-gold/10 border border-sura-gold/20 px-4 py-3 transition hover:bg-sura-gold/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sura-gold">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="text-sura-gold font-semibold text-sm">
            {locale === 'ar' ? 'متابعة القراءة' : 'Continue Reading'}
          </span>
          <span className="text-sura-navy/60 text-xs truncate max-w-[200px]">
            {continueItem.title}
          </span>
        </Link>
      )}

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Previous */}
        {previousItem ? (
          <Link
            to={getContentUrl(previousItem)}
            className="flex flex-col gap-1 rounded-xl border border-sura-line p-3 transition hover:bg-white/5"
          >
            <span className="text-[10px] uppercase tracking-wider text-sura-navy/50">
              {locale === 'ar' ? 'السابق' : 'Previous'}
            </span>
            <span className="text-sm font-medium text-sura-ink truncate">
              {previousItem.title}
            </span>
          </Link>
        ) : (
          <div className="flex flex-col gap-1 rounded-xl border border-sura-line/30 p-3 opacity-40">
            <span className="text-[10px] uppercase tracking-wider text-sura-navy/50">
              {locale === 'ar' ? 'السابق' : 'Previous'}
            </span>
            <span className="text-sm text-sura-navy/40">
              {locale === 'ar' ? 'لا يوجد' : 'None'}
            </span>
          </div>
        )}

        {/* Next */}
        {nextItem ? (
          <Link
            to={getContentUrl(nextItem)}
            className="flex flex-col gap-1 rounded-xl border border-sura-line p-3 transition hover:bg-white/5 text-right"
          >
            <span className="text-[10px] uppercase tracking-wider text-sura-navy/50">
              {locale === 'ar' ? 'التالي' : 'Next'}
            </span>
            <span className="text-sm font-medium text-sura-ink truncate">
              {nextItem.title}
            </span>
          </Link>
        ) : (
          <div className="flex flex-col gap-1 rounded-xl border border-sura-line/30 p-3 opacity-40 text-right">
            <span className="text-[10px] uppercase tracking-wider text-sura-navy/50">
              {locale === 'ar' ? 'التالي' : 'Next'}
            </span>
            <span className="text-sm text-sura-navy/40">
              {locale === 'ar' ? 'لا يوجد' : 'None'}
            </span>
          </div>
        )}
      </div>

      {/* Back to Series */}
      <div className="text-center">
        <Link
          to={`/series/${encodeURIComponent(seriesSlug)}`}
          className="text-xs text-sura-navy/50 hover:text-sura-gold transition-colors"
        >
          ← {locale === 'ar' ? 'العودة إلى السلسلة' : 'Back to Series'}
        </Link>
      </div>
    </div>
  );
}
