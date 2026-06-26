import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
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

type NovelRow = {
  id: string;
  title: string;
  authorId?: string;
  authorName?: string;
};

type PartRow = {
  id: string;
  title: string;
  number: number;
};

export function EditPartsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const [searchParams] = useSearchParams();

  const queryNovelId = searchParams.get('novelId') || '';

  const [novels, setNovels] = useState<NovelRow[]>([]);
  const [loadingNovels, setLoadingNovels] = useState(true);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  // Chapters state for moving between parts
  type ChapterRow = {
    id: string;
    title: string;
    number: number;
    partId?: string | null;
  };
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());

  const [novelId, setNovelId] = useState('');
  const [selectedPart, setSelectedPart] = useState<PartRow | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [number, setNumber] = useState<number>(1);

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Sortable Part component
  function SortablePart({
    part,
    isSelected,
    onClick,
  }: {
    part: PartRow;
    isSelected: boolean;
    onClick: () => void;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({
        id: part.id,
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
        className={`w-full rounded-xl p-3 text-left text-sm transition cursor-grab ${
          isSelected
            ? 'bg-[#d8b74a] text-[#0b0f14]'
            : 'bg-[#0f141b] text-[#e9e1c4] hover:bg-[#c5b07b]/10'
        }`}
        onClick={onClick}
        {...attributes}
        {...listeners}
      >
        <div className="font-semibold">
          {locale === 'ar' ? 'جزء' : 'Part'} {part.number}: {part.title}
        </div>
      </div>
    );
  }

  // DnD sensors
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

  // Handle drag end for parts reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parts.findIndex((p) => p.id === active.id);
    const newIndex = parts.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newParts = arrayMove(parts, oldIndex, newIndex);
    setParts(newParts);

    // Save new order to server
    setSubmitting(true);
    try {
      await axios.post(`/api/parts/${active.id}/reorder`, {
        newNumber: newIndex + 1,
      });
      // Reload to get correct numbers
      const res = await axios.get(`/api/novel/${novelId}/parts`);
      setParts(res.data?.parts ?? []);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Failed to reorder parts.');
      // Reload original order on error
      const res = await axios.get(`/api/novel/${novelId}/parts`);
      setParts(res.data?.parts ?? []);
    } finally {
      setSubmitting(false);
    }
  };

  const themeClasses = useMemo(
    () =>
      ({
        card: 'mx-auto max-w-3xl space-y-6 rounded-3xl border border-gold/20 bg-[#0b0f14] p-8',
        heading: 'text-3xl font-semibold text-[#f6f1dc]',
        label: 'block text-sm font-medium text-[#e9e1c4]',
        input:
          'w-full rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none focus:border-[#d8b74a]/60',
        primary:
          'w-full rounded-full bg-[#d8b74a] px-4 py-3 text-sm font-semibold text-[#0b0f14] disabled:opacity-60',
        secondary:
          'rounded-full border border-[#c5b07b]/30 bg-transparent px-4 py-2 text-sm text-[#e9e1c4] hover:bg-[#c5b07b]/10',
        danger: 'rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700',
        error: 'rounded-3xl bg-red-500/10 p-4 text-sm text-red-200',
      }) as const,
    []
  );

  // Load novels authored by user
  useEffect(() => {
    let mounted = true;

    async function loadNovels() {
      if (!user) {
        setLoadingNovels(false);
        return;
      }

      try {
        const res = await axios.get('/api/novels');
        const allNovels = res.data?.novels ?? [];
        if (!mounted) return;

        // Filter to novels where user is author
        const myNovels = allNovels.filter(
          (n: NovelRow) => n.authorId === user.id || n.authorName === user.name
        );
        setNovels(myNovels);

        if (queryNovelId && myNovels.some((n: NovelRow) => n.id === queryNovelId)) {
          setNovelId(queryNovelId);
        } else if (myNovels[0]?.id) {
          setNovelId(myNovels[0].id);
        }
      } catch (e) {
        if (!mounted) return;
        console.error('Failed to load novels', e);
      } finally {
        if (mounted) setLoadingNovels(false);
      }
    }

    loadNovels();
    return () => {
      mounted = false;
    };
  }, [user, queryNovelId]);

  // Load parts when novelId changes
  useEffect(() => {
    if (!novelId) {
      setParts([]);
      return;
    }

    let mounted = true;
    setLoadingParts(true);

    async function loadParts() {
      try {
        const res = await axios.get(`/api/novel/${novelId}/parts`);
        if (!mounted) return;
        setParts(res.data?.parts ?? []);

        // Also load all chapters for the novel
        const chaptersRes = await axios.get(`/api/novel/${novelId}`);
        if (!mounted) return;
        const novelData = chaptersRes.data?.novel;
        if (novelData?.chapters) {
          // Flatten chapters from parts and root level
          const allChapters: ChapterRow[] = novelData.chapters.map((c: ChapterRow) => ({
            id: c.id,
            title: c.title,
            number: c.number,
            partId: c.partId,
          }));
          setChapters(allChapters);
        } else {
          setChapters([]);
        }
      } catch (e) {
        if (mounted) setParts([]);
        if (mounted) setChapters([]);
      } finally {
        if (mounted) setLoadingParts(false);
      }
    }

    loadParts();
    return () => {
      mounted = false;
    };
  }, [novelId]);

  // Clear form when part changes
  useEffect(() => {
    if (selectedPart) {
      setTitle(selectedPart.title);
      setNumber(selectedPart.number);
    } else {
      setTitle('');
      setNumber(parts.length + 1);
    }
  }, [selectedPart, parts.length]);

  const handleSelectPart = (part: PartRow | null) => {
    setSelectedPart(part);
    if (part) {
      setTitle(part.title);
      setNumber(part.number);
    } else {
      setTitle('');
      setNumber(parts.length + 1);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!novelId) {
      setError('Please select a novel.');
      return;
    }
    if (!title.trim()) {
      setError('Part title is required.');
      return;
    }
    if (!Number.isFinite(number) || number < 1) {
      setError('Part number must be at least 1.');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedPart) {
        // Update existing Part
        await axios.put(`/api/parts/${selectedPart.id}`, {
          title: title.trim(),
          number,
        });
      } else {
        // Create new Part
        await axios.post('/api/parts', {
          title: title.trim(),
          number,
          novelId,
        });
      }

      // Reload parts
      const res = await axios.get(`/api/novel/${novelId}/parts`);
      setParts(res.data?.parts ?? []);
      setSelectedPart(null);
      setTitle('');
      setNumber(parts.length + 1);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Failed to save part.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPart) return;
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا الجزء؟' : 'Are you sure you want to delete this part?')) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await axios.delete(`/api/parts/${selectedPart.id}`, {
        data: { moveToPartId: null }, // Move chapters to root level by default
      });

      // Reload parts
      const reloadRes = await axios.get(`/api/novel/${novelId}/parts`);
      setParts(reloadRes.data?.parts ?? []);
      setSelectedPart(null);
      setTitle('');
      setNumber(parts.length);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string; chapterCount?: number; otherParts?: Array<{ id: string; title: string; number: number }> } } };
      const data = e?.response?.data;

      if (data?.chapterCount && data?.chapterCount > 0 && data?.otherParts?.length) {
        // Show dialog to move chapters
        const targetPart = window.confirm(
          locale === 'ar'
            ? `هذا الجزء يحتوي على ${data.chapterCount} فصول. اضغط "موافق" لنقل الفصول إلى جزء آخر، أو "إلغاء" للتراجع.`
            : `This part has ${data.chapterCount} chapters. Click OK to move them to another part, or Cancel to abort.`
        );
        if (targetPart) {
          // Move chapters to first available part
          await axios.delete(`/api/parts/${selectedPart.id}`, {
            data: { moveToPartId: data.otherParts[0].id },
          });
          const reloadRes = await axios.get(`/api/novel/${novelId}/parts`);
          setParts(reloadRes.data?.parts ?? []);
          setSelectedPart(null);
        }
        setSubmitting(false);
        return;
      }
      setError(data?.error || 'Failed to delete part.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveUp = async () => {
    if (!selectedPart || selectedPart.number <= 1) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/parts/${selectedPart.id}/reorder`, {
        newNumber: selectedPart.number - 1,
      });
      const res = await axios.get(`/api/novel/${novelId}/parts`);
      setParts(res.data?.parts ?? []);
      setSelectedPart(null);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Failed to move part up.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveDown = async () => {
    if (!selectedPart || selectedPart.number >= parts.length) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/parts/${selectedPart.id}/reorder`, {
        newNumber: selectedPart.number + 1,
      });
      const res = await axios.get(`/api/novel/${novelId}/parts`);
      setParts(res.data?.parts ?? []);
      setSelectedPart(null);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Failed to move part down.');
    } finally {
      setSubmitting(false);
    }
  };

  const moveChapterToPart = async (chapterId: string, targetPartId: string | null) => {
    setSubmitting(true);
    try {
      await axios.post(`/api/chapters/${chapterId}/move`, {
        partId: targetPartId,
      });
      // Reload chapters
      const res = await axios.get(`/api/novel/${novelId}`);
      const novelData = res.data?.novel;
      if (novelData?.chapters) {
        const allChapters: ChapterRow[] = novelData.chapters.map((c: ChapterRow) => ({
          id: c.id,
          title: c.title,
          number: c.number,
          partId: c.partId,
        }));
        setChapters(allChapters);
      }
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Failed to move chapter.');
    } finally {
      setSubmitting(false);
    }
  };

  const bulkMoveChapters = async (targetPartId: string | null) => {
    if (selectedChapters.size === 0) return;
    setSubmitting(true);
    try {
      // Move each selected chapter
      await Promise.all(
        Array.from(selectedChapters).map((chapterId) =>
          axios.post(`/api/chapters/${chapterId}/move`, {
            partId: targetPartId,
          })
        )
      );
      // Clear selection and reload
      setSelectedChapters(new Set());
      const res = await axios.get(`/api/novel/${novelId}`);
      const novelData = res.data?.novel;
      if (novelData?.chapters) {
        const allChapters: ChapterRow[] = novelData.chapters.map((c: ChapterRow) => ({
          id: c.id,
          title: c.title,
          number: c.number,
          partId: c.partId,
        }));
        setChapters(allChapters);
      }
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Failed to move chapters.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChapterSelection = (chapterId: string) => {
    const newSel = new Set(selectedChapters);
    if (newSel.has(chapterId)) newSel.delete(chapterId);
    else newSel.add(chapterId);
    setSelectedChapters(newSel);
  };

  const toggleSelectAll = () => {
    if (selectedChapters.size === chapters.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(chapters.map((c) => c.id)));
    }
  };

  if (!user) {
    return (
      <div className={themeClasses.card}>
        <h1 className={themeClasses.heading}>
          {locale === 'ar' ? 'إدارة الأجزاء' : 'Manage Parts'}
        </h1>
        <p className="text-[#e9e1c4]">
          {locale === 'ar'
            ? 'يجب تسجيل الدخول للوصول لهذه الصفحة'
            : 'Please sign in to access this page.'}
        </p>
      </div>
    );
  }

  return (
    <div className={themeClasses.card}>
      <h1 className={themeClasses.heading}>
        {locale === 'ar' ? 'إدارة الأجزاء' : 'Manage Parts'}
      </h1>

      <div>
        <label className={themeClasses.label}>Novel</label>
        <select
          className={themeClasses.input}
          value={novelId}
          onChange={(e) => {
            setNovelId(e.target.value);
            setSelectedPart(null);
          }}
          disabled={loadingNovels || novels.length === 0}
          required
        >
          {novels.length === 0 ? (
            <option value="">
              {loadingNovels ? 'Loading...' : 'No novels found'}
            </option>
          ) : null}
          {novels.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title}
            </option>
          ))}
        </select>
      </div>

      {/* Parts list with drag & drop */}
      <div>
        <label className={themeClasses.label}>
          {locale === 'ar' ? 'الأجزاء (اسحب وأفلت)' : 'Parts (drag & drop)'}
        </label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={parts.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectPart(null)}
                className={`w-full rounded-xl p-3 text-left text-sm transition ${
                  !selectedPart
                    ? 'bg-[#d8b74a] text-[#0b0f14]'
                    : 'bg-[#0f141b] text-[#e9e1c4] hover:bg-[#c5b07b]/10'
                }`}
              >
                + {locale === 'ar' ? 'إضافة جزء جديد' : 'Add New Part'}
              </button>
              {loadingParts ? (
                <div className="text-sm text-[#e9e1c4]/60">Loading...</div>
              ) : (
                parts.map((part) => (
                  <SortablePart
                    key={part.id}
                    part={part}
                    isSelected={selectedPart?.id === part.id}
                    onClick={() => handleSelectPart(part)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Chapters management - move between parts with multi-select */}
      {parts.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <label className={themeClasses.label}>
              {locale === 'ar' ? 'الفصول (نقل بين الأجزاء)' : 'Chapters (move between parts)'}
            </label>
            {selectedChapters.size > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => bulkMoveChapters(null)}
                  disabled={submitting}
                  className="text-xs text-[#e9e1c4] hover:text-[#d8b74a]"
                >
                  {locale === 'ar' ? 'إلغاء تحديد' : 'Unselect'}
                </button>
              </div>
            )}
          </div>

          {/* Bulk move bar */}
          {selectedChapters.size > 0 && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#d8b74a]/20 p-2">
              <span className="text-xs text-[#d8b74a]">
                {selectedChapters.size} {locale === 'ar' ? 'محدد' : 'selected'}
              </span>
              <select
                className="rounded-lg border border-[#c5b07b]/30 bg-[#0b0f14] px-2 py-1 text-xs text-[#e9e1c4]"
                value=""
                onChange={(e) => bulkMoveChapters(e.target.value || null)}
              >
                <option value="">
                  {locale === 'ar' ? 'نقل إلى...' : 'Move to...'}
                </option>
                <option value="">
                  {locale === 'ar' ? 'بدون جزء' : 'No part'}
                </option>
                {parts.map((part) => (
                  <option key={part.id} value={part.id}>
                    {locale === 'ar' ? 'جزء' : 'Part'} {part.number}: {part.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* Select all checkbox */}
            <label className="flex items-center gap-2 rounded-xl bg-[#0f141b] p-2 text-sm">
              <input
                type="checkbox"
                checked={selectedChapters.size === chapters.length && chapters.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4"
              />
              <span className="text-xs text-[#e9e1c4]">
                {locale === 'ar' ? 'تحديد الكل' : 'Select All'}
              </span>
            </label>

            {chapters.map((chapter) => {
              const currentPart = parts.find((p) => p.id === chapter.partId);
              const isSelected = selectedChapters.has(chapter.id);
              return (
                <div
                  key={chapter.id}
                  className={`flex items-center justify-between rounded-xl p-3 text-sm ${
                    isSelected ? 'bg-[#d8b74a]/20' : 'bg-[#0f141b]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleChapterSelection(chapter.id)}
                    className="mr-2 h-4 w-4"
                  />
                  <div className="flex-1 truncate text-[#e9e1c4]">{chapter.title}</div>
                  <select
                    className="rounded-lg border border-[#c5b07b]/30 bg-[#0b0f14] px-2 py-1 text-xs text-[#e9e1c4]"
                    value={chapter.partId || ''}
                    onChange={(e) => moveChapterToPart(chapter.id, e.target.value || null)}
                  >
                    <option value="">
                      {locale === 'ar' ? 'بدون جزء' : 'No part'}
                    </option>
                    {parts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {locale === 'ar' ? 'جزء' : 'Part'} {part.number}: {part.title}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={themeClasses.label}>
            {locale === 'ar' ? 'عنوان الجزء' : 'Part Title'}
          </label>
          <input
            className={themeClasses.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={locale === 'ar' ? 'عنوان الجزء' : 'Part title'}
            required
          />
        </div>

        <div>
          <label className={themeClasses.label}>
            {locale === 'ar' ? 'رقم الجزء' : 'Part Number'}
          </label>
          <input
            type="number"
            className={themeClasses.input}
            value={number}
            min={1}
            onChange={(e) => setNumber(Number(e.target.value))}
            required
          />
        </div>

        <button type="submit" disabled={submitting} className={themeClasses.primary}>
          {submitting
            ? locale === 'ar'
              ? 'جاري الحفظ...'
              : 'Saving...'
            : selectedPart
            ? locale === 'ar'
              ? 'تحديث'
              : 'Update'
            : locale === 'ar'
            ? 'إنشاء'
            : 'Create'}
        </button>

        {selectedPart && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleMoveUp}
              disabled={submitting || selectedPart.number <= 1}
              className={themeClasses.secondary}
              title={locale === 'ar' ? 'تحريك لأعلى' : 'Move Up'}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={handleMoveDown}
              disabled={submitting || selectedPart.number >= parts.length}
              className={themeClasses.secondary}
              title={locale === 'ar' ? 'تحريك لأسفل' : 'Move Down'}
            >
              ▼
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className={themeClasses.danger}
            >
              {locale === 'ar' ? 'حذف' : 'Delete'}
            </button>
          </div>
        )}
      </form>

      {error ? <div className={themeClasses.error}>{error}</div> : null}
    </div>
  );
}