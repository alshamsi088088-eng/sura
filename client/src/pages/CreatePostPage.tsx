import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';
import { ReactQuillEditor } from '../components/ReactQuillEditor';
import { generateSlug } from '../lib/generateSlug';


function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(text: string) {
  // Using .replace (not replaceAll) to stay compatible with older TS lib targets.
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}


// Minimal markdown renderer (no deps): headings, bold, italic, code, links, lists, paragraphs.
function renderMarkdownToHtml(markdown: string) {
  const safe = escapeHtml(markdown);

  // code blocks ```...```
  const withCodeBlocks = safe.replace(/```([\s\S]*?)```/g, (_m, code) => {
    return `<pre class="bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs overflow-x-auto"><code>${code}</code></pre>`;
  });

  // inline code
  const withInlineCode = withCodeBlocks.replace(/`([^`]+)`/g, (_m, code) => {
    return `<code class="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-xs">${code}</code>`;
  });

  // headings #, ##, ###
  const withHeadings = withInlineCode
    .replace(/^###\s(.+)$/gm, (_m, t) => `<h3 class="text-lg font-semibold mt-4 mb-2">${t}</h3>`)
    .replace(/^##\s(.+)$/gm, (_m, t) => `<h2 class="text-xl font-semibold mt-4 mb-2">${t}</h2>`)
    .replace(/^#\s(.+)$/gm, (_m, t) => `<h1 class="text-2xl font-semibold mt-4 mb-3">${t}</h1>`);

  // unordered lists - lines starting with - or *
  const withLists = withHeadings.replace(/^(?:\s*[-*]\s.+)(?:\n(?:\s*[-*]\s.+))*$/gm, (block) => {
    const items = block
      .split(/\n/)
      .map((line) => line.replace(/^\s*[-*]\s+/, '').trim())
      .filter(Boolean)
      .map((item) => `<li class="list-disc ml-5 my-1">${item}</li>`)
      .join('');
    return `<ul class="mb-3">${items}</ul>`;
  });

  // links [text](url) with protocol allow-list to avoid javascript: and data:
  const withLinks = withLists.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    const raw = String(url).trim();
    const lower = raw.toLowerCase();
    const isSafeProtocol =
      lower.startsWith('https://') ||
      lower.startsWith('http://') ||
      lower.startsWith('/') ||
      lower.startsWith('#');

    const safeHref = isSafeProtocol ? raw.replace(/"/g, '"') : '#';

    return `<a href="${safeHref}" target="_blank" rel="noreferrer noopener" class="text-purple-300 hover:underline">${text}</a>`;
  });


  // bold **text**
  const withBold = withLinks.replace(/\*\*([^*]+)\*\*/g, (_m, t) => `<strong>${t}</strong>`);

  // italic *text*
  const withItalic = withBold.replace(/(^|\s)\*([^*]+)\*(\s|$)/g, (_m, p1, t, p3) => `${p1}<em>${t}</em>${p3}`);

  // paragraphs: split by blank line, wrap non-empty.
  const normalized = withItalic.replace(/\n\n+/g, '\n\n').trim();
  const paragraphs = normalized
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      // if already a block element, leave it
      if (/^<(h1|h2|h3|pre|ul)\b/i.test(chunk)) return chunk;
      return `<p class="mt-3 text-slate-200 leading-7">${chunk.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');

  return paragraphs;
}

const categories = [
  'Literature',
  'Writing Tips',
  'Author Spotlight',
  'Book Review',
  'Storytelling',
  'Culture',
  'Technology',
  'Lifestyle',
];

