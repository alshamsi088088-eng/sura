import { useEffect, useState, useCallback } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { adminGetAuditLogs, AuditLogEntry } from '../../services/adService';

export function AuditLogPanel() {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback((pageNum: number, q: string) => {
    setLoading(true);
    adminGetAuditLogs({ search: q || undefined, page: pageNum })
      .then((res) => {
        setLogs(res.logs);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        setLogs([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(page, search), 300);
    return () => clearTimeout(t);
  }, [search, page, load]);

  const actionLabel = (action: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      'ad.create': { en: 'Create', ar: 'إنشاء' },
      'ad.update': { en: 'Update', ar: 'تعديل' },
      'ad.delete': { en: 'Delete', ar: 'حذف' },
      'ad.enable': { en: 'Enable', ar: 'تفعيل' },
      'ad.disable': { en: 'Disable', ar: 'تعطيل' },
    };
    const found = map[action];
    return isArabic ? (found?.ar ?? action) : (found?.en ?? action);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          {isArabic ? 'سجل التدقيق' : 'Audit Log'}
        </h2>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={isArabic ? 'بحث...' : 'Search...'}
          className="w-full max-w-xs rounded-xl border border-sura-line bg-sura-canvas px-3 py-2 text-sm outline-none focus:border-sura-gold"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-sura-line bg-sura-canvas">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-sura-line text-xs uppercase tracking-[0.2em] text-sura-navy/60">
              <th className="px-4 py-3 font-medium">{isArabic ? 'الإجراء' : 'Action'}</th>
              <th className="px-4 py-3 font-medium">{isArabic ? 'الهدف' : 'Target'}</th>
              <th className="px-4 py-3 font-medium">{isArabic ? 'التفاصيل' : 'Details'}</th>
              <th className="px-4 py-3 font-medium">{isArabic ? 'الوقت' : 'Time'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sura-navy/60">
                  {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sura-navy/60">
                  {isArabic ? 'لا توجد سجلات.' : 'No audit logs found.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-sura-line/50 last:border-0">
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-sura-teal/10 px-2 py-0.5 text-xs font-medium text-sura-teal">
                      {actionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.target ?? '—'}{log.targetId ? ` / ${log.targetId}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-sura-navy/70">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-sura-navy/60">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-sura-line px-4 py-1 text-sm disabled:opacity-40"
          >
            {isArabic ? 'السابق' : 'Prev'}
          </button>
          <span className="text-sm text-sura-navy/70">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-sura-line px-4 py-1 text-sm disabled:opacity-40"
          >
            {isArabic ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
