import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';

interface FollowButtonProps {
  targetUserId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function FollowButton({ targetUserId, size = 'md', showCount = true }: FollowButtonProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const isArabic = locale === 'ar';

  const fetchStatus = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { count } = await supabase
        .from('Follow')
        .select('*', { count: 'exact', head: true })
        .eq('followingId', targetUserId);
      setFollowerCount(count || 0);

      if (user.id !== targetUserId) {
        const { data } = await supabase
          .from('Follow')
          .select('id')
          .eq('followerId', user.id)
          .eq('followingId', targetUserId)
          .single();
        setFollowing(!!data);
      }
    } catch (err) {
      console.error('Failed to fetch follow status:', err);
    }
  }, [user, targetUserId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleFollow = async () => {
    if (!user || !supabase || user.id === targetUserId) return;
    setLoading(true);
    try {
      if (following) {
        await supabase.from('Follow').delete().eq('followerId', user.id).eq('followingId', targetUserId);
        setFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from('Follow').insert({ followerId: user.id, followingId: targetUserId });
        setFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.id === targetUserId) return null;

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  if (!user) {
    return (
      <button
        onClick={() => (window.location.href = '/login')}
        className={`rounded-full font-semibold transition bg-purple-600 text-white ${sizeClasses[size]}`}
      >
        {isArabic ? 'متابعة' : 'Follow'}
        {showCount && followerCount > 0 && <span className="ms-1 opacity-70">({followerCount})</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`rounded-full font-semibold transition ${
        following
          ? 'border border-purple-500 bg-transparent text-purple-400 hover:bg-purple-500/10'
          : 'bg-purple-600 text-white hover:bg-purple-700'
      } ${sizeClasses[size]} disabled:opacity-60`}
    >
      {loading
        ? '...'
        : following
          ? isArabic
            ? 'يتابع'
            : 'Following'
          : isArabic
          ? 'متابعة'
          : 'Follow'}
      {showCount && followerCount > 0 && <span className="ms-1 opacity-70">({followerCount})</span>}
    </button>
  );
}