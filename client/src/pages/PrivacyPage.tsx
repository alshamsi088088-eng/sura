
import { useLocale } from '../context/LocaleContext';

export function PrivacyPage() {
  const { locale } = useLocale();
  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
      <p className="text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'نحترم بياناتك، ونستخدمها لتقديم تجربة قراءة مخصصة وآمنة.' : 'We respect your information and use it only to provide a safe, personalized experience.'}</p>
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'البيانات التي نجمعها' : 'Data we collect'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'بريدك الإلكتروني، تفضيلات اللغة، وسجل القراءة لتحسين تجربتك.' : 'Email, language preferences, and reading history to improve your experience.'}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'النماذج' : 'Communications'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'البريد الإلكتروني للدعم والمشتريات، وتحديثات مهمة حول حسابك.' : 'Email for support, purchases, and account updates.'}</p>
        </div>
      </section>
    </div>
  );
}
