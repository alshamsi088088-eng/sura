import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';

interface FollowButtonProps {
  targetUserId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FollowButton({ targetUserId, size = 'md' }: FollowButtonProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !supabase) return;
    const checkFollow = async () => {
      const { data } = await supabase!
        .from('Follow')
        .select('id')
        .eq('followerId', user.id)
        .eq('followingId', targetUserId)
        .single();
      setFollowing(!!data);
    };
    checkFollow();
  }, [user, targetUserId]);

  const handleFollow = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      if (following) {
        await supabase!.from('Follow').delete().eq('followerId', user.id).eq('followingId', targetUserId);
        setFollowing(false);
      } else {
        await supabase!.from('Follow').insert({ followerId: user.id, followingId: targetUserId });
        setFollowing(true);
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === targetUserId) return null;

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`rounded-full font-semibold transition ${
        following
          ? 'border border-sura-line bg-sura-canvas text-sura-navy/80'
          : 'bg-sura-teal text-white'
      } ${sizeClasses[size]} disabled:opacity-60`}
    >
      {loading
        ? locale === 'ar'
          ? '...'
          : '...'
        : following
          ? locale === 'ar'
            ? 'إلغاء المتابعة'
            : 'Unfollow'
          : locale === 'ar'
            ? 'متابعة'
            : 'Follow'}
    </button>
  );
}