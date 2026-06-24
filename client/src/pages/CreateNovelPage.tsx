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

const categories = ['Romance', 'Thriller', 'SciFi', 'Fantasy', 'Mystery', 'Historical', 'Drama', 'Horror', 'Comedy'];
const statuses = [
  { value: 'ongoing', labelEn: 'Ongoing', labelAr: 'قيد الكتابة' },
  { value: 'completed', labelEn: 'Completed', labelAr: 'مكتملة' },
];

export function CreateNovelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useLocale();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('ongoing');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

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
          'min-h-32 w-full resize-y rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none focus:border-[#d8b74a]/60',
        select:
          'w-full rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none focus:border-[#d8b74a]/60',
        fileInput: 'w-full rounded-3xl border border-[#c5b07b]/30 bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none focus:border-[#d8b74a]/60 file:mr-4 file:rounded-full file:border-0 file:bg-[#d8b74a] file:px-4 file:py-1 file:text-sm file:font-semibold file:text-[#0b0f14]',
        primary:
          'w-full rounded-full bg-[#d8b74a] px-4 py-3 text-sm font-semibold text-[#0b0f14] disabled:opacity-60',
        error: 'rounded-3xl bg-red-500/10 p-4 text-sm text-red-200',
      }) as const,
    []
  );

  const slug = useMemo(() => slugify(title), [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      // Create preview URL
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

    if (!description.trim()) {
      setError(locale === 'ar' ? 'وصف الرواية مطلوب.' : 'Novel description is required.');
      return;
    }

    if (!category.trim()) {
      setError(locale === 'ar' ? 'الرجاء اختيار التصنيف.' : 'Please select a category.');
      return;
    }

    if (!supabase) {
      setError(locale === 'ar' ? 'تعذر الاتصال بقاعدة البيانات.' : 'Unable to connect to database.');
      return;
    }

    setSubmitting(true);
    try {
      let coverImageUrl = coverImage;

      // Upload cover image if file is selected
      if (coverImageFile) {
        const fileName = `${Date.now()}-${coverImageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, coverImageFile);

        if (uploadError) {
          console.error('Cover upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName);
          coverImageUrl = urlData.publicUrl;
        }
      }

      const authorId = user.id;
      const finalAuthorName = authorName.trim() || user.name || user.email || 'Anonymous';

      const payload = {
        title: title.trim(),
        slug,
        description: description.trim(),
        authorId,
        authorName: finalAuthorName,
        category: category.trim(),
        tags: tags.trim(),
        status: status.trim(),
        coverImage: coverImageUrl,
        views: 0,
        likes: 0,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('Novel')
        .insert(payload)
        .select('id,title,slug')
        .single();

      if (insertError) throw insertError;

      // MVP: بعد إنشاء الرواية مباشرة أرسل الكاتب إلى إنشاء أول فصل
      navigate(`/create-chapter?novelId=${encodeURIComponent(inserted.id)}`);
    } catch (err: any) {
      setError(err?.message ? err.message : (locale === 'ar' ? 'فشل حفظ الرواية.' : 'Failed to save the novel.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={themeClasses.card}>
      <h1 className={themeClasses.heading}>
        {locale === 'ar' ? 'إنشاء رواية جديدة' : 'Create New Novel'}
      </h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={themeClasses.label}>Title / العنوان</label>
          <input
            className={themeClasses.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={locale === 'ar' ? 'عنوان الرواية' : 'Novel title'}
            required
          />
        </div>

        <div>
          <label className={themeClasses.label}>Description / الوصف</label>
          <textarea
            className={themeClasses.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={locale === 'ar' ? 'قصة الرواية...' : 'Describe your novel...'}
            required
          />
        </div>

        <div>
          <label className={themeClasses.label}>Author Name / الكاتب</label>
          <input
            className={themeClasses.input}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={locale === 'ar' ? 'اسم الكاتب (اختياري)' : 'Author name (optional)'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={themeClasses.label}>Category / التصنيف</label>
            <select
              className={themeClasses.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">{locale === 'ar' ? 'اختر التصنيف' : 'Select category'}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={themeClasses.label}>Status / الحالة</label>
            <select
              className={themeClasses.select}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {locale === 'ar' ? s.labelAr : s.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={themeClasses.label}>Tags / الكلمات الدلالية</label>
          <input
            className={themeClasses.input}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={locale === 'ar' ? ' romance, mystery, drama' : 'romance, mystery, drama'}
          />
        </div>

        <div>
          <label className={themeClasses.label}>Cover Image / غلاف الرواية</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={themeClasses.fileInput}
          />
          {coverImage && (
            <div className="mt-4 relative w-32 h-48 rounded-xl overflow-hidden border border-[#c5b07b]/30">
              <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting} className={themeClasses.primary}>
          {submitting
            ? locale === 'ar'
              ? 'جاري النشر...'
              : 'Publishing...'
            : locale === 'ar'
              ? 'نشر الرواية'
              : 'Publish Novel'}
        </button>
      </form>

      {error ? <div className={themeClasses.error}>{error}</div> : null}
    </div>
  );
}