import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

interface TopContent {
  id: string;
  title: string;
  views: number;
  likes: number;
}

export function AnalyticsTopContent() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [content, setContent] = useState<TopContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'article' | 'novel' | 'chapter'>('article');

  const isArabic = locale === 'ar';

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    fetch(`/api/analytics/top-content?type=${activeTab}`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setContent(data);
      })
      .catch(() => [])
      .finally(() => setIsLoading(false));
  }, [user, activeTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sura-teal border-t-transparent" />
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <p className="text-sura-ivory/60 text-center py-8">
        {isArabic ? 'لا يوجد محتوى بعد' : 'No content yet'}
      </p>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['article', 'novel', 'chapter'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              activeTab === tab
                ? 'bg-sura-teal text-sura-dark'
                : 'bg-sura-ivory/10 text-sura-ivory hover:bg-sura-ivory/20'
            }`}
          >
            {isArabic
              ? tab === 'article' ? 'مقالات' : tab === 'novel' ? 'روايات' : 'فصول'
              : tab.charAt(0).toUpperCase() + tab.slice(1) + 's'
            }
          </button>
        ))}
        {(activeTab === 'article' || activeTab === 'novel') && content.length > 0 && (
          <button
            onClick={() => {
              const headers = activeTab === 'article' ? 'Title,Views,Likes' : 'Title,Views';
              const rows = content.map(c => `"${c.title.replace(/"/g, '""')}",${c.views},${c.likes}`).join('\n');
              const csv = `${headers}\n${rows}`;
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${activeTab}s_export.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 transition"
          >
            {isArabic ? 'تصدير CSV' : 'Export CSV'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {content.map((item, i) => (
          <Link
            key={item.id}
            to={`/${activeTab === 'article' ? 'articles' : activeTab === 'novel' ? 'novels' : 'novels'}/${item.id}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-sura-dark border border-sura-ivory/10 hover:border-sura-ivory/30 transition"
          >
            <span className="text-sura-ivory/40 font-bold w-6">#{i + 1}</span>
            <span className="flex-1 text-sura-ivory truncate">{item.title}</span>
            <span className="text-sura-ivory/60 text-sm">
              {item.views.toLocaleString()} {isArabic ? 'مشاهدة' : 'views'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}