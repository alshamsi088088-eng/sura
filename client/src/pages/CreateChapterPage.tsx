import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useLocale } from '../context/LocaleContext';
import { TipTapEditor } from '../components/TipTapEditor';

type NovelRow = {
  id: string;
  title: string;
  slug: string;
};

type PartRow = {
  id: string;
  title: string;
  number: number;
};

export function CreateChapterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const [searchParams] = useSearchParams();

  const queryNovelId = searchParams.get('novelId') || '';

  const [novels, setNovels] = useState<NovelRow[]>([]);
  const [loadingNovels, setLoadingNovels] = useState(true);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  const [novelId, setNovelId] = useState('');
  const [partId, setPartId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [number, setNumber] = useState<number>(1);
  const [content, setContent] = useState('');
  const [readingTime, setReadingTime] = useState(''); // free text as per schema

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const themeClasses = useMemo(
    () =>
      ({
        card: 'mx-auto max-w-3xl space-y-6 rounded-3xl border border-gold/20 bg-[#0b0f14] p-8',
        heading: 'text-3xl font-semibold text-[#f6f1dc]',
        label: 'block text-sm font-medium text-[#e9e1c4]',
        input:
          'w-full rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none focus:border-[#d8b74a]/60',
        textarea:
          'min-h-48 w-full resize-y rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none focus:border-[#d8b74a]/60',
        primary:
          'w-full rounded-full bg-[#d8b74a] px-4 py-3 text-sm font-semibold text-[#0b0f14] disabled:opacity-60',
        error: 'rounded-3xl bg-red-500/10 p-4 text-sm text-red-200',
      }) as const,
    []
  );

  useEffect(() => {
    let mounted = true;

    async function loadNovels() {
      if (!supabase) {
        setError('تعذر الاتصال بقاعدة البيانات، تحقق من إعدادات Supabase.');
        setLoadingNovels(false);
        return;
      }

      setLoadingNovels(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('Novel')
          .select('id,title,slug')
          .order('createdAt', { ascending: false });

        if (fetchError) throw fetchError;

        if (!mounted) return;
        const rows = (data ?? []) as NovelRow[];
        setNovels(rows);

        // If query provided, use it; otherwise default to first novel
        if (queryNovelId && rows.some((r) => r.id === queryNovelId)) {
          setNovelId(queryNovelId);
        } else if (rows[0]?.id) {
          setNovelId(rows[0].id);
        }
    } catch (e) {
        if (!mounted) return;
        const err = e as { message?: string };
        setError(err?.message ? err.message : 'Failed to load novels.');
      } finally {
        if (mounted) setLoadingNovels(false);
      }
    }

    loadNovels();
    return () => {
      mounted = false;
    };
  }, []);

  // Load parts when novelId changes
  useEffect(() => {
    if (!novelId || !supabase) {
      setParts([]);
      return;
    }

    let mounted = true;
    setLoadingParts(true);

    async function loadParts() {
      const client = supabase;
      if (!client) return;

      try {
        const { data, error: fetchError } = await client
          .from('Part')
          .select('id,title,number')
          .eq('novelId', novelId)
          .order('number', { ascending: true });

        if (fetchError) throw fetchError;
        if (!mounted) return;
        setParts((data ?? []) as PartRow[]);
      } catch (e) {
        // Silent fail - parts are optional
        if (mounted) setParts([]);
      } finally {
        if (mounted) setLoadingParts(false);
      }
    }

    loadParts();
    return () => {
      mounted = false;
    };
  }, [novelId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be signed in to create a chapter.');
      return;
    }

    if (!novelId) {
      setError('Please select a novel.');
      return;
    }
    if (!title.trim()) {
      setError('Chapter title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Chapter content is required.');
      return;
    }
    if (!readingTime.trim()) {
      setError('Reading time is required (e.g., "7 min").');
      return;
    }
    if (!Number.isFinite(number) || number < 1) {
      setError('Chapter order/number must be at least 1.');
      return;
    }

    if (!supabase) {
      setError('تعذر الاتصال بقاعدة البيانات، تحقق من إعدادات Supabase.');
      return;
    }

    setSubmitting(true);
    try {
      const chapterData = {
        novelId,
        title: title.trim(),
        number,
        content: content.trim(),
        readingTime: readingTime.trim(),
      } as { novelId: string; title: string; number: number; content: string; readingTime: string; partId?: string };

      if (partId) {
        chapterData.partId = partId;
      }

      const { error: insertError } = await supabase.from('Chapter').insert(chapterData);

      if (insertError) throw insertError;

      navigate('/dashboard');
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ? e.message : 'Failed to save the chapter. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={themeClasses.card}>
      <h1 className={themeClasses.heading}>Create Chapter</h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={themeClasses.label}>Novel</label>
          <select
            className={themeClasses.input}
            value={novelId}
            onChange={(e) => setNovelId(e.target.value)}
            disabled={loadingNovels || novels.length === 0}
            required
          >
            {novels.length === 0 ? (
              <option value="">{loadingNovels ? 'Loading novels...' : 'No novels found'}</option>
            ) : null}
            {novels.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={themeClasses.label}>Chapter Title</label>
          <input
            className={themeClasses.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chapter title"
            required
          />
        </div>

        <div>
          <label className={themeClasses.label}>Order / Number</label>
          <input
            type="number"
            className={themeClasses.input}
            value={number}
            min={1}
            onChange={(e) => setNumber(Number(e.target.value))}
            required
          />
        </div>

        <div>
          <label className={themeClasses.label}>Part / Volume (optional)</label>
          <select
            className={themeClasses.input}
            value={partId}
            onChange={(e) => setPartId(e.target.value)}
            disabled={loadingParts}
          >
            <option value="">No Part (Root level)</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {locale === 'ar' ? 'جزء' : 'Part'} {p.number}: {p.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={themeClasses.label}>Reading time</label>
          <input
            className={themeClasses.input}
            value={readingTime}
            onChange={(e) => setReadingTime(e.target.value)}
            placeholder='e.g., "5 min"'
            required
          />
        </div>

        <div>
          <label className={themeClasses.label}>Content</label>
          <TipTapEditor theme="chapter" content={content} onChange={setContent} />
        </div>

        <button type="submit" disabled={submitting} className={themeClasses.primary}>
          {submitting ? 'Publishing...' : 'Save Chapter'}
        </button>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate(`/create-chapter?novelId=${encodeURIComponent(novelId)}`)}
            className={themeClasses.primary}
          >
            Create Another Chapter
          </button>
        </div>
      </form>

      {error ? <div className={themeClasses.error}>{error}</div> : null}
    </div>
  );
}
