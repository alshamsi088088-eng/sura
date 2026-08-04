import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useLocale } from '../context/LocaleContext';
import {
  fetchWeeklyStats,
  fetchMonthlyStats,
  fetchCategoryDistribution,
} from '../services/readerService';
import type { WeeklyStats, MonthlyStats, CategoryDistribution } from '../services/readerService';
import { ReadingCalendar } from './ReadingCalendar';

interface ReaderStatsProps {
  userId: string;
}

const COLORS = ['#7F77DD', '#567C8D', '#C8D9E6', '#F5EFEB', '#E7A977', '#6EC5B0', '#D4767A'];

export function ReaderStats({ userId }: ReaderStatsProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [categoryDist, setCategoryDist] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'categories' | 'calendar'>('weekly');

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const [weekly, monthly, categories] = await Promise.all([
          fetchWeeklyStats(),
          fetchMonthlyStats(),
          fetchCategoryDistribution(),
        ]);
        setWeeklyStats(weekly);
        setMonthlyStats(monthly);
        setCategoryDist(categories);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const tabs = [
    { id: 'weekly' as const, label: isArabic ? 'أسبوعي' : 'Weekly' },
    { id: 'monthly' as const, label: isArabic ? 'شهري' : 'Monthly' },
    { id: 'categories' as const, label: isArabic ? 'تصنيفات' : 'Categories' },
    { id: 'calendar' as const, label: isArabic ? 'تقويم' : 'Calendar' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-[#7F77DD] text-white'
                : 'border border-sura-ivory/20 text-sura-ivory/70 hover:border-[#7F77DD]/50'
            }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Weekly Chart */}
      {activeTab === 'weekly' && (
        <div className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6">
          <h3 className="mb-4 text-lg font-semibold text-sura-ivory">
            {isArabic ? 'القراءة الأسبوعية' : 'Weekly Reading'}
          </h3>
          {weeklyStats.length === 0 ? (
            <div className="py-8 text-center text-sura-ivory/50">
              {isArabic ? 'لا توجد بيانات' : 'No data yet'}
            </div>
          ) : (
            <div className="space-y-8">
              {weeklyStats.map((week) => (
                <div key={week.week}>
                  <div className="mb-2 text-sm text-sura-ivory/50">{week.week}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={week.items}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,239,235,0.05)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'rgba(245,239,235,0.5)', fontSize: 10 }}
                        tickFormatter={(val: string) => {
                          const d = new Date(val);
                          return d.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { weekday: 'short' });
                        }}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0c1722',
                          border: '1px solid rgba(245,239,235,0.1)',
                          borderRadius: '8px',
                          color: '#F5EFEB',
                        }}
labelFormatter={(val: React.ReactNode) =>
                          new Date(String(val)).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })
                        }
                      />
                      <Bar dataKey="count" fill="#7F77DD" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Monthly Chart */}
      {activeTab === 'monthly' && (
        <div className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6">
          <h3 className="mb-4 text-lg font-semibold text-sura-ivory">
            {isArabic ? 'القراءة الشهرية' : 'Monthly Reading'}
          </h3>
          {monthlyStats.length === 0 ? (
            <div className="py-8 text-center text-sura-ivory/50">
              {isArabic ? 'لا توجد بيانات' : 'No data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,239,235,0.05)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'rgba(245,239,235,0.5)', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'rgba(245,239,235,0.5)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1722',
                    border: '1px solid rgba(245,239,235,0.1)',
                    borderRadius: '8px',
                    color: '#F5EFEB',
                  }}
                />
                <Bar dataKey="total" fill="#567C8D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Category Distribution */}
      {activeTab === 'categories' && (
        <div className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6">
          <h3 className="mb-4 text-lg font-semibold text-sura-ivory">
            {isArabic ? 'توزيع التصنيفات' : 'Category Distribution'}
          </h3>
          {categoryDist.length === 0 ? (
            <div className="py-8 text-center text-sura-ivory/50">
              {isArabic ? 'لا توجد بيانات' : 'No data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDist}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
paddingAngle={4}
                  label={(props) => {
                    const { category, percentage } = props as any;
                    return `${category} (${percentage}%)`;
                  }}
                  labelLine={false}
                >
                  {categoryDist.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1722',
                    border: '1px solid rgba(245,239,235,0.1)',
                    borderRadius: '8px',
                    color: '#F5EFEB',
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#F5EFEB', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Calendar */}
      {activeTab === 'calendar' && (
        <div className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6">
          <ReadingCalendar userId={userId} />
        </div>
      )}
    </div>
  );
}
