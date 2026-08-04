import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import {
  Ad,
  AdInput,
  adminListAds,
  adminCreateAd,
  adminUpdateAd,
  adminDeleteAd,
  adminToggleAd,
} from '../services/adService';
import { AdForm } from '../components/ads/AdForm';
import { AdListTable } from '../components/ads/AdListTable';
import { AdAnalyticsPanel } from '../components/ads/AdAnalyticsPanel';
import { AuditLogPanel } from '../components/ads/AuditLogPanel';

export function AdManagementPage() {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  const [tab, setTab] = useState<'list' | 'analytics' | 'audit'>('list');
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', position: '', enabled: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListAds({
        search: filters.search || undefined,
        position: filters.position || undefined,
        enabled: filters.enabled === '' ? undefined : filters.enabled === 'true',
      });
      setAds(res.ads);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ads');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => loadAds(), 300);
    return () => clearTimeout(t);
  }, [loadAds]);

  const handleSubmit = async (payload: AdInput) => {
    if (editingAd) {
      await adminUpdateAd(editingAd.id, payload);
    } else {
      await adminCreateAd(payload);
    }
    setShowForm(false);
    setEditingAd(null);
    await loadAds();
  };

  const handleDelete = async (ad: Ad) => {
    await adminDeleteAd(ad.id);
    await loadAds();
  };

  const handleToggle = async (ad: Ad, enabled: boolean) => {
    await adminToggleAd(ad.id, enabled);
    await loadAds();
  };

  const tabs = [
    { id: 'list', label: isArabic ? 'الإعلانات' : 'Ads' },
    { id: 'analytics', label: isArabic ? 'التحليلات' : 'Analytics' },
    { id: 'audit', label: isArabic ? 'سجل التدقيق' : 'Audit Log' },
  ];

  return (
    <DashboardLayout
      activeSection="ads"
      onNavigate={(s) => {
        if (s === 'ads') setTab('list');
      }}
      title="Advertisement Management"
      titleAr="إدارة الإعلانات"
      subtitle="Create, schedule, and track advertising placements."
      subtitleAr="إنشاء وجدولة وتتبع المواضع الإعلانية."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-sura-line bg-sura-canvas p-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as typeof tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? 'bg-sura-teal text-white' : 'text-sura-navy/70 hover:bg-sura-teal/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'list' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setEditingAd(null); setShowForm(true); }}
                className="rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-dark transition hover:opacity-95"
              >
                {isArabic ? '+ إعلان جديد' : '+ New Ad'}
              </button>
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}

            {showForm ? (
              <AdForm
                initial={editingAd}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingAd(null); }}
              />
            ) : (
              <AdListTable
                ads={ads}
                loading={loading}
                filters={filters}
                onFiltersChange={setFilters}
                onEdit={(ad) => { setEditingAd(ad); setShowForm(true); }}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            )}
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedAd(null)}
                className={`rounded-full px-4 py-1.5 text-sm ${!selectedAd ? 'bg-sura-teal text-white' : 'border border-sura-line'}`}
              >
                {isArabic ? 'كل الإعلانات' : 'All Ads'}
              </button>
              {ads.map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => setSelectedAd(ad)}
                  className={`rounded-full px-4 py-1.5 text-sm ${selectedAd?.id === ad.id ? 'bg-sura-teal text-white' : 'border border-sura-line'}`}
                >
                  {ad.title}
                </button>
              ))}
            </div>

            {selectedAd ? (
              <AdAnalyticsPanel ad={selectedAd} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ads.map((ad) => (
                  <AdAnalyticsPanel key={ad.id} ad={ad} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'audit' && <AuditLogPanel />}
      </div>
    </DashboardLayout>
  );
}

export default AdManagementPage;
