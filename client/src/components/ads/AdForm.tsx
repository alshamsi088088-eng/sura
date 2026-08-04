import { useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import {
  Ad,
  AdInput,
  AD_POSITIONS,
  AD_PROVIDERS,
  uploadAdBanner,
} from '../../services/adService';

interface AdFormProps {
  initial?: Ad | null;
  onSubmit: (payload: AdInput) => Promise<void>;
  onCancel: () => void;
}

const PROVIDER_LABELS: Record<string, { en: string; ar: string }> = {
  adsense: { en: 'Google AdSense', ar: 'جوجل أدسنس' },
  custom_banner: { en: 'Custom Banner', ar: 'بانر مخصص' },
};

const POSITION_LABELS: Record<string, { en: string; ar: string }> = {
  HOMEPAGE: { en: 'Homepage', ar: 'الرئيسية' },
  SIDEBAR: { en: 'Sidebar', ar: 'الشريط الجانبي' },
  BETWEEN_ARTICLES: { en: 'Between Articles', ar: 'بين المقالات' },
  FOOTER: { en: 'Footer', ar: 'التذييل' },
  CATEGORY: { en: 'Category Pages', ar: 'صفحات التصنيفات' },
};

export function AdForm({ initial, onSubmit, onCancel }: AdFormProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  const [title, setTitle] = useState(initial?.title ?? '');
  const [provider, setProvider] = useState(initial?.provider ?? 'adsense');
  const [position, setPosition] = useState(initial?.position ?? 'HOMEPAGE');
  const [priority, setPriority] = useState(initial?.priority ?? 0);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [placementKey, setPlacementKey] = useState(
    (initial?.providerData?.placementKey as string | undefined) ?? ''
  );
  const [bannerUrl, setBannerUrl] = useState(initial?.bannerUrl ?? '');
  const [clickUrl, setClickUrl] = useState(initial?.clickUrl ?? '');
  const [altText, setAltText] = useState(initial?.altText ?? '');
  const [startAt, setStartAt] = useState(initial?.startAt ? initial.startAt.slice(0, 10) : '');
  const [endAt, setEndAt] = useState(initial?.endAt ? initial.endAt.slice(0, 10) : '');
  const [targetCategory, setTargetCategory] = useState(
    (initial?.targeting?.category as string | undefined) ?? ''
  );
  const [targetLocale, setTargetLocale] = useState(
    (initial?.targeting?.locale as string | undefined) ?? ''
  );

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBannerUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAdBanner(file);
      setBannerUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError(isArabic ? 'العنوان مطلوب' : 'Title is required');
      return;
    }
    if (provider === 'custom_banner' && !bannerUrl.trim()) {
      setError(isArabic ? 'بانر مخصص يتطلب صورة' : 'Custom banner requires an image');
      return;
    }

    setSubmitting(true);
    try {
      const providerData = provider === 'adsense' && placementKey.trim()
        ? { placementKey: placementKey.trim() }
        : undefined;

      const targeting: Record<string, unknown> = {};
      if (targetCategory.trim()) targeting.category = targetCategory.trim();
      if (targetLocale.trim()) targeting.locale = targetLocale.trim();

      await onSubmit({
        title: title.trim(),
        provider,
        position,
        priority,
        enabled,
        providerData,
        targeting: Object.keys(targeting).length ? targeting : undefined,
        bannerUrl: provider === 'custom_banner' ? bannerUrl.trim() || null : null,
        clickUrl: clickUrl.trim() || null,
        altText: altText.trim() || null,
        startAt: startAt ? new Date(startAt).toISOString() : null,
        endAt: endAt ? new Date(endAt).toISOString() : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
      <h2 className="text-xl font-semibold">
        {isArabic ? (initial ? 'تعديل الإعلان' : 'إعلان جديد') : initial ? 'Edit Ad' : 'New Ad'}
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="ad-title" className="mb-1 block text-sm font-medium text-sura-navy/80">
            {isArabic ? 'العنوان' : 'Title'} *
          </label>
          <input
            id="ad-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
          />
        </div>

        <div>
          <label htmlFor="ad-provider" className="mb-1 block text-sm font-medium text-sura-navy/80">
            {isArabic ? 'المزود' : 'Provider'}
          </label>
          <select
            id="ad-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm"
          >
            {AD_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {isArabic ? PROVIDER_LABELS[p]?.ar ?? p : PROVIDER_LABELS[p]?.en ?? p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ad-position" className="mb-1 block text-sm font-medium text-sura-navy/80">
            {isArabic ? 'الموضع' : 'Position'}
          </label>
          <select
            id="ad-position"
            value={position}
            onChange={(e) => setPosition(e.target.value as typeof position)}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm"
          >
            {AD_POSITIONS.map((p) => (
              <option key={p} value={p}>
                {isArabic ? POSITION_LABELS[p]?.ar ?? p : POSITION_LABELS[p]?.en ?? p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ad-priority" className="mb-1 block text-sm font-medium text-sura-navy/80">
            {isArabic ? 'الأولوية' : 'Priority'}
          </label>
          <input
            id="ad-priority"
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
          />
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm font-medium text-sura-navy/80">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-sura-line"
            />
            {isArabic ? 'مفعل' : 'Enabled'}
          </label>
        </div>

        {provider === 'adsense' && (
          <div className="sm:col-span-2">
            <label htmlFor="ad-placement" className="mb-1 block text-sm font-medium text-sura-navy/80">
              {isArabic ? 'مفتاح الموضع (AdSense)' : 'AdSense Placement Key'}
            </label>
            <input
              id="ad-placement"
              value={placementKey}
              onChange={(e) => setPlacementKey(e.target.value)}
              placeholder="e.g. 1234567890 / 9876543210"
              className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
            />
          </div>
        )}

        {provider === 'custom_banner' && (
          <>
            <div className="sm:col-span-2">
              <label htmlFor="ad-banner-url" className="mb-1 block text-sm font-medium text-sura-navy/80">
                {isArabic ? 'رابط الصورة' : 'Banner Image URL'}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="ad-banner-url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
                />
                <label className="cursor-pointer rounded-xl border border-sura-line px-3 py-2 text-sm text-sura-teal hover:bg-sura-teal/10">
                  {uploading ? '...' : isArabic ? 'رفع' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleBannerUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="ad-click-url" className="mb-1 block text-sm font-medium text-sura-navy/80">
                {isArabic ? 'رابط النقر' : 'Click URL'}
              </label>
              <input
                id="ad-click-url"
                value={clickUrl}
                onChange={(e) => setClickUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
              />
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="ad-alt" className="mb-1 block text-sm font-medium text-sura-navy/80">
            {isArabic ? 'النص البديل' : 'Alt Text'}
          </label>
          <input
            id="ad-alt"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
          />
        </div>

        <div>
          <label htmlFor="ad-start" className="mb-1 block text-sm font-medium text-sura-navy/80">
            {isArabic ? 'تاريخ البدء' : 'Start Date'}
          </label>
          <input
            id="ad-start"
            type="date"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
          />
        </div>

        <div>
          <label htmlFor="ad-end" className="mb-1 block text-sm font-medium text-sura-navy/80">
            {isArabic ? 'تاريخ الانتهاء' : 'End Date'}
          </label>
          <input
            id="ad-end"
            type="date"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
          />
        </div>

        <div>
          <label htmlFor="ad-target-cat" className="mb-1 block text-sm font-medium text-sura-navy/80">
            {isArabic ? 'التصنيف المستهدف' : 'Target Category'}
          </label>
          <input
            id="ad-target-cat"
            value={targetCategory}
            onChange={(e) => setTargetCategory(e.target.value)}
            placeholder="All"
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
          />
        </div>

        <div>
          <label htmlFor="ad-target-locale" className="mb-1 block text-sm font-medium text-sura-navy/80">
            {isArabic ? 'اللغة المستهدفة' : 'Target Locale'}
          </label>
          <input
            id="ad-target-locale"
            value={targetLocale}
            onChange={(e) => setTargetLocale(e.target.value)}
            placeholder="en, ar"
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
          />
        </div>
      </div>

      {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-dark transition hover:opacity-95 disabled:opacity-60"
        >
          {submitting
            ? isArabic ? 'جاري الحفظ...' : 'Saving...'
            : isArabic ? 'حفظ' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-full border border-sura-line px-5 py-2 text-sm disabled:opacity-60"
        >
          {isArabic ? 'إلغاء' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
