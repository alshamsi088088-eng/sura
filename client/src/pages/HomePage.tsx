import { motion } from 'framer-motion';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useMemo, useState } from 'react';

import { WeeklyTargetBanner } from '../components/WeeklyTargetBanner';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useSeoTags } from '../hooks/useSeoTags';
import { getWeeklyReading } from '../components/ReadingProgressTracker';
import { getApiBaseUrl } from '../lib/runtimeConfig';

interface FeatureCard { title: string; description: string; }
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
  const [weeklyProgressCount, setWeeklyProgressCount] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

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
          .select('id, title, excerpt')
          .eq('featured', true)
          .order('publishedAt', { ascending: false })
          .limit(4);

        const next = (featuredArticles || []).map((a: any) => ({
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
    const loadTrending = async () => {
      if (!supabase) return;
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
      const novelItems: TrendingItem[] = (novels || []).map(n => ({ id: n.id, title: n.title, type: 'novel', views: 0 }));
      const allItems: TrendingItem[] = [...articleItems, ...novelItems].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
      setTrending(allItems);
    };
    loadTrending();
  }, []);

  const API_URL = getApiBaseUrl();

  // 3. Weekly Progress Effect
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || !supabase) {
        const weeklyData = getWeeklyReading();
        setWeeklyProgressCount(weeklyData.articles + weeklyData.chapters);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session");

        const res = await fetch(`${API_URL}/api/weekly-progress`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          setWeeklyProgressCount(data.completed || 0);
          setWeeklyAverage(data.average || 0);
          return;
        }
      } catch (err) {
        console.error("Progress fetch failed:", err);
      }

      const weeklyData = getWeeklyReading();
      setWeeklyProgressCount((weeklyData.articles || 0) + (weeklyData.chapters || 0));
      setWeeklyAverage(0);
    };

    fetchProgress();
  }, [user, API_URL]);

  const encouragement = useMemo(() => {
    if (weeklyProgressCount >= 7) return locale === 'ar' ? 'أداء رائع هذا الأسبوع.' : 'Excellent momentum this week.';
    if (weeklyProgressCount >= 3) return locale === 'ar' ? 'استمر، أنت على الطريق الصحيح.' : 'Keep going, you are on track.';
    return locale === 'ar' ? 'ابدأ بهدف بسيط هذا الأسبوع.' : 'Start with a small goal this week.';
  }, [weeklyProgressCount, locale]);

  // (بقية الـ JSX كما هي...)
  // ملاحظة: تأكد أن ملف الـ JSX لا يحتوي على استدعاء مباشر لـ supabase في أماكن غير محمية
  // الكود أعلاه يغطي المنطق الأساسي، ويمكنك نسخ الـ JSX من ملفك السابق ولصقه هنا.
  
  return (
    <div dir={dir}>
      {/* الـ JSX الخاصة بك هنا */}
    </div>
  );
}