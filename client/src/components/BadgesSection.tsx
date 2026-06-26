import { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';

interface Badge {
  id: string;
  badgeKey: string;
  title: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
}

interface BadgesSectionProps {
  userId: string;
}

const BADGE_DEFINITIONS = {
  first_article: {
    icon: '📝',
    title: { en: 'First Article', ar: 'أول مقال' },
    description: { en: 'Published your first article', ar: 'نشرت أول مقال لك' }
  },
  first_novel: {
    icon: '📚',
    title: { en: 'First Novel', ar: 'أول رواية' },
    description: { en: 'Published your first novel', ar: 'نشرت أول رواية لك' }
  },
  first_comment: {
    icon: '💬',
    title: { en: 'First Comment', ar: 'أول تعليق' },
    description: { en: 'Left your first comment', ar: 'تركت أول تعليق لك' }
  },
  first_discussion: {
    icon: '🗣️',
    title: { en: 'First Discussion', ar: 'أول نقاش' },
    description: { en: 'Started your first community discussion', ar: 'بدأت أول نقاش مجتمعي' }
  },
  hundred_likes: {
    icon: '❤️',
    title: { en: '100 Likes', ar: '100 إعجاب' },
    description: { en: 'Received 100 likes on your content', ar: 'تلقيت 100 إعجاب على محتوى لك' }
  },
  hundred_comments: {
    icon: '💯',
    title: { en: '100 Comments', ar: '100 تعليق' },
    description: { en: 'Received 100 comments on your content', ar: 'تلقيت 100 تعليق على محتوى لك' }
  },
  active_reader: {
    icon: '📖',
    title: { en: 'Active Reader', ar: 'قارئ نشط' },
    description: { en: 'Read 10+ chapters', ar: 'قرأ10+ فصول' }
  }
};

export function BadgesSection({ userId }: BadgesSectionProps) {
  const { locale } = useLocale();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const isArabic = locale === 'ar';

  useEffect(() => {
    if (!supabase || !userId) return;

    const client = supabase;
    const fetchBadges = async () => {
      setLoading(true);
      try {
        const { data, error } = await client
          .from('Badge')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false });

        if (error) throw error;
        setBadges(data || []);
      } catch (err) {
        console.error('Failed to fetch badges:', err);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  const renderBadge = (badge: Badge) => {
    const def = BADGE_DEFINITIONS[badge.badgeKey as keyof typeof BADGE_DEFINITIONS];
    return (
      <div
        key={badge.id}
        className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center"
      >
        <span className="text-3xl">{def?.icon || badge.icon || '🏅'}</span>
        <div>
          <p className="text-sm font-medium text-sura-ivory">
            {def?.title[isArabic ? 'ar' : 'en'] || badge.title}
          </p>
          <p className="text-xs text-sura-ivory/60">
            {def?.description[isArabic ? 'ar' : 'en'] || badge.description}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <span className="text-4xl">🏅</span>
        <p className="mt-3 text-sura-ivory/60">
          {isArabic ? 'لا توجد شارات بعد' : 'No badges yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((badge) => renderBadge(badge))}
    </div>
  );
}