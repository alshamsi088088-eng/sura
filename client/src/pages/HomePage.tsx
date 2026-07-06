import { motion } from 'framer-motion';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useMemo, useState } from 'react';

import { WeeklyTargetBanner } from '../components/WeeklyTargetBanner';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useSeoTags } from '../hooks/useSeoTags';
import { getWeeklyReading } from '../components/ReadingProgressTracker';



interface FeatureCard { title: string; description: string; }
interface TrendingItem { id: string; title: string; type: string; views: number; slug?: string; }

export function HomePage() {
  const { locale, strings } = useLocale();
  useSeoTags({
    title: locale === 'ar' ? 'سُرى — مدونة القراءة العميقة' : 'Sura Codex — A Space for Thought & Creativity',
    description:
      locale === 'ar'
        ? 'مدونة ومتجر رقمي للقراءة العميقة والإصدارات المختارة من المقالات والروايات.'
        : 'A publishing platform and digital store for deep reading and curated essays & novels.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/`,
    openGraph: {
      type: 'website',
      image: { url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg`, alt: 'Sura Codex' },
    },
    twitter: {
      cardType: 'summary_large_image',
      image: { url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg`, alt: 'Sura Codex' },
    },
  });

  const { user } = useAuth();
  const [featured, setFeatured] = useState<FeatureCard[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [weeklyProgressCount, setWeeklyProgressCount] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    let mounted = true;

    // Direct Supabase query (remove legacy /api/content/home)
    (async () => {
      if (!supabase) {
        if (mounted) setFeaturedLoading(false);
        return;
      }

      try {
        setFeaturedLoading(true);

        const sb = supabase;
        const { data: featuredArticles } = await sb
          .from('Article')
          .select('id, title, excerpt')
          .eq('featured', true)
          .order('published_at', { ascending: false })
          .limit(4);

        const next = (featuredArticles || []).map((a: any) => ({
          title: a.title,
          description: a.excerpt,
        }));

        if (mounted) setFeatured(next);
      } catch {
        // keep existing UI state
      } finally {
        if (mounted) setFeaturedLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const sb = supabase;
    const loadTrending = async () => {
      const { data: articles } = await sb
        .from('Article')
        .select('id, title, views, slug')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: novels } = await sb
        .from('Novel')
        .select('id, title, views')
        .order('created_at', { ascending: false })
        .limit(5);
      const articleItems: TrendingItem[] = (articles || []).map(a => ({ id: a.id, title: a.title, type: 'article', views: a.views || 0, slug: a.slug }));
      const novelItems: TrendingItem[] = (novels || []).map(n => ({ id: n.id, title: n.title, type: 'novel', views: n.views || 0 }));
      const allItems: TrendingItem[] = [...articleItems, ...novelItems].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
      setTrending(allItems);
    };
    loadTrending();
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    if (!user) {
      // Load from localStorage when not logged in
      const weeklyData = getWeeklyReading();
      setWeeklyProgressCount(weeklyData.articles + weeklyData.chapters);
      return;
    }

    // Fetch from API when logged in
    const fetchProgress = async () => {
      try {
        const res = await fetch(`${API_URL}/api/weekly-progress`);
        if (res.ok) {
          const data = await res.json();
          setWeeklyProgressCount(data.completed || 0);
          setWeeklyAverage(data.average || 0);
        }
      } catch (err) {
        console.error('Failed to fetch weekly progress:', err);
      }
    };

    fetchProgress();
  }, [user?.id]);

  const encouragement = useMemo(() => {
    if (weeklyProgressCount >= 7) return locale === 'ar' ? 'أداء رائع هذا الأسبوع.' : 'Excellent momentum this week.';
    if (weeklyProgressCount >= 3) return locale === 'ar' ? 'استمر، أنت على الطريق الصحيح.' : 'Keep going, you are on track.';
    return locale === 'ar' ? 'ابدأ بهدف بسيط هذا الأسبوع.' : 'Start with a small goal this week.';
  }, [weeklyProgressCount, locale]);

  const sections = [
    { num: '01', label: locale === 'ar' ? 'مقالات' : 'Articles', to: '/articles', desc: locale === 'ar' ? 'مقالات أدبية وفكرية مختارة بعناية' : 'Curated literary & intellectual essays' },
    { num: '02', label: locale === 'ar' ? 'روايات' : 'Novels', to: '/novels', desc: locale === 'ar' ? 'قصص إبداعية وروايات أصيلة' : 'Original novels and creative fiction' },
    { num: '03', label: locale === 'ar' ? 'معرض' : 'Gallery', to: '/gallery', desc: locale === 'ar' ? 'لحظات بصرية ملهمة ومختارة' : 'A curated gallery of visual moments' },
    { num: '04', label: locale === 'ar' ? 'متجر' : 'Store', to: '/store', desc: locale === 'ar' ? 'كتب وإصدارات رقمية مختارة' : 'Curated digital books and editions' },
  ];

  return (
    <div dir={dir}>

      {/* Hero — moonlit night */}
      <section className="hero-night relative overflow-hidden">
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="mx-auto max-w-3xl">

            <div className="eyebrow justify-center mb-8">
              {locale === 'ar' ? 'مساحة للفكر والإبداع' : 'A space for thought & creativity'}
            </div>

            <h1 className="brand-wordmark font-serif text-[5rem] sm:text-[7rem] lg:text-[9rem] leading-none mb-4">
              {locale === 'ar' ? 'سُرى' : 'Sura'}
            </h1>

            <p className="text-sura-ink/65 text-base sm:text-lg lg:text-xl font-light mb-10 max-w-xl mx-auto leading-relaxed">
              {locale === 'ar'
                ? 'حيث تتقاطع الكلمة بالكود، تحت سماء هادئة — مدونة ومتجر رقمي للقراءة العميقة والإصدارات المختارة.'
                : 'Where words meet code, under a quiet sky — a publishing platform and digital store for deep reading and curated editions.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/articles" className="btn-primary">
                {locale === 'ar' ? 'ابدأ القراءة' : 'Start Reading'}
              </Link>
              <Link to="/store" className="btn-outline">
                {locale === 'ar' ? 'تصفح المتجر' : 'Browse the Store'}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Sections grid overlapping hero bottom */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sections.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
                <Link to={s.to} className="glass-card block h-full p-6 group">
                  <div className="text-[11px] font-semibold tracking-[0.2em] text-sura-sky/70 mb-4">{s.num}</div>
                  <h3 className="font-serif text-lg font-bold mb-2 text-sura-ink">{s.label}</h3>
                  <p className="text-[13px] leading-relaxed text-sura-ink/50 mb-4">{s.desc}</p>
                  <div className="text-[13px] font-semibold text-sura-sky/80 transition group-hover:text-sura-sky">
                    {locale === 'ar' ? '← اكتشف' : 'Explore →'}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 space-y-12">

        <WeeklyTargetBanner />

        {/* Featured */}
        {featured.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="eyebrow mb-3">{locale === 'ar' ? 'مميز' : 'Featured'}</div>
            <h2 className="text-2xl font-bold mb-6 text-sura-ink">{locale === 'ar' ? 'محتوى مميز' : 'Featured Content'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((card) => (
                <div key={card.title} className="glass-card p-7">
                  <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-sura-sky/70 mb-3">
                    {locale === 'ar' ? 'مميز' : 'Featured'}
                  </div>
                  <h3 className="font-serif text-lg font-bold mb-2 text-sura-ink">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-sura-ink/55">{card.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Trending */}
        {trending?.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="eyebrow mb-3">{locale === 'ar' ? 'رائج' : 'Trending'}</div>
            <h2 className="text-2xl font-bold mb-6 text-sura-ink">{locale === 'ar' ? 'المحتوى الرائج' : 'Trending Content'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {trending?.map((item, i) => (
                <Link key={item?.id} to={item?.type === 'article' ? `/articles/${item?.slug || item?.id}` : `/novels/${item?.id}`} className="glass-card p-4 text-center group">
                  <div className="text-xs font-bold text-sura-sky/70 mb-2">#{i + 1}</div>
                  <h3 className="font-serif text-sm font-bold mb-1 text-sura-ink line-clamp-2 group-hover:text-sura-sky">{item?.title}</h3>
                  <div className="text-xs text-sura-ink/50">{item?.type === 'article' ? (locale === 'ar' ? 'مقال' : 'Article') : (locale === 'ar' ? 'رواية' : 'Novel')}</div>
                </Link>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="eyebrow mb-3">{locale === 'ar' ? 'رائج' : 'Trending'}</div>
            <h2 className="text-2xl font-bold mb-6 text-sura-ink">{locale === 'ar' ? 'المحتوى الرائج' : 'Trending Content'}</h2>
            <div className="glass-card p-6 text-center text-sura-ink/50">
              {locale === 'ar' ? 'لا يوجد محتوى رائج بعد.' : 'No trending content available yet.'}
            </div>
          </motion.div>
        )}

        {/* Reading Progress */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div>
              <div className="eyebrow mb-2">{locale === 'ar' ? 'ملخص الأسبوع' : 'Weekly Summary'}</div>
              <h3 className="text-xl font-bold mb-1 text-sura-ink">{locale === 'ar' ? 'تقدم القراءة' : 'Reading Progress'}</h3>
              <p className="text-sm text-sura-ink/50">{encouragement}</p>
            </div>
            <div className="glass rounded-2xl px-7 py-4 text-center !rounded-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sura-sky/70 mb-1.5">
                {locale === 'ar' ? 'مكتملة هذا الأسبوع' : 'Completed this week'}
              </div>
              <div className="font-serif text-4xl font-extrabold text-sura-ink">{weeklyProgressCount}</div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2 text-xs">
              <span className="text-sura-ink/50">{locale === 'ar' ? 'متوسط التقدم' : 'Average progress'}</span>
              <span className="font-bold text-sura-ink">{weeklyAverage}%</span>
            </div>
            <div className="h-1.5 rounded-full border border-white/10 bg-white/5 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, weeklyAverage))}%` }} transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full bg-sura-sky/70" />
            </div>
          </div>
        </motion.div>

        {/* Editor picks */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: strings?.featured ?? '', title: locale === 'ar' ? 'منشورات مختارة' : 'Featured Stories', desc: locale === 'ar' ? 'تشكيلة من المقالات والقصص المنتقاة بعناية.' : 'A rotation of carefully curated essays and stories.' },
            { label: strings?.latest ?? '', title: locale === 'ar' ? 'الأحدث' : 'Latest Articles', desc: locale === 'ar' ? 'تابع التدفق اليومي للمحتوى الجديد.' : 'Follow the daily flow of new content.' },
            { label: strings?.editorPick ?? '', title: locale === 'ar' ? 'اختيارات المحرر' : "Editor's Picks", desc: locale === 'ar' ? 'أفضل ما اختاره فريقنا هذا الأسبوع.' : 'Handpicked reads for slow, thoughtful attention.' },
          ].map((item, i) => (
            <div key={i} className="glass-card p-7">
              <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-sura-sky/70 mb-3">{item.label}</div>
              <h3 className="font-serif text-lg font-bold mb-2 text-sura-ink">{item.title}</h3>
              <p className="text-sm leading-relaxed text-sura-ink/55">{item.desc}</p>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}