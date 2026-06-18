import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

type NovelRow = {
  id: string;
  title: string;
  slug: string;
};

export function CreateChapterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [novels, setNovels] = useState<NovelRow[]>([]);
  const [loadingNovels, setLoadingNovels] = useState(true);

  const [novelId, setNovelId] = useState('');
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

        // default to first novel
        if (rows[0]?.id) setNovelId(rows[0].id);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ? e.message : 'Failed to load novels.');
      } finally {
        if (mounted) setLoadingNovels(false);
      }
    }

    loadNovels();
    return () => {
      mounted = false;
    };
  }, []);

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

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('Chapter').insert({
        novelId,
        title: title.trim(),
        number,
        content: content.trim(),
        readingTime: readingTime.trim(),
        // NOTE: schema does not include authorId; if later you add it, we can set it from user.id.
      });

      if (insertError) throw insertError;

      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message ? err.message : 'Failed to save the chapter. Please try again.');
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
          <textarea
            className={themeClasses.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the chapter content..."
            required
          />
        </div>

        <button type="submit" disabled={submitting} className={themeClasses.primary}>
          {submitting ? 'Publishing...' : 'Publish Chapter'}
        </button>
      </form>

      {error ? <div className={themeClasses.error}>{error}</div> : null}
    </div>
  );
}
