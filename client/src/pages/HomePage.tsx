import { motion } from 'framer-motion';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { auth, db } from '../firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { WeeklyTargetBanner } from '../components/WeeklyTargetBanner';
import { Link } from 'react-router-dom';

interface FeatureCard { title: string; description: string; }
interface ReadingProgressItem { uid: string; progress: number; }

export function HomePage() {
  const { locale, strings } = useLocale();
  const { user } = useAuth();
  const [featured, setFeatured] = useState<FeatureCard[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [weeklyProgressCount, setWeeklyProgressCount] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    let mounted = true;

    setFeaturedLoading(true);
    axios
      .get('/api/content/home')
      .then((res) => {
        const next = Array.isArray(res.data?.featured) ? res.data.featured : [];
        if (mounted) setFeatured(next);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setFeaturedLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const q = query(collection(db, 'readingProgress'), where('uid', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => d.data() as ReadingProgressItem);
      if (!items.length) { setWeeklyProgressCount(0); setWeeklyAverage(0); return; }
      setWeeklyProgressCount(items.filter((i) => Number(i.progress || 0) >= 70).length);
      setWeeklyAverage(Math.round(items.reduce((s, i) => s + Number(i.progress || 0), 0) / items.length));
    });
    return () => unsub();
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
