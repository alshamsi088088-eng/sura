import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useLocale } from '../../context/LocaleContext';
import { SearchResultItem } from './SearchResults';
import { SearchFilters, SearchFilters as SearchFiltersType } from './SearchFilters';

interface InstantSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstantSearch({ isOpen, onClose }: InstantSearchProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const isArabic = locale === 'ar';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (!supabase) return;
      setLoading(true);

      try {
        const q = query.toLowerCase();
        const searchPattern = `%${q}%`;

        // Search articles
        const { data: articles } = await supabase
          .from('Article')
          .select('id, title, excerpt, category, authorName, slug, claps, views, createdAt')
          .or(`title.ilike.${searchPattern},excerpt.ilike.${searchPattern}`)
          .limit(3);

        // Search novels
        const { data: novels } = await supabase
          .from('Novel')
          .select('id, title, description, authorName, slug, coverImage, createdAt')
          .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
          .limit(3);

        // Search users (authors)
        const { data: authors } = await supabase
          .from('User')
          .select('id, name, avatar, bio')
          .or(`name.ilike.${searchPattern}`)
          .limit(3);

        // Search chapters
        const { data: chapters } = await supabase
          .from('Chapter')
          .select('id, title, number, novelId, readingTime, createdAt')
          .or(`title.ilike.${searchPattern}`)
          .limit(3);

        // Search books
        const { data: books } = await supabase
          .from('Book')
          .select('id, title, description, authorName, slug, coverImage, createdAt')
          .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
          .limit(3);

        // Search community discussions
        const { data: discussions } = await supabase
          .from('CommunityThread')
          .select('id, title, body, category, authorId, createdAt')
          .or(`title.ilike.${searchPattern},body.ilike.${searchPattern}`)
          .limit(3);

        // Combine results
        const combined: SearchResultItem[] = [
          ...(articles || []).map((a) => ({
            id: a.id,
            type: 'article' as const,
            title: a.title,
            excerpt: a.excerpt,
            author: a.authorName,
            category: a.category,
            likes: a.claps,
            views: a.views,
            createdAt: a.createdAt,
            slug: a.slug
          })),
          ...(novels || []).map((n) => ({
            id: n.id,
            type: 'novel' as const,
            title: n.title,
            excerpt: n.description,
            author: n.authorName,
            coverImage: n.coverImage,
            createdAt: n.createdAt,
            slug: n.slug
          })),
          ...(authors || []).map((u) => ({
            id: u.id,
            type: 'author' as const,
            title: u.name,
            excerpt: u.bio || undefined,
            author: u.name,
            authorId: u.id,
            authorAvatar: u.avatar || undefined
          })),
          ...(chapters || []).map((c) => ({
            id: c.id,
            type: 'chapter' as const,
            title: c.title,
            excerpt: `Chapter ${c.number}`,
            authorId: c.novelId,
            number: c.number,
            readingTime: c.readingTime,
            createdAt: c.createdAt
          })),
          ...(books || []).map((b) => ({
            id: b.id,
            type: 'book' as const,
            title: b.title,
            excerpt: b.description,
            author: b.authorName,
            coverImage: b.coverImage,
            createdAt: b.createdAt,
            slug: b.slug
          })),
          ...(discussions || []).map((d) => ({
            id: d.id,
            type: 'discussion' as const,
            title: d.title,
            excerpt: d.body,
            category: d.category,
            authorId: d.authorId,
            createdAt: d.createdAt
          }))
        ];

        setResults(combined.slice(0, 8));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getLink = (item: SearchResultItem) => {
    switch (item.type) {
      case 'article':
        return `/articles/${item.slug}`;
      case 'novel':
        return `/novels/${item.slug}`;
      case 'author':
        return `/profile/${item.authorId}`;
      case 'chapter':
        return `/novels/${item.authorId}?chapter=${item.id}`;
      case 'book':
        return `/books/${item.slug}`;
      case 'discussion':
        return `/community thread/${item.id}`;
      default:
        return '/';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(getLink(results[selectedIndex]));
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleFullSearch = () => {
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 z-50 w-80 sm:w-96 max-h-[80vh] overflow-hidden rounded-xl border border-sura-ivory/10 bg-sura-dark/95 shadow-xl">
      <div className="p-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sura-ivory/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isArabic ? 'بحث...' : 'Search...'}
            autoFocus
            className="w-full rounded-lg bg-sura-dark/50 py-2 pl-9 pr-20 text-sm text-sura-ivory placeholder-sura-ivory/50 focus:outline-none focus:ring-1 focus:ring-sura-teal"
          />
          <button
            onClick={handleFullSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-sura-teal px-2 py-1 text-xs font-medium text-white hover:bg-sura-teal/80"
          >
            {isArabic ? 'بحث' : 'Search'}
          </button>
        </div>

        {/* Results Dropdown */}
        {query.length >= 2 && (
          <div className="mt-2 max-h-80 overflow-y-auto border-t border-sura-ivory/10">
            {loading ? (
              <div className="p-4 text-center text-sura-ivory/50">
                {isArabic ? 'جاري البحث...' : 'Searching...'}
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((item, index) => (
                  <Link
                    key={item.id}
                    to={getLink(item)}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 transition ${
                      index === selectedIndex
                        ? 'bg-sura-dark'
                        : 'hover:bg-sura-dark/50'
                    }`}
                  >
                    <span className="shrink-0 rounded bg-purple-500/20 px-1.5 py-0.5 text-xs text-purple-400">
                      {item.type === 'article'
                        ? isArabic
                          ? 'م'
                          : 'Art'
                        : item.type === 'novel'
                        ? isArabic
                          ? 'ر'
                          : 'Nov'
                        : item.type === 'chapter'
                        ? isArabic
                          ? 'ف'
                          : 'Ch'
                        : item.type === 'book'
                        ? isArabic
                          ? 'ك'
                          : 'Bk'
                        : item.type === 'discussion'
                        ? isArabic
                          ? 'ن'
                          : 'Dis'
                        : isArabic
                        ? 'مؤ'
                        : 'Auth'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-sura-ivory">{item.title}</p>
                      {item.author && (
                        <p className="truncate text-xs text-sura-ivory/50">
                          {item.author}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sura-ivory/50">
                {isArabic ? 'لا توجد نتائج' : 'No results found'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InstantSearch;