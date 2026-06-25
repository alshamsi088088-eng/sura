import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { ThreadedComments } from '../components/ThreadedComments';
import { useAuth } from '../context/AuthContext';
import { AdsenseAd } from '../components/AdsenseAd';
import { LikeShareBar } from '../components/LikeShareBar';
import { LikeButton } from '../components/LikeButton';
import { RatingStars } from '../components/RatingStars';
import { BookmarkButton } from '../components/BookmarkButton';
import { trackEvent } from '../lib/analytics';
import { useSeoTags } from '../hooks/useSeoTags';



interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  readingTime: string;
}

interface Novel {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorId?: string | null;
  authorName?: string;
  category?: string;
  tags?: string;
  status?: string;
  views?: number;
  likes?: number;
  chapters: Chapter[];
}

const fontSizes = ['text-base', 'text-lg', 'text-xl', 'text-2xl'];

export function NovelsPage() {
  const { locale } = useLocale();
  useSeoTags({
    title: locale === 'ar' ? 'الروايات — سُرى' : 'Novels — Sura Codex',
    description:
      locale === 'ar'
        ? 'استكشف الروايات بسرد متسلسل مع قارئ فصول وتتبع التقدم.'
        : 'Explore serialized novels with a chapter reader and progress tracking.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/novels`,
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
  const navigate = useNavigate();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeNovel, setActiveNovel] = useState<Novel | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [fontSize, setFontSize] = useState(1);
  const [nightMode, setNightMode] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    axios
      .get('/api/novels')
      .then((res) => {
        const nextNovels = Array.isArray(res.data?.novels) ? res.data.novels : [];
        if (!mounted) return;

        setNovels(nextNovels);
        const firstNovel = nextNovels[0] || null;
        setActiveNovel(firstNovel);
        setActiveChapter(firstNovel?.chapters?.[0] || null);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch novels', e);
        if (mounted) setError('Failed to load novels.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const chapters = useMemo(() => activeNovel?.chapters ?? [], [activeNovel]);

  const progress = useMemo(() => {
    if (!activeNovel || !activeChapter) return 0;
    const index = chapters.findIndex((chap) => chap.id === activeChapter.id);
    const len = chapters.length;
    if (!len) return 0;
    return Math.round(((index + 1) / len) * 100);
  }, [activeNovel, activeChapter, chapters]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'الروايات' : 'Novels'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">
              {locale === 'ar'
                ? 'استكشف الروايات مع قارئ مخصص وفهرس فصول.'
                : 'Explore serialized novels with a chapter reader, progress tracking, and night mode.'}
            </p>
          </div>
          {user ? (
            <Link
              to="/create-novel"
              className="self-start rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-dark transition hover:opacity-95"
            >
              {locale === 'ar' ? 'Create Novel' : 'Create Novel'}
            </Link>
          ) : null}
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-sura-line bg-sura-canvas p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-sura-teal">{locale === 'ar' ? 'رواياتي' : 'My novels'}</div>

          <AdsenseAd
            adSlot={import.meta.env.VITE_ADSENSE_NOVELS_SLOT as string}
            minHeightPx={300}
          />

          {(Array.isArray(novels) ? novels : []).map((novel) => (
            <button
              key={novel.id}
              onClick={() => {
                setActiveNovel(novel);
                setActiveChapter(novel.chapters[0] || null);

                trackEvent('novel_read', {
                  novel_id: novel.id,
                  novel_title: novel.title
                });
              }}
              className="block w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-4 text-left text-sm text-sura-navy transition hover:border-sura-teal"
            >
              <div className="flex gap-3">
                {novel.coverImage && (
                  <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0">
                    <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{novel.title}</div>
                  <div className="mt-1 text-xs text-sura-navy/70 line-clamp-2">{novel.description}</div>
                  {novel.category && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-sura-teal">
                      <span>{novel.category}</span>
                      {novel.status && (
                        <span className="px-2 py-0.5 rounded-full bg-sura-gold/20 text-sura-gold">
                          {novel.status === 'completed' ? (locale === 'ar' ? 'مكتملة' : 'Complete') : (locale === 'ar' ? 'قيد الكتابة' : 'Ongoing')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {novel.chapters && (
                <div className="mt-3 flex items-center gap-4 text-xs text-sura-navy/50">
                  <span>📖 {novel.chapters.length} {locale === 'ar' ? 'فصل' : 'chapters'}</span>
                  {novel.views != null && <span>👁 {novel.views}</span>}
                  {novel.likes != null && <span>❤️ {novel.likes}</span>}
                </div>
              )}
            </button>
          ))}
        </aside>

        <article className={`rounded-3xl border border-sura-line p-8 ${nightMode ? 'bg-sura-canvas' : 'bg-sura-cream text-sura-brown'}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-sura-teal">{activeNovel?.title}</div>
              <h2 className="mt-2 text-3xl font-semibold">{activeChapter?.title || '...'}</h2>
            </div>
            <div className="space-y-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
              {user && activeNovel?.authorId && user.id && activeNovel.authorId === user.id ? (
                <button
                  onClick={() => navigate('/create-chapter', { state: { novelId: activeNovel.id } })}
                  className="rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-dark transition hover:opacity-95"
                >
                  {locale === 'ar' ? 'Add New Chapter' : 'Add New Chapter'}
                </button>
              ) : null}

              <button onClick={() => setNightMode((value) => !value)} className="rounded-full border border-sura-line px-4 py-2 text-sm">
                {nightMode ? 'Day reader' : 'Night reader'}
              </button>
              <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="rounded-full border border-sura-line bg-transparent px-4 py-2 text-sm">
                {(Array.isArray(fontSizes) ? fontSizes : []).map((size, index) => (
                  <option key={size} value={index}>{`Font ${index + 1}`}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 rounded-3xl bg-sura-canvas px-4 py-3 text-sm text-sura-navy/80">
            {locale === 'ar' ? 'تقدم القراءة' : 'Reading progress'}: {progress}%
          </div>
          <div className={`mt-6 space-y-6 ${fontSizes[fontSize]}`}>
            <p>{activeChapter?.content || '...'}</p>
          </div>
          <div className="mt-8 grid gap-3 rounded-3xl border border-sura-line bg-sura-canvas p-4 sm:grid-cols-3">
            {(Array.isArray(activeNovel?.chapters) ? activeNovel?.chapters : []).map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => setActiveChapter(chapter)}
                className={`rounded-2xl p-4 text-left text-sm transition ${activeChapter?.id === chapter.id ? 'bg-sura-navy text-white' : 'bg-sura-canvas text-sura-navy/80 hover:bg-sura-canvas'}`}
              >
                <div className="font-semibold">{chapter.title}</div>
                <div className="mt-1 text-xs">{chapter.readingTime}</div>
              </button>
            ))}
          </div>
        </article>
      </div>

      {/* Engagement Bar */}
      {activeNovel && activeChapter && (
        <div className="rounded-3xl border border-sura-line bg-sura-canvas p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <LikeShareBar
              entityId={activeChapter.id}
              entityType="chapter"
              title={activeChapter.title}
            />

            <div className="flex flex-wrap items-center gap-3">
              <LikeButton itemId={activeChapter.id} initialCount={activeNovel.likes ?? 0} />
              <BookmarkButton entityId={activeChapter.id} entityType="book" />
              <RatingStars entityId={activeChapter.id} entityType="book" />
            </div>
          </div>
        </div>
      )}

      {/* Comments under the selected novel */}
      {activeNovel ? <ThreadedComments entityId={activeNovel.id} entityType="novel" /> : null}


    </div>
  );
}

