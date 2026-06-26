import { useLocale } from '../context/LocaleContext';
import { AnalyticsOverview } from '../components/AnalyticsOverview';
import { AnalyticsTopContent } from '../components/AnalyticsTopContent';
import { AnalyticsReactionChart } from '../components/AnalyticsReactionChart';
import { AnalyticsTrendChart } from '../components/AnalyticsTrendChart';

export function AnalyticsPage() {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  return (
    <div className="min-h-screen bg-sura-dark p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-sura-ivory">
            {isArabic ? 'لوحة التحليلات' : 'Analytics'}
          </h1>
        </div>

        {/* Overview Cards */}
        <section>
          <h2 className="text-lg font-medium text-sura-ivory mb-4">
            {isArabic ? 'نظرة عامة' : 'Overview'}
          </h2>
          <AnalyticsOverview />
        </section>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Content */}
          <section className="rounded-xl bg-sura-dark p-4 border border-sura-ivory/10">
            <h2 className="text-lg font-medium text-sura-ivory mb-4">
              {isArabic ? 'المحتوى الأكثر مشاهدة' : 'Top Content'}
            </h2>
            <AnalyticsTopContent />
          </section>

          {/* Reaction Breakdown */}
          <section className="rounded-xl bg-sura-dark p-4 border border-sura-ivory/10">
            <h2 className="text-lg font-medium text-sura-ivory mb-4">
              {isArabic ? 'تفاعلات القراء' : 'Reactions'}
            </h2>
            <AnalyticsReactionChart />
          </section>
        </div>

        {/* Trend Chart */}
        <section className="rounded-xl bg-sura-dark p-4 border border-sura-ivory/10">
          <h2 className="text-lg font-medium text-sura-ivory mb-4">
            {isArabic ? 'الاتجاهات' : 'Trends'}
          </h2>
          <AnalyticsTrendChart />
        </section>
      </div>
    </div>
  );
}