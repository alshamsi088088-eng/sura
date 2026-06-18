
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

export function DashboardPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    axios.get('/api/dashboard').then((res) => setHistory(res.data.history));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'لوحة الأعضاء' : 'Member Dashboard'}</h1>
        <p className="mt-3 text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'مركز تحكمك الشخصي للكتب والمفضلات والمشتريات.' : 'Your hub for bookmarks, reading progress, and purchases.'}</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-sura-gold" />
            <div>
              <div className="text-xl font-semibold">{user?.name}</div>
              <div className="text-sm text-sura-navy/70">{user?.role}</div>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm text-sura-navy/80">
            <div>{locale === 'ar' ? 'البريد الإلكتروني:' : 'Email:'} {user?.email}</div>
            <div>{locale === 'ar' ? 'الإعدادات' : 'Settings'}: {user?.locale.toUpperCase()} / {user?.theme}</div>
          </div>
        </section>
        <section className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'الأنشطة الأخيرة' : 'Recent activity'}</h2>
          <div className="mt-4 space-y-3 text-sm text-sura-navy/80">
            {(Array.isArray(history) ? history : []).map((entry) => (<div key={entry}>{entry}</div>))}
          </div>
        </section>
      </div>
    </div>
  );
}
