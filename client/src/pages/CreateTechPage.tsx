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

const languages = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Swift', 'Kotlin', 'Ruby', 'PHP'];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

export function CreateTechPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useLocale();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [code, setCode] = useState('');
  const [series, setSeries] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const themeClasses = useMemo(
    () => ({
      card: 'mx-auto max-w-3xl space-y-6 rounded-3xl border border-gold/20 bg-[#0b0f14] p-8',
      heading: 'text-3xl font-semibold text-[#f6f1dc]',
      label: 'block text-sm font-medium text-[#e9e1c4]',
      input:
        'w-full rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none focus:border-[#d8b74a]/60',
      textarea:
        'min-h-32 w-full resize-y rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none focus:border-[#d8b74a]/60',
      codeTextarea:
        'min-h-64 w-full resize-y rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] font-mono outline-none focus:border-[#d8b74a]/60',
      select:
        'w-full rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none focus:border-[#d8b74a]/60',
      primary:
        'w-full rounded-full bg-[#d8b74a] px-4 py-3 text-sm font-semibold text-[#0b0f14] disabled:opacity-60',
      error: 'rounded-3xl bg-red-500/10 p-4 text-sm text-red-200',
    }) as const,
    []
  );

  const slug = useMemo(() => slugify(title), [title]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError(locale === 'ar' ? 'يجب تسجيل الدخول.' : 'You must be signed in.');
      return;
    }

    if (!title.trim() || !code.trim()) {
      setError(locale === 'ar' ? 'العنوان والكود مطلوبان.' : 'Title and code are required.');
      return;
    }

    if (!supabase) {
      setError(locale === 'ar' ? 'تعذر الاتصال بقاعدة البيانات.' : 'Unable to connect to database.');
      return;
    }

    setSubmitting(true);
    try {
      const authorId = user.id;
      const authorName = user.name || user.email || 'Anonymous';

      const payload = {
        title: title.trim(),
        slug,
        excerpt: excerpt.trim(),
        code: code.trim(),
        series: series.trim(),
        tags: tags.trim(),
        language: language.trim(),
        difficulty: difficulty.trim(),
        githubUrl: githubUrl.trim() || null,
        demoUrl: demoUrl.trim() || null,
        authorId,
        authorName,
        views: 0,
        likes: 0,
      };

      const { error: insertError } = await supabase.from('TechArticle').insert(payload);

      if (insertError) throw insertError;

      navigate('/tech');
    } catch (err: any) {
      setError(err?.message ? err.message : (locale === 'ar' ? 'فشل الحفظ.' : 'Failed to save.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={themeClasses.card}>
      <h1 className={themeClasses.heading}>
        {locale === 'ar' ? 'إنشاء مقال تقني' : 'Create Tech Article'}
      </h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={themeClasses.label}>Title / العنوان</label>
          <input
            className={themeClasses.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={locale === 'ar' ? 'عنوان المقال' : 'Article title'}
            required
          />
        </div>

        <div>
          <label className={themeClasses.label}>Excerpt / الملخص</label>
          <textarea
            className={themeClasses.textarea}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder={locale === 'ar' ? 'ملخص قصير...' : 'Brief summary...'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={themeClasses.label}>Language / اللغة</label>
            <select
              className={themeClasses.select}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={themeClasses.label}>Difficulty / مستوى الصعوبة</label>
            <select
              className={themeClasses.select}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={themeClasses.label}>Series / السلسلة</label>
            <input
              className={themeClasses.input}
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              placeholder={locale === 'ar' ? 'اسم السلسلة' : 'Series name'}
            />
          </div>
        </div>

        <div>
          <label className={themeClasses.label}>Tags / الكلمات الدلالية</label>
          <input
            className={themeClasses.input}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={locale === 'ar' ? 'react, hooks, state' : 'react, hooks, state'}
          />
        </div>

        <div>
          <label className={themeClasses.label}>Code / الكود</label>
          <textarea
            className={themeClasses.codeTextarea}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Write your code here..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={themeClasses.label}>GitHub URL (optional)</label>
            <input
              className={themeClasses.input}
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
            />
          </div>

          <div>
            <label className={themeClasses.label}>Demo URL (optional)</label>
            <input
              className={themeClasses.input}
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://demo.example.com"
            />
          </div>
        </div>

        <button type="submit" disabled={submitting} className={themeClasses.primary}>
          {submitting
            ? locale === 'ar'
              ? 'جاري النشر...'
              : 'Publishing...'
            : locale === 'ar'
              ? 'نشر المقال'
              : 'Publish Article'}
        </button>
      </form>

      {error ? <div className={themeClasses.error}>{error}</div> : null}
    </div>
  );
}