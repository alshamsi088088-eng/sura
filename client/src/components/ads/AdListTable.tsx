import { useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { Ad, AD_POSITIONS } from '../../services/adService';

interface AdListTableProps {
  ads: Ad[];
  loading: boolean;
  filters: { search: string; position: string; enabled: string };
  onFiltersChange: (filters: { search: string; position: string; enabled: string }) => void;
  onEdit: (ad: Ad) => void;
  onDelete: (ad: Ad) => void;
  onToggle: (ad: Ad, enabled: boolean) => void;
}

const POSITION_LABELS: Record<string, { en: string; ar: string }> = {
  HOMEPAGE: { en: 'Homepage', ar: 'الرئيسية' },
  SIDEBAR: { en: 'Sidebar', ar: 'الشريط الجانبي' },
  BETWEEN_ARTICLES: { en: 'Between Articles', ar: 'بين المقالات' },
  FOOTER: { en: 'Footer', ar: 'التذييل' },
  CATEGORY: { en: 'Category Pages', ar: 'صفحات التصنيفات' },
};

const PROVIDER_LABELS: Record<string, { en: string; ar: string }> = {
  adsense: { en: 'AdSense', ar: 'أدسنس' },
  custom_banner: { en: 'Banner', ar: 'بانر' },
};

export function AdListTable({
  ads,
  loading,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onToggle,
}: AdListTableProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [confirmDelete, setConfirmDelete] = useState<Ad | null>(null);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="ad-search" className="sr-only">
            {isArabic ? 'بحث' : 'Search'}
          </label>
          <input
            id="ad-search"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder={isArabic ? 'بحث بالاسم...' : 'Search by name...'}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
          />
        </div>
        <div>
          <label htmlFor="ad-filter-position" className="sr-only">
            {isArabic ? 'الموضع' : 'Position'}
          </label>
          <select
            id="ad-filter-position"
            value={filters.position}
            onChange={(e) => onFiltersChange({ ...filters, position: e.target.value })}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm"
          >
            <option value="">{isArabic ? 'كل المواضع' : 'All positions'}</option>
            {AD_POSITIONS.map((p) => (
              <option key={p} value={p}>
                {isArabic ? POSITION_LABELS[p]?.ar ?? p : POSITION_LABELS[p]?.en ?? p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ad-filter-status" className="sr-only">
            {isArabic ? 'الحالة' : 'Status'}
          </label>
          <select
            id="ad-filter-status"
            value={filters.enabled}
            onChange={(e) => onFiltersChange({ ...filters, enabled: e.target.value })}
            className="w-full rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm"
          >
            <option value="">{isArabic ? 'كل الحالات' : 'All statuses'}</option>
            <option value="true">{isArabic ? 'مفعل' : 'Enabled'}</option>
            <option value="false">{isArabic ? 'معطل' : 'Disabled'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-sura-line bg-sura-canvas">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-sura-line text-xs uppercase tracking-[0.2em] text-sura-navy/60">
              <th className="px-4 py-3 font-medium">{isArabic ? 'الاسم' : 'Name'}</th>
              <th className="px-4 py-3 font-medium">{isArabic ? 'الموضع' : 'Position'}</th>
              <th className="px-4 py-3 font-medium">{isArabic ? 'المزود' : 'Provider'}</th>
              <th className="px-4 py-3 font-medium">{isArabic ? 'الأولوية' : 'Priority'}</th>
              <th className="px-4 py-3 font-medium">{isArabic ? 'الحالة' : 'Status'}</th>
              <th className="px-4 py-3 text-right font-medium">{isArabic ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sura-navy/60">
                  {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
                </td>
              </tr>
            ) : ads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sura-navy/60">
                  {isArabic ? 'لا توجد إعلانات.' : 'No ads found.'}
                </td>
              </tr>
            ) : (
              ads.map((ad) => (
                <tr key={ad.id} className="border-b border-sura-line/50 last:border-0">
                  <td className="px-4 py-3 font-medium">{ad.title}</td>
                  <td className="px-4 py-3">
                    {isArabic ? POSITION_LABELS[ad.position]?.ar ?? ad.position : POSITION_LABELS[ad.position]?.en ?? ad.position}
                  </td>
                  <td className="px-4 py-3">
                    {isArabic ? PROVIDER_LABELS[ad.provider]?.ar ?? ad.provider : PROVIDER_LABELS[ad.provider]?.en ?? ad.provider}
                  </td>
                  <td className="px-4 py-3">{ad.priority}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onToggle(ad, !ad.enabled)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        ad.enabled
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-red-500/15 text-red-500'
                      }`}
                      aria-pressed={ad.enabled}
                    >
                      {ad.enabled ? (isArabic ? 'مفعل' : 'Enabled') : (isArabic ? 'معطل' : 'Disabled')}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(ad)}
                        className="rounded-full border border-sura-line px-3 py-1 text-xs hover:bg-sura-teal/10"
                      >
                        {isArabic ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(ad)}
                        className="rounded-full border border-red-500/30 px-3 py-1 text-xs text-red-500 hover:bg-red-500/10"
                      >
                        {isArabic ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-sura-line bg-sura-canvas p-6">
            <h3 className="text-lg font-semibold">
              {isArabic ? 'حذف الإعلان؟' : 'Delete ad?'}
            </h3>
            <p className="mt-2 text-sm text-sura-navy/70">
              {isArabic
                ? 'لا يمكن التراجع عن هذا الإجراء.'
                : 'This action cannot be undone.'}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-full border border-sura-line px-4 py-2 text-sm"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm text-white"
              >
                {isArabic ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
