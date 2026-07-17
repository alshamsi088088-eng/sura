import { motion } from 'framer-motion';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

import { WeeklyTargetBanner } from '../components/WeeklyTargetBanner';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useSeoTags } from '../hooks/useSeoTags';

interface FeatureCard {
  id: string;
  slug: string;
  title: string;
  description: string;
}
interface TrendingItem { id: string; title: string; type: string; views: number; slug?: string; }

export function HomePage() {
  const { locale, strings } = useLocale();
  useSeoTags({
    title: locale === 'ar' ? 'سُرى — مدونة القراءة العميقة' : 'Sura Codex — A Space for Thought & Creativity',
    description: locale === 'ar' ? 'مدونة ومتجر رقمي للقراءة العميقة.' : 'A publishing platform for deep reading.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/`,
  });

  const { user } = useAuth();
  const [featured, setFeatured] = useState<FeatureCard[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const isArabic = locale === 'ar';

  // 1. Featured Articles Effect
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) {
        if (mounted) setFeaturedLoading(false);
        return;
      }
      try {
        setFeaturedLoading(true);
        const { data: featuredArticles } = await supabase
          .from('Article')
          .select('id, slug, title, excerpt')
          .eq('featured', true)
          .order('publishedAt', { ascending: false })
          .limit(4);

        const next = (featuredArticles || []).map((a: any) => ({
          id: String(a.id ?? ''),
          slug: String(a.slug ?? a.id ?? ''),
          title: a.title,
          description: a.excerpt,
        }));
        if (mounted) setFeatured(next);
      } catch {} finally {
        if (mounted) setFeaturedLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 2. Trending Content Effect
  useEffect(() => {
    let mounted = true;
    const loadTrending = async () => {
      if (!supabase) {
        if (mounted) setTrendingLoading(false);
        return;
      }
      try {
        setTrendingLoading(true);
        const { data: articles } = await supabase
          .from('Article')
          .select('id, title, views, slug')
          .order('createdAt', { ascending: false })
          .limit(5);

        const { data: novels } = await supabase
          .from('Novel')
          .select('id, title, slug')
          .order('createdAt', { ascending: false })
          .limit(5);

        const articleItems: TrendingItem[] = (articles || []).map(a => ({ id: a.id, title: a.title, type: 'article', views: a.views || 0, slug: a.slug }));
        const novelItems: TrendingItem[] = (novels || []).map(n => ({ id: n.id, title: n.title, type: 'novel', views: 0, slug: n.slug }));
        const allItems: TrendingItem[] = [...articleItems, ...novelItems].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
        if (mounted) setTrending(allItems);
      } catch {} finally {
        if (mounted) setTrendingLoading(false);
      }
    };
    loadTrending();
    return () => { mounted = false; };
  }, []);

  const trendingHref = (item: TrendingItem) => {
    const base = item.type === 'novel' ? '/novels' : '/articles';
    return `${base}/${encodeURIComponent(item.slug || item.id)}`;
  };

  return (
    <div dir={dir} className="mx-auto max-w-7xl space-y-6">
      {/* Hero */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-sura-line p-8 text-center sm:p-12"
      >
        {/* Background image: hero-night.png (client/public/hero-night.png) */}
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-night.png')" }}
          aria-hidden="true"
        />
        {/* Dark overlay so text stays legible over the photo */}
        <div className="absolute inset-0 -z-10 bg-sura-dark/60" aria-hidden="true" />

        <p className="text-xs uppercase tracking-[0.3em] text-sura-sky">
          {isArabic ? 'سُرى' : 'Sura Codex'}
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold text-sura-ivory sm:text-5xl">
          {isArabic ? 'مساحة للقراءة العميقة والتأمل' : 'A Space for Thought & Creativity'}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-sura-ivory/80 sm:text-base">
          {isArabic
            ? 'مقالات وروايات مختارة بعناية، مبنية على قراءة أعمق ووقت أهدأ.'
            : 'Curated essays and novels, built for deeper reading and a slower pace.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/articles"
            className="rounded-full bg-sura-gold px-6 py-2.5 text-sm font-semibold text-sura-dark transition hover:opacity-95 select-none"
          >
            {isArabic ? 'تصفّح المقالات' : 'Browse Articles'}
          </Link>
          <Link
            to="/novels"
            className="rounded-full border border-sura-ivory/30 px-6 py-2.5 text-sm font-semibold text-sura-ivory/90 transition hover:border-sura-gold/50 select-none"
          >
            {isArabic ? 'استكشف الروايات' : 'Explore Novels'}
          </Link>
        </div>
      </motion.header>

      {/* Weekly Progress */}
      {/* WeeklyTargetBanner is fully self-contained: it fetches/derives its own
          weekly reading data (localStorage + API), so no props are passed here. */}
      {user ? <WeeklyTargetBanner /> : null}

      {/* Featured Articles */}
      <section className="rounded-3xl border border-sura-line bg-sura-canvas p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold">
            {isArabic ? 'مقالات مميزة' : 'Featured Articles'}
          </h2>
          <Link to="/articles" className="text-sm text-sura-teal hover:underline select-none">
            {isArabic ? 'عرض الكل' : 'View all'}
          </Link>
        </div>

        {featuredLoading ? (
          <p className="mt-6 text-sm text-sura-navy/70">
            {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
        ) : featured.length === 0 ? (
          <p className="mt-6 text-sm text-sura-navy/60">
            {isArabic ? 'لا توجد مقالات مميزة حالياً.' : 'No featured articles yet.'}
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {featured.map((item) => (
              <Link
                key={item.id || item.title}
                to={item.slug ? `/articles/${encodeURIComponent(item.slug)}` : '/articles'}
                className="block rounded-2xl border border-sura-line bg-sura-canvas p-5 transition hover:-translate-y-1 hover:border-sura-gold/50"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                {item.description ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-sura-navy/80">{item.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Trending Content */}
      <section className="rounded-3xl border border-sura-line bg-sura-canvas p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">
          {isArabic ? 'الأكثر رواجاً' : 'Trending Now'}
        </h2>

        {trendingLoading ? (
          <p className="mt-6 text-sm text-sura-navy/70">
            {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
        ) : trending.length === 0 ? (
          <p className="mt-6 text-sm text-sura-navy/60">
            {isArabic ? 'لا يوجد محتوى رائج حالياً.' : 'Nothing trending yet.'}
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={trendingHref(item)}
                className="block rounded-2xl border border-sura-line bg-sura-canvas p-5 transition hover:-translate-y-1 hover:border-sura-gold/50"
              >
                <div className="text-xs uppercase tracking-[0.3em] text-sura-teal">
                  {item.type === 'novel' ? (isArabic ? 'رواية' : 'Novel') : (isArabic ? 'مقال' : 'Article')}
                </div>
                <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                {item.type === 'article' ? (
                  <p className="mt-2 text-xs text-sura-navy/60">
                    {item.views} {isArabic ? 'مشاهدة' : 'views'}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