export function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useLocale();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');

  const [content, setContent] = useState('');

  const [category, setCategory] = useState('Literature');
  const [language, setLanguage] = useState(locale === 'ar' ? 'ar' : 'en');

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // ✅ input for slug auto-generate from title
  const slug = useMemo(() => generateSlug(title), [title]);


  const wordCount = useMemo(() => {
    const wc = content.trim() ? content.trim().split(/\s+/).length : 0;
    return wc;
  }, [content]);

  const readingTime = useMemo(() => {
    return Math.ceil(wordCount / 200);
  }, [wordCount]);

  const markdownHtml = useMemo(() => {
    // render only client-side for preview
    return renderMarkdownToHtml(content);
  }, [content]);

  const themeClasses = {
    container: 'min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4',
    card: 'mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-700 bg-slate-800 p-8',
    heading: 'text-3xl font-semibold text-white',
    subheading: 'text-slate-400',
    label: 'block text-sm font-medium text-slate-300',
    input:
      'w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
    textarea:
      'min-h-40 w-full resize-y rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
    select: 'w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-purple-500',
    primary:
      'w-full rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 transition',
    secondary:
      'w-full rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 px-4 py-3 text-sm font-semibold transition',
    error: 'rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-sm text-red-300',
    info: 'rounded-lg bg-blue-500/20 border border-blue-500/50 p-4 text-sm text-blue-300',
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError(locale === 'ar' ? 'يجب تسجيل الدخول.' : 'You must be signed in.');
      return;
    }

    if (!title.trim()) {
      setError(locale === 'ar' ? 'العنوان مطلوب.' : 'Title is required.');
      return;
    }

    if (!content.trim()) {
      setError(locale === 'ar' ? 'المحتوى مطلوب.' : 'Content is required.');
      return;
    }

    if (title.trim().length < 10) {
      setError(locale === 'ar' ? 'العنوان قصير جداً (10 أحرف على الأقل).' : 'Title is too short (minimum 10 characters).');
      return;
    }

    // keep existing server validation expectation
    if (wordCount < 300) {
      setError(locale === 'ar' ? 'المحتوى قصير جداً (300 كلمة على الأقل).' : 'Content is too short (minimum 300 words).');
      return;
    }

    // Duplicate slug protection (pre-insert)
    if (!supabase) {
      setError(locale === 'ar' ? 'خطأ في الاتصال.' : 'Connection error.');
      return;
    }

    const { data: existingArticle, error: existingError } = await supabase
      .from('Article')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();


    if (existingError) {
      console.error('Duplicate slug check error:', existingError);
      setError(locale === 'ar' ? 'خطأ في التحقق من الرابط.' : 'Error validating slug.');
      return;
    }

    if (existingArticle) {
      setError(locale === 'ar' ? 'يوجد محتوى آخر بنفس الرابط.' : 'A record with this slug already exists.');
      return;
    }


    if (!supabase) {
      setError(locale === 'ar' ? 'خطأ في الاتصال.' : 'Connection error.');
      return;
    }

    setSubmitting(true);
    try {
      const finalExcerpt = excerpt.trim() || content.trim().substring(0, 150);

      // category & language already inputs
      const payload = {
        title: title.trim(),
        slug,
        excerpt: finalExcerpt,
        content: content.trim(),
        category: category.trim(),
        language,
        authorId: user.id,
        authorName: user.name || user.email || 'Anonymous',
        readingTime: `${readingTime} min`,
        publishedAt: new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('Article')
        .insert(payload)
        .select('id,title,slug')
        .single();

      if (insertError) throw insertError;

      trackEvent('article_published', {
        article_id: inserted.id,
        title,
        category,
        reading_time: readingTime,
      });

      navigate('/articles');
    } catch (err) {
      // TS-safe error handling (no any)
      const e = err as { message?: string };
      console.error('Publish error:', e);
      setError(e?.message || (locale === 'ar' ? 'فشل النشر.' : 'Failed to publish.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={themeClasses.container}>
      <div className={themeClasses.card}>
        <div>
          <h1 className={themeClasses.heading}>{locale === 'ar' ? 'اكتب مقالة جديدة' : 'Write New Article'}</h1>
          <p className={themeClasses.subheading}>{locale === 'ar' ? 'شارك معرفتك وأفكارك' : 'Share your knowledge and thoughts'}</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Title */}
          <div>
            <label className={themeClasses.label}>{locale === 'ar' ? 'العنوان' : 'Title'}</label>
            <input
              className={themeClasses.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === 'ar' ? 'عنوان المقالة' : 'Article title'}
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className={themeClasses.label}>{locale === 'ar' ? 'الرابط (تلقائي)' : 'URL Slug (auto)'}</label>
            <input className={themeClasses.input} value={slug} readOnly disabled />
          </div>

          {/* Excerpt */}
          <div>
            <label className={themeClasses.label}>{locale === 'ar' ? 'الملخص (اختياري)' : 'Excerpt (optional)'}</label>
            <textarea
              className={themeClasses.textarea}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder={locale === 'ar' ? 'ملخص قصير للمقالة' : 'Brief summary'}
              rows={3}
            />
          </div>

{/* Content editor */}
          <div>
            <label className={themeClasses.label}>{locale === 'ar' ? 'المحتوى' : 'Content'}</label>

            <ReactQuillEditor
              value={content}
              onChange={setContent}
              placeholder={locale === 'ar' ? 'اكتب محتوى المقالة...' : 'Write your article...'}
            />

            <p className="text-xs text-slate-400 mt-2">
              {wordCount} {locale === 'ar' ? 'كلمة' : 'words'} {' | '} ~{readingTime} {locale === 'ar' ? 'دقيقة قراءة' : 'min read'}
            </p>
          </div>

          {/* Category & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={themeClasses.label}>{locale === 'ar' ? 'التصنيف' : 'Category'}</label>
              <input
                className={themeClasses.input}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="category-list"
              />
              <datalist id="category-list">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={themeClasses.label}>{locale === 'ar' ? 'اللغة' : 'Language'}</label>
              <select className={themeClasses.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error ? <div className={themeClasses.error}>{error}</div> : null}

          {/* Info */}
          {wordCount >= 300 ? (
            <div className={themeClasses.info}>{locale === 'ar' ? '✅ المقالة جاهزة للنشر' : '✅ Article is ready to publish'}</div>
          ) : null}


          {/* Buttons */}
          <div className="flex gap-4">
            <button type="submit" disabled={submitting} className={themeClasses.primary}>
              {submitting ? (locale === 'ar' ? 'جاري النشر...' : 'Publishing...') : locale === 'ar' ? 'نشر المقالة' : 'Publish Article'}
            </button>
            <button type="button" onClick={() => navigate('/articles')} className={themeClasses.secondary}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

