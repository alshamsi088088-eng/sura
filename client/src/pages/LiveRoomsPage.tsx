import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';
import { useAuth } from '../context/AuthContext';
import { fetchRooms, createRoom, type Room } from '../services/discussionService';
import { EmptyState } from '../components/feed/EmptyState';
import { ErrorState } from '../components/feed/ErrorState';

/**
 * Live Discussion Rooms — browse rooms, search, and create new rooms
 * (members only). Public read browsing; creation requires auth.
 */
export function LiveRoomsPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Discussion');
  const [creating, setCreating] = useState(false);

  useSeoTags({
    title: isArabic ? 'غرف النقاش المباشر | سُرى' : 'Live Discussion Rooms | Sura Codex',
    description: isArabic
      ? 'انضم إلى غرف النقاش المباشر حول الروايات والكتب مع مجتمع سُرى.'
      : 'Join live discussion rooms about novels and books with the Sura Codex community.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/live-rooms`,
    openGraph: { type: 'website' },
    twitter: { cardType: 'summary_large_image' },
    locale,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: isArabic ? 'غرف النقاش المباشر | سُرى' : 'Live Discussion Rooms | Sura Codex',
        url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/live-rooms`,
        inLanguage: locale,
      },
    ],
  });

  const loadRooms = async (targetPage = page, q = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchRooms({ search: q || undefined, page: targetPage, limit: 12 });
      setRooms(res.rooms);
      setTotalPages(res.totalPages);
    } catch {
      setError(isArabic ? 'فشل تحميل الغرف' : 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const handleCreate = async () => {
    if (!user || !title.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createRoom({ title: title.trim(), body: body.trim() || undefined, category });
      setTitle('');
      setBody('');
      setShowCreate(false);
      loadRooms(1, search);
    } catch {
      setError(isArabic ? 'فشل إنشاء الغرفة' : 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-sura-ivory">
              {isArabic ? 'غرف النقاش المباشر' : 'Live Discussion Rooms'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-sura-ivory/60">
              {isArabic
                ? 'ناقش رواياتك وكتبك المفضلة لحظياً مع المجتمع.'
                : 'Discuss your favorite novels and books in real time with the community.'}
            </p>
          </div>
          {user && (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-charcoal hover:opacity-90"
            >
              {isArabic ? '+ غرفة جديدة' : '+ New Room'}
            </button>
          )}
        </div>
      </header>

      {showCreate && user && (
        <div className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isArabic ? 'عنوان الغرفة' : 'Room title'}
              className="min-w-[220px] flex-1 rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
            >
              <option>Discussion</option>
              <option>Novel</option>
              <option>Book</option>
              <option>Fan Content</option>
              <option>Question</option>
            </select>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="rounded-full bg-sura-teal px-5 py-2 text-sm font-semibold text-sura-navy disabled:opacity-50"
            >
              {creating ? '…' : isArabic ? 'إنشاء' : 'Create'}
            </button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={isArabic ? 'وصف الغرفة (اختياري)' : 'Room description (optional)'}
            className="mt-3 w-full resize-none rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 px-4 py-3 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
          />
        </div>
      )}

      {/* Search */}
      <div className="flex justify-end">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={isArabic ? 'ابحث...' : 'Search rooms...'}
          className="w-full max-w-xs rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
        />
      </div>

      {error && <ErrorState message={error} onRetry={() => loadRooms(1, search)} />}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl border border-sura-line bg-sura-canvas" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          title={isArabic ? 'لا توجد غرف' : 'No rooms yet'}
          description={isArabic ? 'كن أول من ينشئ غرفة نقاش!' : 'Be the first to start a discussion room!'}
          action={
            user ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-charcoal"
              >
                {isArabic ? 'إنشاء غرفة' : 'Create a room'}
              </button>
            ) : (
              <Link to="/login" className="rounded-full border border-sura-gold px-5 py-2 text-sm font-semibold text-sura-gold">
                {isArabic ? 'تسجيل الدخول' : 'Log in'}
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/live-rooms/${room.id}`}
              className="group rounded-3xl border border-sura-line bg-sura-canvas p-6 transition hover:border-sura-gold/50"
            >
              <h2 className="mb-1 font-inter text-lg font-semibold text-sura-ivory group-hover:text-sura-gold">
                {room.title}
              </h2>
              {room.body && <p className="mb-4 line-clamp-2 text-sm text-sura-ivory/60">{room.body}</p>}
              <div className="flex flex-wrap items-center gap-2 text-xs text-sura-ivory/50">
                <span className="rounded-full bg-sura-ivory/10 px-2 py-0.5">{room.category}</span>
                <span>👥 {room.memberCount}</span>
                <span>💬 {room.messageCount}</span>
                {room.isPinned && <span>📌</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-sura-ivory/20 px-4 py-1.5 text-sm text-sura-ivory/70 disabled:opacity-40"
          >
            {isArabic ? 'السابق' : 'Prev'}
          </button>
          <span className="px-2 py-1.5 text-sm text-sura-ivory/50">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-sura-ivory/20 px-4 py-1.5 text-sm text-sura-ivory/70 disabled:opacity-40"
          >
            {isArabic ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}

export default LiveRoomsPage;
