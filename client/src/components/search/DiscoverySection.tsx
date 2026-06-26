import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLocale } from '../../context/LocaleContext';

type DiscoveryType = 'trending' | 'recently_updated' | 'recommended' | 'popular_week';

export interface DiscoveryItem {
  id: string;
  type: 'article' | 'novel' | 'chapter' | 'book';
  title: string;
  excerpt?: string;
  authorName?: string;
  slug?: string;
  coverImage?: string;
  likes?: number;
  views?: number;
  updatedAt?: string;
  createdAt?: string;
}

interface DiscoverySectionProps {
  type: DiscoveryType;
  limit?: number;
}

export function DiscoverySection({ type, limit = 5 }: DiscoverySectionProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      if (!supabase) return;
      setLoading(true);

      try {
        let data: any[] = [];

        switch (type) {
          case 'trending':
            // Most liked articles/novels
            const [articles, novels] = await Promise.all([
              supabase
                .from('Article')
                .select('id, title, excerpt, authorName, slug, claps, views, createdAt')
                .order('claps', { ascending: false })
                .limit(limit),
              supabase
                .from('Novel')
                .select('id, title, description, authorName, slug, coverImage, createdAt')
                .order('createdAt', { ascending: false })
                .limit(limit)
            ]);
            data = [
              ...(articles.data || []).map((a) => ({
                ...a,
                type: 'article' as const,
                likes: a.claps
              })),
              ...(novels.data || []).map((n) => ({
                ...n,
                type: 'novel' as const,
                likes: 0
              }))
            ]
              .sort((a, b) => (b.likes || 0) - (a.likes || 0))
              .slice(0, limit);
            break;

          case 'recently_updated':
            // Recently created/updated
            const [recentArt, recentNov] = await Promise.all([
              supabase
                .from('Article')
                .select('id, title, excerpt, authorName, slug, updatedAt')
                .order('updatedAt', { ascending: false })
                .limit(limit),
              supabase
                .from('Novel')
                .select('id, title, description, authorName, slug, coverImage, updatedAt')
                .order('updatedAt', { ascending: false })
                .limit(limit)
            ]);
            data = [
              ...(recentArt.data || []).map((a) => ({
                ...a,
                type: 'article' as const
              })),
              ...(recentNov.data || []).map((n) => ({
                ...n,
                type: 'novel' as const,
                excerpt: n.description
              }))
            ]
              .sort((a, b) =>
                new Date((b as any).updatedAt || (b as any).createdAt || 0).getTime() -
                new Date((a as any).updatedAt || (a as any).createdAt || 0).getTime()
              )
              .slice(0, limit);
            break;

          case 'popular_week':
            // Most viewed this week (using views as proxy)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const [popArt, popNov] = await Promise.all([
              supabase
                .from('Article')
                .select('id, title, excerpt, authorName, slug, views, createdAt')
                .gte('createdAt', weekAgo.toISOString())
                .order('views', { ascending: false })
                .limit(limit),
              supabase
                .from('Novel')
                .select('id, title, description, authorName, slug, coverImage, createdAt')
                .gte('createdAt', weekAgo.toISOString())
                .order('createdAt', { ascending: false })
                .limit(limit)
            ]);
            data = [
              ...(popArt.data || []).map((a) => ({
                ...a,
                type: 'article' as const
              })),
              ...(popNov.data || []).map((n) => ({
                ...n,
                type: 'novel' as const,
                excerpt: n.description
              }))
            ]
              .sort((a, b) => ((b as any).views || 0) - ((a as any).views || 0))
              .slice(0, limit);
            break;

          case 'recommended':
            // Featured or recent
            const [featArt, featNov] = await Promise.all([
              supabase
                .from('Article')
                .select('id, title, excerpt, authorName, slug, featured, createdAt')
                .eq('featured', true)
                .limit(limit),
              supabase
                .from('Novel')
                .select('id, title, description, authorName, slug, coverImage, createdAt')
                .order('createdAt', { ascending: false })
                .limit(limit)
            ]);
            data = [
              ...(featArt.data || []).map((a) => ({
                ...a,
                type: 'article' as const
              })),
              ...(featNov.data || []).map((n) => ({
                ...n,
                type: 'novel' as const,
                excerpt: n.description
              }))
            ].slice(0, limit);
            break;
        }

        setItems(data);
      } catch (err) {
        console.error('Discovery fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [type, limit]);

  const getTitle = () => {
    const titles = {
      trending: isArabic ? 'الرائج' : 'Trending',
      recently_updated: isArabic ? 'المحدثي' : 'Recently Updated',
      recommended: isArabic ? 'المcommended' : 'Recommended',
      popular_week: isArabic ? 'الأ热门 هذا الأسبوع' : 'Popular This Week'
    };
    return titles[type];
  };

  const getLink = (item: DiscoveryItem) => {
    return item.type === 'article' ? `/articles/${item.slug}` : `/novels/${item.slug}`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-32 animate-pulse rounded bg-sura-dark/50" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-sura-dark/30" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-sura-ivory">{getTitle()}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.id}
            to={getLink(item)}
            className="group flex gap-3 rounded-xl border border-sura-ivory/10 bg-sura-dark/30 p-3 transition hover:border-sura-ivory/30 hover:bg-sura-dark/50"
          >
            {item.coverImage && (
              <img
                src={item.coverImage}
                alt={item.title}
                className="h-16 w-12 shrink-0 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-sura-ivory group-hover:text-sura-teal">
                {item.title}
              </p>
              {item.authorName && (
                <p className="mt-1 text-xs text-sura-ivory/50">
                  {item.authorName}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DiscoverySection;