import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '../context/LocaleContext';
import { ThreadedComments } from '../components/ThreadedComments';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AdsenseAd } from '../components/AdsenseAd';
import { LikeShareBar } from '../components/LikeShareBar';
import { LikeButton } from '../components/LikeButton';
import { RatingStars } from '../components/RatingStars';
import { ReactionBar } from '../components/ReactionBar';
import { BookmarkButton } from '../components/BookmarkButton';
import { AdminMenu } from '../components/AdminMenu';

import { ReactQuillEditor } from '../components/ReactQuillEditor';
import { generateSlug } from '../lib/generateSlug';
import { ChapterPollSection } from '../components/ChapterPollSection';
import { ReadingProgress } from '../components/ReadingProgress';
import { ReadingSettings, useReadingSettings } from '../components/ReadingSettings';
import { ContinueReading } from '../components/ContinueReading';
import { trackEvent } from '../lib/analytics';
import { useSeoTags } from '../hooks/useSeoTags';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';



interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  readingTime: string;
  partId?: string | null;
}

interface Part {
  id: string;
  title: string;
  number: number;
  novelId: string;
  chapters: Chapter[];
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
  parts: Part[];
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
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState(1);
  const [nightMode, setNightMode] = useState(true);
  const [showReadingSettings, setShowReadingSettings] = useState(false);

  // Novel author-only edit/delete modal
  const [novelEditOpen, setNovelEditOpen] = useState(false);
  const [novelDeleteOpen, setNovelDeleteOpen] = useState(false);
  const [editNovelTitle, setEditNovelTitle] = useState('');
  const [editNovelDescription, setEditNovelDescription] = useState('');
  const [editNovelError, setEditNovelError] = useState<string>('');


  // Load reading settings
  const { settings: readingSettings, getContentClass } = useReadingSettings();

