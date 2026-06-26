import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from './AvatarUpload';

interface FollowersDialogProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
}

interface FollowUser {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
}

export function FollowersDialog({ userId, type, isOpen, onClose }: FollowersDialogProps) {
  const { locale } = useLocale();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isArabic = locale === 'ar';

  useEffect(() => {
    if (!isOpen || !supabase) return;

    const client = supabase;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (type === 'followers') {
          const { data } = await client
            .from('Follow')
            .select('user:followerId, userId, followingId')
            .eq('followingId', userId)
            .limit(50);

          const typedData = data as unknown as { followerId: string }[];
          const userIds = (typedData || []).map((d) => d.followerId);
          if (userIds.length > 0) {
            const { data: profiles } = await client
              .from('User')
              .select('id, name, avatar, bio')
              .in('id', userIds);
            setUsers(profiles || []);
          } else {
            setUsers([]);
          }
        } else {
          const { data } = await client
            .from('Follow')
            .select('user:followingId, userId, followerId')
            .eq('followerId', userId)
            .limit(50);

          const typedData = data as unknown as { followingId: string }[];
          const userIds = (typedData || []).map((d) => d.followingId);
          if (userIds.length > 0) {
            const { data: profiles } = await client
              .from('User')
              .select('id, name, avatar, bio')
              .in('id', userIds);
            setUsers(profiles || []);
          } else {
            setUsers([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch follow users:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-card w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h3 className="text-lg font-semibold text-sura-ivory">
            {type === 'followers'
              ? isArabic
                ? 'المتابعون'
                : 'Followers'
              : isArabic
              ? 'يتابع'
              : 'Following'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sura-ivory/60 hover:bg-white/5 hover:text-sura-ivory"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sura-ivory/50">
            {type === 'followers'
              ? isArabic
                ? 'لا يوجد متابعون بعد'
                : 'No followers yet'
              : isArabic
              ? 'لا يتابع أحد بعد'
              : 'Not following anyone yet'}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {users.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-4 transition hover:bg-white/5"
              >
                <Avatar url={u.avatar || undefined} name={u.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sura-ivory">{u.name}</p>
                  {u.bio && (
                    <p className="truncate text-sm text-sura-ivory/60">{u.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}