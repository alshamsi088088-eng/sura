import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';
import { useAuth } from '../context/AuthContext';
import { useLiveRoom } from '../context/LiveRoomContext';
import { fetchRoom, markRoomRead, type Room } from '../services/discussionService';
import { LiveChat } from '../components/discussion/LiveChat';
import { OnlineUsersList } from '../components/discussion/OnlineUsersList';
import { PinnedMessagesPanel } from '../components/discussion/PinnedMessagesPanel';
import { MessageSearchBar } from '../components/discussion/MessageSearchBar';
import { ErrorState } from '../components/feed/ErrorState';

/**
 * Full live room view — chat on the left, presence/pins/search sidebar.
 * Joins the room via LiveRoomContext (socket) and marks it read on mount.
 */
export function LiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { user } = useAuth();
  const { joinRoom, leaveRoom } = useLiveRoom();
  const isArabic = locale === 'ar';

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useSeoTags({
    title: room?.title ? `${room.title} | Sura Codex` : 'Live Room | Sura Codex',
    description: room?.body?.slice(0, 160) || 'Join the live discussion room on Sura Codex.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/live-rooms/${id}`,
    openGraph: { type: 'article' },
    twitter: { cardType: 'summary_large_image' },
    locale,
    jsonLd: room
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'DiscussionForumPosting',
            headline: room.title,
            text: room.body?.slice(0, 160) || undefined,
            author: { '@type': 'Person', name: room.author.name },
            url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/live-rooms/${id}`,
            inLanguage: locale,
          },
        ]
      : [],
  });

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setError('');
    fetchRoom(id)
      .then((data) => {
        if (!mounted) return;
        setRoom(data);
        joinRoom(data.id);
        if (user) markRoomRead(data.id).catch(() => {});
      })
      .catch(() => {
        if (mounted) setError(isArabic ? 'الغرفة غير موجودة' : 'Room not found');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
      leaveRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sura-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <ErrorState
          message={error || (isArabic ? 'الغرفة غير موجودة' : 'Room not found')}
          onRetry={() => navigate('/live-rooms')}
          retryLabel={isArabic ? 'العودة للغرف' : 'Back to rooms'}
        />
      </div>
    );
  }

  const isModerator = user?.role === 'admin' || user?.role === 'moderator' || room.author.id === user?.id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/live-rooms"
          className="text-sm text-sura-teal hover:underline"
        >
          ← {isArabic ? 'كل الغرف' : 'All rooms'}
        </Link>
        <span className="text-xs text-sura-ivory/50">
          {room.category} · 👥 {room.memberCount}
        </span>
      </div>

      <header className="mb-6 rounded-3xl border border-sura-line bg-sura-canvas p-6">
        <h1 className="text-2xl font-semibold text-sura-ivory">{room.title}</h1>
        {room.body && <p className="mt-2 text-sm text-sura-ivory/60">{room.body}</p>}
        <p className="mt-3 text-xs text-sura-ivory/40">
          {isArabic ? 'بواسطة' : 'By'} {room.author.name} ·{' '}
          {new Date(room.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Chat */}
        <div className="h-[65vh] rounded-3xl border border-sura-line bg-sura-canvas overflow-hidden">
          <LiveChat roomId={room.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <OnlineUsersList />
          <PinnedMessagesPanel roomId={room.id} isModerator={isModerator} />
          <MessageSearchBar roomId={room.id} />
        </div>
      </div>
    </div>
  );
}

export default LiveRoomPage;
