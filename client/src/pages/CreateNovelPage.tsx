import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';
import { ReactQuillEditor } from '../components/ReactQuillEditor';
import { generateSlug } from '../lib/generateSlug';


export function CreateNovelPage() {
  const { user } = useAuth();

  const navigate = useNavigate();
  const { locale } = useLocale();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const themeClasses = useMemo(
    () =>
      ({
        container: 'min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4',
        card: 'mx-auto max-w-3xl space-y-6 rounded-3xl border border-slate-700 bg-slate-800 p-8',
        heading: 'text-3xl font-semibold text-white',
        subheading: 'text-slate-400',
        label: 'block text-sm font-medium text-slate-300',
        input:
          'w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
        textarea:
          'min-h-32 w-full resize-y rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
        fileInput: 'w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white outline-none focus:border-purple-500 file:mr-4 file:rounded-full file:border-0 file:bg-purple-600 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-white',
        primary:
          'w-full rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 transition',
        error: 'rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-sm text-red-300',
      }) as const,
    []
  );

  const slug = useMemo(() => generateSlug(title), [title]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const url = URL.createObjectURL(file);
      setCoverImage(url);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError(locale === 'ar' ? 'يجب تسجيل الدخول لإنشاء رواية.' : 'You must be signed in to create a novel.');
      return;
    }

    if (!title.trim()) {
      setError(locale === 'ar' ? 'عنوان الرواية مطلوب.' : 'Novel title is required.');
      return;
    }

    if (title.trim().length < 10) {
      setError(locale === 'ar' ? 'العنوان قصير جداً (10 أحرف على الأقل).' : 'Title is too short (minimum 10 characters).');
      return;
    }


    if (!description.trim()) {
      setError(locale === 'ar' ? 'وصف الرواية مطلوب.' : 'Novel description is required.');
      return;
    }

    if (!supabase) {
      setError(locale === 'ar' ? 'تعذر الاتصال بقاعدة البيانات.' : 'Unable to connect to database.');
      return;
    }

    // Duplicate slug protection (pre-insert)
    const { data: existingNovel, error: existingError } = await supabase
      .from('Novel')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingError) {
      console.error('Duplicate slug check error:', existingError);
      setError(locale === 'ar' ? 'خطأ في التحقق من الرابط.' : 'Error validating slug.');
      return;
    }

    if (existingNovel) {
      setError(locale === 'ar' ? 'يوجد محتوى آخر بنفس الرابط.' : 'A record with this slug already exists.');
      return;
    }

    setSubmitting(true);
    try {
      let coverImageUrl = '';


      // ✅ Upload cover image if file is selected
      if (coverImageFile) {
        const fileName = `novel-${Date.now()}-${coverImageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, coverImageFile);

        if (uploadError) {
          console.error('Cover upload error:', uploadError);
          setError(locale === 'ar' ? 'فشل رفع الصورة.' : 'Failed to upload cover image.');
          setSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName);
        coverImageUrl = urlData.publicUrl;
      }

      const authorId = user.id;
      const finalAuthorName = authorName.trim() || user.name || 'Anonymous';

      // ✅ Only fields that exist in Novel schema
      const payload = {
        title: title.trim(),
        slug,
        description: description.trim(),
        authorId,
        authorName: finalAuthorName,
        coverImage: coverImageUrl,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('Novel')
        .insert(payload)
        .select('id,title,slug')
        .single();

      if (insertError) throw insertError;

      trackEvent('novel_created', {
        novel_id: inserted.id,
        novel_title: title,
        author: finalAuthorName,
      });

      // ✅ Redirect to create first chapter
      navigate(`/create-chapter?novelId=${encodeURIComponent(inserted.id)}`);
    } catch (err) {
      const e = err as { message?: string };
      console.error('Create novel error:', e);
      setError(
        e?.message || (locale === 'ar' ? 'فشل حفظ الرواية.' : 'Failed to save the novel.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={themeClasses.container}>
      <div className={themeClasses.card}>
        <div>
          <h1 className={themeClasses.heading}>
            {locale === 'ar' ? 'إنشاء رواية جديدة' : 'Create New Novel'}
          </h1>
          <p className={themeClasses.subheading}>
            {locale === 'ar' ? 'شارك روايتك مع القراء' : 'Share your story with readers'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Title */}
          <div>
            <label className={themeClasses.label}>
              {locale === 'ar' ? 'العنوان' : 'Title'}
            </label>
            <input
              className={themeClasses.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === 'ar' ? 'عنوان الرواية' : 'Novel title'}
              required
            />
          </div>

          {/* Slug (read-only) */}
          <div>
            <label className={themeClasses.label}>
              {locale === 'ar' ? 'الرابط (تلقائي)' : 'URL Slug (auto)'}
            </label>
            <input
              className={themeClasses.input}
              value={slug}
              readOnly
              disabled
            />
          </div>

          {/* Description */}
          <div>
            <label className={themeClasses.label}>
              {locale === 'ar' ? 'الوصف' : 'Description'}
            </label>
            <ReactQuillEditor
              value={description}
              onChange={setDescription}
              placeholder={locale === 'ar' ? 'قصة الرواية...' : 'Describe your novel...'}
            />
          </div>


          {/* Author Name */}
          <div>
            <label className={themeClasses.label}>
              {locale === 'ar' ? 'اسم المؤلف (اختياري)' : 'Author Name (optional)'}
            </label>
            <input
              className={themeClasses.input}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={locale === 'ar' ? 'اسمك أو اسم قلمي' : 'Your name or pen name'}
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className={themeClasses.label}>
              {locale === 'ar' ? 'صورة الغلاف' : 'Cover Image'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={themeClasses.fileInput}
            />
            {coverImage && (
              <div className="mt-4 w-32 h-48 rounded-lg overflow-hidden border border-slate-600">
                <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && <div className={themeClasses.error}>{error}</div>}

          {/* Submit Button */}
          <button type="submit" disabled={submitting} className={themeClasses.primary}>
            {submitting
              ? locale === 'ar'
                ? 'جاري النشر...'
                : 'Publishing...'
              : locale === 'ar'
                ? 'إنشاء الرواية'
                : 'Create Novel'}
          </button>

          {/* Info Message */}
          <p className="text-center text-sm text-slate-400">
            {locale === 'ar'
              ? 'بعد إنشاء الرواية، يمكنك إضافة الفصول'
              : 'After creating the novel, you can add chapters'}
          </p>
        </form>
      </div>
    </div>
  );
}