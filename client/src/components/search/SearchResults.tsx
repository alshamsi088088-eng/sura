import { Link } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { Avatar } from '../AvatarUpload';

export interface SearchResultItem {
  id: string;
  type: 'article' | 'novel' | 'chapter' | 'book' | 'discussion' | 'author';
  title: string;
  excerpt?: string;
  author?: string;
  authorId?: string;
  authorAvatar?: string;
  category?: string;
  coverImage?: string;
  likes?: number;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
  novelTitle?: string;
  slug?: string;
}

interface SearchResultsProps {
  results: SearchResultItem[];
  loading?: boolean;
  query?: string;
}

export function SearchResults({ results, loading, query }: SearchResultsProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-sura-dark/30 h-24"
          />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sura-ivory/50">
          {query
            ? isArabic
              ? `لا توجد نتائج لـ "${query}"`
              : `No results for "${query}"`
            : isArabic
            ? ' ابحث عن ما تريد'
            : 'Search for something'}
        </p>
      </div>
    );
  }

  const getTypeLabel = (type: SearchResultItem['type']) => {
    const labels = {
      article: isArabic ? 'مقال' : 'Article',
      novel: isArabic ? 'رواية' : 'Novel',
      chapter: isArabic ? 'فصل' : 'Chapter',
      book: isArabic ? 'كتاب' : 'Book',
      discussion: isArabic ? 'نقاش' : 'Discussion',
      author: isArabic ? 'مؤلف' : 'Author'
    };
    return labels[type];
  };

  const getLink = (item: SearchResultItem) => {
    switch (item.type) {
      case 'article':
        return `/articles/${item.slug}`;
      case 'novel':
        return `/novels/${item.slug}`;
      case 'chapter':
        return `/novels/${item.slug}?chapter=${item.id}`;
      case 'book':
        return `/store`;
      case 'discussion':
        return `/community/thread/${item.id}`;
      case 'author':
        return `/profile/${item.authorId}`;
      default:
        return '/';
    }
  };

  return (
    <div className="space-y-3">
      {results.map((item) => (
        <Link
          key={item.id}
          to={getLink(item)}
          className="block rounded-xl border border-sura-ivory/10 bg-sura-dark/30 p-4 transition hover:border-sura-ivory/30 hover:bg-sura-dark/50"
        >
          <div className="flex gap-4">
            {/* Author Avatar for author search */}
            {item.type === 'author' && item.authorAvatar && (
              <Avatar url={item.authorAvatar} name={item.author} size="md" />
            )}

            {/* Cover Image for books/novels */}
            {(item.type === 'book' || item.type === 'novel') && item.coverImage && (
              <img
                src={item.coverImage}
                alt={item.title}
                className="h-16 w-12 shrink-0 rounded object-cover"
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                  {getTypeLabel(item.type)}
                </span>
                {item.category && (
                  <span className="text-xs text-sura-ivory/50">{item.category}</span>
                )}
              </div>

              <h3 className="mt-1 truncate text-lg font-medium text-sura-ivory hover:text-sura-teal">
                {item.title}
              </h3>

              {item.excerpt && (
                <p className="mt-1 line-clamp-2 text-sm text-sura-ivory/60">
                  {item.excerpt}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-sura-ivory/50">
                {item.author && (
                  <span>
                    {isArabic ? 'بقلم ' : 'by '}
                    <span className="text-sura-teal">{item.author}</span>
                  </span>
                )}
                {item.novelTitle && (
                  <span>
                    {isArabic ? 'في ' : 'in '}
                    {item.novelTitle}
                  </span>
                )}
                {item.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.668 3.5 3.5 5.667 3.5 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    {item.likes}
                  </span>
                )}
                {item.views !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.08.383.095.524a9.016 9.016 0 01-2.888 4.817 9.105 9.105 0 01-4.694 2.91 9.015 9.015 0 01-2.784-4.638c-.14-.183-.345-.41-.506-.614a1.125 1.125 0 00-1.013-.717h-.995a1.007 1.007 0 01-.706-.331c-.134-.112-.26-.24-.376-.38A9.018 9.018 0 013 11.5c0-4.64 3.5-8.5 8-8.5 1.08 0 2.104.162 3.048.452a1.007 1.007 0 001.013.717h.995c.54 0 1.035.343 1.248.8z" />
                    </svg>
                    {item.views}
                  </span>
                )}
                {item.createdAt && (
                  <span>
                    {new Date(item.createdAt).toLocaleDateString(
                      isArabic ? 'ar-SA' : 'en-US'
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default SearchResults;