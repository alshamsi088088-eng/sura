import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';
import { useAuth } from '../context/AuthContext';
import { createCircle } from '../services/studyCircleService';
import { ErrorState } from '../components/feed/ErrorState';

const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

/**
 * Create-study-circle form. After creation the creator is the owner
 * (backend) and redirects to the new circle page.
 */
export function CreateStudyCirclePage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isArabic = locale === 'ar';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Literature');
  const [dayOfWeek, setDayOfWeek] = useState(1); // 1 = Monday
  const [timeOfDay, setTimeOfDay] = useState('18:00');
  const [timezone, setTimezone] = useState('UTC');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useSeoTags({
    title: isArabic ? 'إنشاء حلقة دراسة | سُرى' : 'Create Study Circle | Sura Codex',
    description: isArabic
      ? 'أنشئ حلقة دراسة جديدة بجدول قراءة وأهداف أسبوعية.'
      : 'Create a new study circle with a reading schedule and weekly goals.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/study-circles/new`,
    openGraph: { type: 'website' },
    twitter: { cardType: 'summary_large_image' },
    locale,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: isArabic ? 'إنشاء حلقة دراسة' : 'Create Study Circle',
        url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/study-circles/new`,
        inLanguage: locale,
      },
    ],
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const circle = await createCircle({
        title: title.trim(),
        description: description.trim(),
        category,
      });
      // Live rooms & circles reuse schedule endpoints; create defaults
      // (Monday 18:00 UTC) server-side. Redirect to the new circle.
      navigate(`/study-circles/${circle.id}`);
    } catch {
      setError(isArabic ? 'فشل إنشاء الحلقة' : 'Failed to create circle');
      setSubmitting(false);
    }
  };

  const days = isArabic ? DAYS_AR : DAYS_EN;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-3xl font-semibold text-sura-ivory">
          {isArabic ? 'إنشاء حلقة دراسة' : 'Create a Study Circle'}
        </h1>
        <p className="mt-2 text-sm text-sura-ivory/60">
          {isArabic
            ? 'اجمع مجموعة قراءة وحدد جدولاً أسبوعياً للقراءة معاً.'
            : 'Gather a reading group and set a weekly schedule to read together.'}
        </p>
      </header>

      {!user && (
        <ErrorState
          message={isArabic ? 'يجب تسجيل الدخول لإنشاء حلقة' : 'You must log in to create a circle'}
          onRetry={() => navigate('/login')}
          retryLabel={isArabic ? 'تسجيل الدخول' : 'Log in'}
        />
      )}

      {user && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-sura-line bg-sura-canvas p-8">
          <div>
            <label htmlFor="circle-title" className="mb-1.5 block text-sm font-medium text-sura-ivory/80">
              {isArabic ? 'عنوان الحلقة' : 'Circle title'}
            </label>
            <input
              id="circle-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={isArabic ? 'مثال: نادي روايات الخيال' : 'e.g. Fantasy Novel Club'}
              className="w-full rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 px-4 py-3 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
            />
          </div>

          <div>
            <label htmlFor="circle-desc" className="mb-1.5 block text-sm font-medium text-sura-ivory/80">
              {isArabic ? 'الوصف' : 'Description'}
            </label>
            <textarea
              id="circle-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder={isArabic ? 'ماذا ستقرؤون؟ وكيف ستدار الحلقة؟' : 'What will you read? How is the circle run?'}
              className="w-full resize-none rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 px-4 py-3 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="circle-category" className="mb-1.5 block text-sm font-medium text-sura-ivory/80">
                {isArabic ? 'الفئة' : 'Category'}
              </label>
              <select
                id="circle-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 px-4 py-3 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
              >
                <option>Literature</option>
                <option>Fantasy</option>
                <option>Science Fiction</option>
                <option>Non-fiction</option>
                <option>Poetry</option>
                <option>Tech</option>
              </select>
            </div>

            <div>
              <label htmlFor="circle-day" className="mb-1.5 block text-sm font-medium text-sura-ivory/80">
                {isArabic ? 'اليوم' : 'Day'}
              </label>
              <select
                id="circle-day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
                className="w-full rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 px-4 py-3 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
              >
                {days.map((d, i) => (
                  <option key={d} value={i + 1}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="circle-time" className="mb-1.5 block text-sm font-medium text-sura-ivory/80">
                {isArabic ? 'الوقت' : 'Time'}
              </label>
              <input
                id="circle-time"
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 px-4 py-3 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
              />
            </div>
          </div>

          <div>
            <label htmlFor="circle-tz" className="mb-1.5 block text-sm font-medium text-sura-ivory/80">
              {isArabic ? 'المنطقة الزمنية' : 'Timezone'}
            </label>
            <input
              id="circle-tz"
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 px-4 py-3 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !title.trim() || !description.trim()}
            className="w-full rounded-full bg-sura-gold px-6 py-3 text-sm font-semibold text-sura-charcoal hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? '…' : isArabic ? 'إنشاء الحلقة' : 'Create circle'}
          </button>
        </form>
      )}
    </div>
  );
}

export default CreateStudyCirclePage;
