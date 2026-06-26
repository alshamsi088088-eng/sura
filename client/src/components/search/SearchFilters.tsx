import { useLocale } from '../../context/LocaleContext';

export interface SearchFilters {
  query: string;
  contentType: 'all' | 'articles' | 'novels' | 'chapters' | 'books' | 'discussions' | 'authors';
  category: string;
  author: string;
  sortBy: 'relevance' | 'latest' | 'most_liked' | 'most_viewed';
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  categories?: string[];
}

export function SearchFilters({ filters, onChange, categories = [] }: SearchFiltersProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  const contentTypes = [
    { key: 'all', label: isArabic ? 'الكل' : 'All' },
    { key: 'articles', label: isArabic ? 'المقالات' : 'Articles' },
    { key: 'novels', label: isArabic ? 'الروايات' : 'Novels' },
    { key: 'chapters', label: isArabic ? 'الفصول' : 'Chapters' },
    { key: 'books', label: isArabic ? 'الكتب' : 'Books' },
    { key: 'discussions', label: isArabic ? 'النقاشات' : 'Discussions' },
    { key: 'authors', label: isArabic ? 'المؤلفون' : 'Authors' }
  ] as const;

  const sortOptions = [
    { key: 'relevance', label: isArabic ? 'الملاءمة' : 'Relevance' },
    { key: 'latest', label: isArabic ? 'الأحدث' : 'Latest' },
    { key: 'most_liked', label: isArabic ? 'الأكثر إعجاباً' : 'Most Liked' },
    { key: 'most_viewed', label: isArabic ? 'الأكثر مشاهدة' : 'Most Viewed' }
  ] as const;

  const handleTypeChange = (contentType: SearchFilters['contentType']) => {
    onChange({ ...filters, contentType });
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    onChange({ ...filters, sortBy });
  };

  const handleCategoryChange = (category: string) => {
    onChange({ ...filters, category });
  };

  return (
    <div className="space-y-4">
      {/* Content Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {contentTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => handleTypeChange(type.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filters.contentType === type.key
                ? 'bg-sura-teal text-white'
                : 'bg-sura-dark/50 text-sura-ivory/70 hover:text-sura-ivory hover:bg-sura-dark'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-sura-ivory/50">
          {isArabic ? 'ترتيب:' : 'Sort:'}
        </span>
        {sortOptions.map((sort) => (
          <button
            key={sort.key}
            onClick={() => handleSortChange(sort.key)}
            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
              filters.sortBy === sort.key
                ? 'bg-purple-600 text-white'
                : 'bg-sura-dark/30 text-sura-ivory/50 hover:text-sura-ivory'
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>

      {/* Categories Dropdown */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-sura-ivory/50">
            {isArabic ? 'التصنيف:' : 'Category:'}
          </span>
          <select
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="rounded-lg bg-sura-dark/50 px-3 py-1.5 text-sm text-sura-ivory border border-sura-ivory/10 focus:border-sura-teal"
          >
            <option value="">{isArabic ? 'الكل' : 'All'}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default SearchFilters;