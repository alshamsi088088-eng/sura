import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from '../components/AvatarUpload';
import { FollowButton } from '../components/FollowButton';
import { BadgesSection } from '../components/BadgesSection';
import { FollowersDialog } from '../components/FollowersDialog';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
}

interface UserStats {
  articlesCount: number;
  novelsCount: number;
  commentsCount: number;
  likesReceived: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  slug?: string;
  createdAt: string;
}

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { locale } = useLocale();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    articlesCount: 0,
    novelsCount: 0,
    commentsCount: 0,
    likesReceived: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followersDialog, setFollowersDialog] = useState<'followers' | 'following' | null>(null);

  const isArabic = locale === 'ar';

  useEffect(() => {
    if (!id || !supabase) return;

    const client = supabase;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: userData, error } = await client
          .from('User')
          .select('id, name, email, avatar, bio, role, createdAt')
          .eq('id', id)
          .single();

        if (error || !userData) {
          navigate('/not-found');
          return;
        }

        setProfile(userData);

        // Fetch likes on user's articles/novels/chapters
        const [{ data: articleLikes }, { data: novelLikes }, { data: chapterLikes }] = await Promise.all([
          client.from('Like').select('id').eq('articleId', id).is('articleId', null),
          client.from('Like').select('id').eq('novelId', id).is('novelId', null),
          client.from('Like').select('id').eq('chapterId', id).is('chapterId', null)
        ]);

        const [
          { count: articlesCount },
          { count: novelsCount },
          { count: commentsCount },
          { count: followersCount },
          { count: followingCount }
        ] = await Promise.all([
          client.from('Article').select('*', { count: 'exact', head: true }).eq('authorId', id),
          client.from('Novel').select('*', { count: 'exact', head: true }).eq('authorId', id),
          client.from('Comment').select('*', { count: 'exact', head: true }).eq('userId', id),
          client.from('Follow').select('*', { count: 'exact', head: true }).eq('followingId', id),
          client.from('Follow').select('*', { count: 'exact', head: true }).eq('followerId', id)
        ]);

        setStats({
          articlesCount: articlesCount || 0,
          novelsCount: novelsCount || 0,
          commentsCount: commentsCount || 0,
          likesReceived: (articleLikes?.length || 0) + (novelLikes?.length || 0) + (chapterLikes?.length || 0)
        });

        setFollowersCount(followersCount || 0);
        setFollowingCount(followingCount || 0);

        const [articles, novels] = await Promise.all([
          client
            .from('Article')
            .select('id, title, slug, createdAt')
            .eq('authorId', id)
            .order('createdAt', { ascending: false })
            .limit(5),
          client
            .from('Novel')
            .select('id, title, slug, createdAt')
            .eq('authorId', id)
            .order('createdAt', { ascending: false })
            .limit(5)
        ]);

        const activities: RecentActivity[] = [
          ...(articles.data || []).map((a) => ({
            id: a.id,
            type: 'article',
            title: a.title,
            slug: a.slug,
            createdAt: a.createdAt
          })),
          ...(novels.data || []).map((n) => ({
            id: n.id,
            type: 'novel',
            title: n.title,
            slug: n.slug,
            createdAt: n.createdAt
          }))
        ]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);

        setRecentActivity(activities);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        navigate('/not-found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isOwnProfile = currentUser?.id === id;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-sura-dark/50 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Avatar url={profile.avatar || undefined} name={profile.name} size="lg" />

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-sura-ivory">{profile.name}</h1>
              {profile.bio && <p className="mt-2 text-sura-ivory/70">{profile.bio}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <button
                  onClick={() => setFollowersDialog('followers')}
                  className="flex items-center gap-1 text-sura-ivory/70 hover:text-sura-ivory"
                >
                  <span className="font-semibold text-sura-ivory">{followersCount}</span>
                  <span className="text-sm">
                    {isArabic ? 'متابعون' : 'Followers'}
                  </span>
                </button>
                <button
                  onClick={() => setFollowersDialog('following')}
                  className="flex items-center gap-1 text-sura-ivory/70 hover:text-sura-ivory"
                >
                  <span className="font-semibold text-sura-ivory">{followingCount}</span>
                  <span className="text-sm">
                    {isArabic ? 'يتابع' : 'Following'}
                  </span>
                </button>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="shrink-0">
                <FollowButton targetUserId={id!} showCount={false} />
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-bold text-sura-ivory">{stats.articlesCount}</p>
            <p className="text-sm text-sura-ivory/60">
              {isArabic ? 'مقالات' : 'Articles'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-bold text-sura-ivory">{stats.novelsCount}</p>
            <p className="text-sm text-sura-ivory/60">
              {isArabic ? 'روايات' : 'Novels'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-bold text-sura-ivory">{stats.commentsCount}</p>
            <p className="text-sm text-sura-ivory/60">
              {isArabic ? 'تعليقات' : 'Comments'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-bold text-sura-ivory">{stats.likesReceived}</p>
            <p className="text-sm text-sura-ivory/60">
              {isArabic ? 'إعجابات' : 'Likes'}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold text-sura-ivory">
              {isArabic ? 'النشاط الأخير' : 'Recent Activity'}
            </h2>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  to={`/${activity.type === 'article' ? 'articles' : 'novels'}/${activity.slug}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <div>
                    <p className="font-medium text-sura-ivory">{activity.title}</p>
                    <p className="text-sm text-sura-ivory/50">
                      {new Date(activity.createdAt).toLocaleDateString(
                        locale === 'ar' ? 'ar-SA' : 'en-US'
                      )}
                    </p>
                  </div>
                  <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-400">
                    {activity.type === 'article'
                      ? isArabic
                        ? 'مقال'
                        : 'Article'
                      : isArabic
                      ? 'رواية'
                      : 'Novel'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold text-sura-ivory">
            {isArabic ? 'الشارات' : 'Badges'}
          </h2>
          <BadgesSection userId={id!} />
        </div>
      </div>

      {/* Dialogs */}
      {followersDialog && id && (
        <FollowersDialog
          userId={id}
          type={followersDialog}
          isOpen={!!followersDialog}
          onClose={() => setFollowersDialog(null)}
        />
      )}
    </div>
  );
}

export default PublicProfilePage;