  const handleNovelEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !activeNovel) return;
    if (user.id !== activeNovel.authorId) return;
    if (!supabase) return;

    setEditNovelError('');

    const updatedSlug = generateSlug(editNovelTitle);

    const payload = {
      title: editNovelTitle.trim(),
      slug: updatedSlug,
      description: editNovelDescription.trim(),
    };

    const { error: updateError } = await supabase
      .from('Novel')
      .update(payload)
      .eq('id', activeNovel.id);

    if (updateError) {
      setEditNovelError(updateError.message);
      return;
    }

    setNovelEditOpen(false);
    navigate('/novels');
  };

  const handleNovelDelete = async () => {
    if (!user || !activeNovel) return;
    if (user.id !== activeNovel.authorId) return;
    if (!supabase) return;

    setEditNovelError('');

    const { error: deleteError } = await supabase
      .from('Novel')
      .delete()
      .eq('id', activeNovel.id);

    if (deleteError) {
      setEditNovelError(deleteError.message);
      return;
    }

    setNovelDeleteOpen(false);
    setActiveNovel(null);
    setActiveChapter(null);

    navigate('/novels');
  };


  // DnD sensors for chapter reordering (author only)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sortable Chapter component
  function SortableChapter({
    chapter,
    isActive,
  }: {
    chapter: Chapter;
    isActive: boolean;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: chapter.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`rounded-xl p-3 text-left text-sm transition ${
          isActive ? 'bg-sura-navy text-white' : 'bg-sura-canvas text-sura-navy/80 hover:bg-sura-teal/20'
        }`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-start justify-between">
          <button
            onClick={() => setActiveChapter(chapter)}
            className="flex-1 text-left font-semibold"
          >
            {chapter.title}
          </button>
              <AdminMenu
                entityType="chapter"
                entityId={chapter.id}
              />

        </div>
        <div className="mt-1 text-xs">{chapter.readingTime}</div>
      </div>
    );
  }

  // Handle chapter reordering (for author)
  const handleChapterDragEnd = async (event: DragEndEvent) => {
    if (!user || !activeNovel?.authorId || user.id !== activeNovel.authorId) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeNovel.chapters.findIndex((c) => c.id === active.id);
    const newIndex = activeNovel.chapters.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const reorderedChapters = arrayMove(activeNovel.chapters, oldIndex, newIndex);
    setActiveNovel({ ...activeNovel, chapters: reorderedChapters });

    try {
      await axios.post(`/api/chapters/${active.id}/reorder`, {
        newNumber: newIndex + 1,
        partId: activeNovel.parts?.find((p) =>
          p.chapters.some((c) => c.id === active.id)
        )?.id,
      });
    } catch (err) {
      // Reload on error
      console.error('Failed to reorder chapter', err);
    }
  };

  // Load saved expanded parts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('expandedParts');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) setExpandedParts(new Set(arr));
      }
    } catch {
      // Ignore
    }
  }, []);

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
                  <div className="flex items-start justify-between">
                    <div className="font-semibold truncate">{novel.title}</div>
                    {user?.id && novel.authorId && user.id === novel.authorId ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditNovelTitle(novel.title);
                            setEditNovelDescription(novel.description);
                            setNovelEditOpen(true);
                          }}
                          className="rounded-full border border-sura-line px-3 py-1 text-xs text-sura-navy/80 hover:bg-sura-navy/10"
                        >
                          {locale === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setNovelDeleteOpen(true);
                          }}
                          className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200 hover:bg-red-500/20"
                        >
                          {locale === 'ar' ? 'حذف' : 'Delete'}
                        </button>
                      </div>
                    ) : (
                      <AdminMenu entityType="novel" entityId={novel.id} />
                    )}
                  </div>

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

        {/* Reading Progress Bar */}
        {activeChapter && activeNovel && (
          <ReadingProgress
            contentType="chapter"
            contentId={activeChapter.id}
            title={activeChapter.title}
            content={activeChapter.content}
          />
        )}

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
              <button
                onClick={() => setShowReadingSettings(true)}
                className="rounded-full border border-sura-line px-4 py-2 text-sm"
                title={locale === 'ar' ? 'إعدادات القراءة' : 'Reading Settings'}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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

          {activeNovel && (
            <div className="mt-4 rounded-2xl border border-sura-line p-3 text-center">
              <Link
                to={`/community/novel/${activeNovel.id}`}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {locale === 'ar' ? 'انضم للنقاش' : 'Join the Discussion'}
              </Link>
            </div>
          )}

          <div className={`mt-6 space-y-6 ${fontSizes[fontSize]}`}>
            <p>{activeChapter?.content || '...'}</p>

            {/* Poll section for chapter */}
            {activeChapter && (
              <ChapterPollSection chapterId={activeChapter.id} />
            )}
          </div>
          <div className="mt-8 space-y-4 rounded-3xl border border-sura-line bg-sura-canvas p-4">
            {/* Show Parts if available, otherwise show all chapters */}
            {activeNovel?.parts && activeNovel.parts.length > 0 ? (
              activeNovel.parts.map((part) => {
                const isExpanded = expandedParts.has(part.id);
                const partChapters = part.chapters || [];
                return (
                  <motion.div
                    key={part.id}
                    className="rounded-xl border border-sura-line overflow-hidden"
                    initial={false}
                    animate={{ backgroundColor: isExpanded ? 'rgba(11, 15, 20, 0.5)' : 'transparent' }}
                  >
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedParts);
                        if (isExpanded) newExpanded.delete(part.id);
                        else newExpanded.add(part.id);
                        setExpandedParts(newExpanded);
                        // Save to localStorage
                        try {
                          localStorage.setItem('expandedParts', JSON.stringify([...newExpanded]));
                        } catch {
                          // Ignore storage errors
                        }
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-sura-navy"
                    >
                      <span>
                        {locale === 'ar' ? 'جزء' : 'Part'} {part.number}: {part.title}
                      </span>
                      <motion.span
                        animate={{ rotate: isExpanded ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▼
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-sura-line"
                        >
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleChapterDragEnd}
                          >
                            <SortableContext
                              items={partChapters.map((c) => c.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="grid gap-2 p-2 sm:grid-cols-3">
                                {partChapters.map((chapter) => (
                                  <SortableChapter
                                    key={chapter.id}
                                    chapter={chapter}
                                    isActive={activeChapter?.id === chapter.id}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              /* Fallback: show all chapters without parts */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleChapterDragEnd}
              >
                <SortableContext
                  items={activeNovel?.chapters.map((c) => c.id) ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(Array.isArray(activeNovel?.chapters) ? activeNovel?.chapters : []).map(
                      (chapter) => (
                        <SortableChapter
                          key={chapter.id}
                          chapter={chapter}
                          isActive={activeChapter?.id === chapter.id}
                        />
                      )
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            )}
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

            {/* Reaction bar */}
            <div className="mt-3">
              <ReactionBar contentType="chapter" contentId={activeChapter.id} />
            </div>
          </div>
        </div>
      )}

      {/* Comments under the selected novel */}
      {activeNovel ? <ThreadedComments entityId={activeNovel.id} entityType="novel" /> : null}

      {/* Reading Settings Modal */}
      <ReadingSettings isOpen={showReadingSettings} onClose={() => setShowReadingSettings(false)} />

      {/* Continue Reading Section */}
      <div className="mt-8 rounded-3xl border border-sura-line bg-sura-canvas p-6">
        <ContinueReading limit={3} showTitle={true} />
      </div>

    </div>
  );
}

