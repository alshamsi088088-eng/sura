import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ReaderDashboardOverview } from '../components/ReaderDashboardOverview';
import { ReaderStats } from '../components/ReaderStats';
import { BadgeSystem } from '../components/BadgeSystem';
import { ReadingHistoryList } from '../components/ReadingHistoryList';
import { AvatarUpload } from '../components/AvatarUpload';
import { NotificationCenter } from '../components/NotificationCenter';
import { ContinueReading } from '../components/ContinueReading';
import { WeeklyTargetBanner } from '../components/WeeklyTargetBanner';
import { fetchGoals, updateGoal } from '../services/readerService';
import type { GoalInfo } from '../services/readerService';

function ComingSoonPlaceholder({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-sura-ivory/20 bg-sura-dark/50 py-16 text-center">
      <span className="text-5xl" role="img" aria-hidden="true">{icon}</span>
      <h3 className="mt-4 text-xl font-semibold text-sura-ivory">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-sura-ivory/50">{description}</p>
    </div>
  );
}

export function DashboardPage() {
  const [activeSection, setActiveSection] = useState('dashboard-home');
  const { user } = useAuth();
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  useSeoTags({
    title: isArabic ? 'لوحة القارئ | سُرى' : 'Reader Dashboard | Sura Codex',
    description: isArabic ? 'لوحة تحكم القارئ في سُرى.' : 'Your Sura Codex reader dashboard.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/dashboard`,
    noIndex: true,
  });

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [goals, setGoals] = useState<{ weekly: GoalInfo; monthly: GoalInfo } | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadGoals = async () => {
      try {
        const g = await fetchGoals();
        setGoals(g);
      } catch {
        // ignore
      }
    };
    loadGoals();
  }, [user]);

  const handleGoalUpdate = async (type: 'weekly' | 'monthly', target: number) => {
    try {
      const updated = await updateGoal(type, target);
      setGoals((prev) => prev ? { ...prev, [type]: updated } : null);
    } catch (err) {
      console.error('Failed to update goal:', err);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard-home':
        return (
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Dashboard Overview - Single aggregated endpoint */}
            {user && <ReaderDashboardOverview userId={user.id} />}

            {/* Weekly Target Banner */}
            <WeeklyTargetBanner />

            {/* Profile & Continue Reading */}
            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-8">
                <div className="flex items-center gap-4">
                  <AvatarUpload size="lg" onAvatarChange={() => {}} />
                  <div>
                    <div className="text-xl font-semibold text-sura-ivory">{user?.name}</div>
                    <div className="text-sm text-sura-ivory/60">{user?.role}</div>
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-sm text-sura-ivory/60">
                  <div>{isArabic ? 'البريد الإلكتروني:' : 'Email:'} {user?.email}</div>
                  <div>{isArabic ? 'اللغة' : 'Language'}: {user?.locale.toUpperCase()} / {user?.theme}</div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-8">
                <h2 className="text-xl font-semibold text-sura-ivory">
                  {isArabic ? 'متابعة القراءة' : 'Continue Reading'}
                </h2>
                <div className="mt-4">
                  <ContinueReading limit={3} showTitle={false} />
                </div>
              </section>
            </div>

            {/* Reading Goals */}
            {goals && (
              <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-sura-ivory">
                  {isArabic ? 'أهداف القراءة' : 'Reading Goals'}
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {/* Weekly Goal */}
                  <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ivory/5 p-5">
                    <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
                      {isArabic ? 'الهدف الأسبوعي' : 'WEEKLY GOAL'}
                    </div>
                    <div className="mt-2 font-serif text-3xl font-bold text-sura-ivory">
                      {goals.weekly.progress}/{goals.weekly.target}
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-sura-ivory/10">
                      <div
                        className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
                        style={{ width: `${goals.weekly.percentage}%` }}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[3, 5, 7, 10].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleGoalUpdate('weekly', val)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            goals.weekly.target === val
                              ? 'border-[#7F77DD] bg-[#7F77DD]/20 text-[#7F77DD]'
                              : 'border-sura-ivory/20 text-sura-ivory/60 hover:border-[#7F77DD]/50'
                          }`}
                          type="button"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Goal */}
                  <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ivory/5 p-5">
                    <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
                      {isArabic ? 'الهدف الشهري' : 'MONTHLY GOAL'}
                    </div>
                    <div className="mt-2 font-serif text-3xl font-bold text-sura-ivory">
                      {goals.monthly.progress}/{goals.monthly.target}
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-sura-ivory/10">
                      <div
                        className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
                        style={{ width: `${goals.monthly.percentage}%` }}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[10, 20, 30, 50].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleGoalUpdate('monthly', val)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            goals.monthly.target === val
                              ? 'border-[#7F77DD] bg-[#7F77DD]/20 text-[#7F77DD]'
                              : 'border-sura-ivory/20 text-sura-ivory/60 hover:border-[#7F77DD]/50'
                          }`}
                          type="button"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Achievements - Badge System */}
            {user && (
              <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
                <BadgeSystem userId={user.id} />
              </section>
            )}
          </div>
        );

      case 'reading-stats':
        return (
          <div className="mx-auto max-w-6xl">
            {user && <ReaderStats userId={user.id} />}
          </div>
        );

      case 'achievements':
        return (
          <div className="mx-auto max-w-6xl">
            {user && (
              <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
                <BadgeSystem userId={user.id} />
              </section>
            )}
          </div>
        );

      case 'reading-history':
        return (
          <div className="mx-auto max-w-4xl">
            <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-sura-ivory">
                {isArabic ? 'سجل القراءة' : 'Reading History'}
              </h2>
              <p className="mt-2 text-sm text-sura-ivory/50">
                {isArabic ? 'سجل بكل ما قرأته.' : 'Your complete reading history.'}
              </p>
              <div className="mt-6">
                <ReadingHistoryList />
              </div>
            </section>
          </div>
        );

      case 'reading-goals':
        return (
          <div className="mx-auto max-w-4xl">
            <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-sura-ivory">
                {isArabic ? 'أهداف القراءة' : 'Reading Goals'}
              </h2>
              <p className="mt-2 text-sm text-sura-ivory/50">
                {isArabic ? 'حدد أهداف قراءة أسبوعية وشهرية.' : 'Set weekly and monthly reading goals.'}
              </p>
              <div className="mt-6 space-y-6">
                {goals && (
                  <>
                    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ivory/5 p-6">
                      <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
                        {isArabic ? 'الهدف الأسبوعي' : 'WEEKLY GOAL'}
                      </div>
                      <div className="mt-2 font-serif text-4xl font-bold text-sura-ivory">
                        {goals.weekly.progress}/{goals.weekly.target}
                      </div>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-sura-ivory/10">
                        <div
                          className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
                          style={{ width: `${goals.weekly.percentage}%` }}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[3, 5, 7, 10, 15, 20].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleGoalUpdate('weekly', val)}
                            className={`rounded-full border px-4 py-1.5 text-sm transition ${
                              goals.weekly.target === val
                                ? 'border-[#7F77DD] bg-[#7F77DD]/20 text-[#7F77DD]'
                                : 'border-sura-ivory/20 text-sura-ivory/60 hover:border-[#7F77DD]/50'
                            }`}
                            type="button"
                          >
                            {val} {isArabic ? 'قراءة' : 'reads'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ivory/5 p-6">
                      <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
                        {isArabic ? 'الهدف الشهري' : 'MONTHLY GOAL'}
                      </div>
                      <div className="mt-2 font-serif text-4xl font-bold text-sura-ivory">
                        {goals.monthly.progress}/{goals.monthly.target}
                      </div>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-sura-ivory/10">
                        <div
                          className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
                          style={{ width: `${goals.monthly.percentage}%` }}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[10, 20, 30, 50, 75, 100].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleGoalUpdate('monthly', val)}
                            className={`rounded-full border px-4 py-1.5 text-sm transition ${
                              goals.monthly.target === val
                                ? 'border-[#7F77DD] bg-[#7F77DD]/20 text-[#7F77DD]'
                                : 'border-sura-ivory/20 text-sura-ivory/60 hover:border-[#7F77DD]/50'
                            }`}
                            type="button"
                          >
                            {val} {isArabic ? 'قراءة' : 'reads'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <WeeklyTargetBanner />
              </div>
            </section>
          </div>
        );

      case 'notifications':
        return (
          <div className="mx-auto max-w-4xl">
            <div className="relative">
              <NotificationCenter
                isOpen={true}
                onClose={() => setActiveSection('dashboard-home')}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      activeSection={activeSection}
      onNavigate={setActiveSection}
      title="Reader Dashboard"
      titleAr="لوحة القارئ"
      subtitle="Your reading hub — track progress, earn badges, and reach your goals."
      subtitleAr="مركز القراءة الخاص بك — تتبع التقدم، احصل على الشارات، وحقق أهدافك."
    >
      {renderSection()}
    </DashboardLayout>
  );
}

