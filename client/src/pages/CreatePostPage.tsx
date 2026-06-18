import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useLocale } from '../context/LocaleContext';

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function estimateReadingTime(content: string, wordsPerMinute = 200) {
  const words = content
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.round(words / wordsPerMinute));
  return `${minutes} min`;
}

export function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useLocale();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [category, setCategory] = useState('Technology');
  const [language, setLanguage] = useState('English');

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(() => ['Literature', 'Culture', 'Technology', 'Design', 'Arabic'], []);
  const languages = useMemo(() => ['English', 'Arabic'], []);

  const excerpt = useMemo(() => {
    const raw = content.trim().replace(/\s+/g, ' ');
    return raw.length > 180 ? `${raw.slice(0, 180)}...` : raw;
  }, [content]);

  const slug = useMemo(() => slugify(title), [title]);
  const readingTime = useMemo(() => estimateReadingTime(content), [content]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError(locale === 'ar' ? 'يجب تسجيل الدخول لإنشاء بوست.' : 'You must be signed in to create a post.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError(locale === 'ar' ? 'العنوان والمحتوى مطلوبان.' : 'Title and content are required.');
      return;
    }

    if (!category.trim() || !language.trim()) {
      setError(locale === 'ar' ? 'الرجاء اختيار التصنيف واللغة.' : 'Please choose a category and language.');
      return;
    }

    if (!supabase) {
      setError(locale === 'ar' ? 'تعذر الاتصال بقاعدة البيانات، تحقق من إعدادات Supabase.' : 'Unable to connect to database. Check Supabase configuration.');
      return;
    }

    if (!slug) {
      setError(locale === 'ar' ? 'تعذر إنشاء slug من العنوان.' : 'Failed to generate slug from title.');
      return;
    }

    setSubmitting(true);
    try {
      const authorId = user.id;
      const authorName = user.name || user.email || 'Anonymous';

      const payload = {
        title: title.trim(),
        slug,
        excerpt,
        content: content.trim(),
        category: category.trim(),
        language: language.trim(),
        readingTime,
        authorId,
        authorName,
        featured: false,
        views: 0,
        claps: 0
      };

      const { error: insertError } = await supabase.from('Article').insert(payload);

      if (insertError) throw insertError;

      navigate('/articles');
    } catch (err: any) {
      setError(err?.message ? err.message : 'Failed to save the post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <h1 className="text-3xl font-semibold">{locale === 'ar' ? 'إنشاء بوست' : 'Create Post'}</h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={locale === 'ar' ? 'العنوان' : 'Title'}
          className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
            required
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
            required
          >
            {languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={locale === 'ar' ? 'اكتب منشورك...' : 'Write your post...'}
          className="min-h-48 w-full resize-y rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
          required
        />

        <div className="rounded-3xl border border-sura-line bg-sura-canvas p-4 text-sm text-sura-navy/80">
          <div><span className="font-semibold">{locale === 'ar' ? 'Excerpt' : 'Excerpt'}:</span> {excerpt || '—'}</div>
          <div className="mt-2"><span className="font-semibold">Slug:</span> {slug || '—'}</div>
          <div className="mt-2"><span className="font-semibold">{locale === 'ar' ? 'وقت القراءة' : 'Reading time'}:</span> {readingTime}</div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-sura-gold px-4 py-3 text-sm font-semibold text-sura-dark disabled:opacity-60"
        >
          {submitting ? (locale === 'ar' ? 'جارٍ النشر...' : 'Publishing...') : (locale === 'ar' ? 'نشر' : 'Publish')}
        </button>
      </form>

      {error && <div className="rounded-3xl bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
    </div>
  );
}
