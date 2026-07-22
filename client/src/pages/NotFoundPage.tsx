
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';

export function NotFoundPage() {
  const { locale, strings } = useLocale();
  const isArabic = locale === 'ar';

  useSeoTags({
    title: isArabic ? 'الصفحة غير موجودة (404) | سُرى' : 'Page Not Found (404) | Sura Codex',
    description: isArabic
      ? 'الصفحة التي تبحث عنها غير متوفرة. تصفّح المقالات أو الروايات أو المجتمع.'
      : 'The page you are looking for is not available. Browse articles, novels, or the community.',
    canonicalUrl: typeof window !== 'undefined' ? window.location.href : '',
    noIndex: true,
  });

  return (
    <main
      className="mx-auto max-w-3xl rounded-3xl border border-sura-line bg-sura-canvas p-8 text-center"
      role="main"
      aria-labelledby="page-title"
    >
      <h1
        id="page-title"
        className="text-5xl font-semibold text-sura-teal"
      >
        404
      </h1>
      <p className="mt-4 text-lg font-medium text-sura-navy">
        {isArabic ? 'الصفحة غير موجودة' : 'Page not found'}
      </p>
      <p className="mt-2 text-sm leading-7 text-sura-navy/70">
        {isArabic
          ? 'الصفحة التي تبحث عنها قد تم نقلها أو لم تعد موجودة.'
          : 'The page you are looking for may have been moved or no longer exists.'}
      </p>

      <nav aria-label="Breadcrumb navigation" className="mt-4 text-xs text-sura-navy/60">
        {strings.home} / {strings.articles} / {strings.about}
      </nav>

      <Link
        to="/"
        className="mt-6 inline-block rounded-full bg-sura-gold px-6 py-3 text-sm font-semibold text-sura-dark transition hover:bg-sura-gold/90 focus:outline-none focus:ring-2 focus:ring-sura-gold focus:ring-offset-2"
        aria-label={isArabic ? 'العودة للصفحة الرئيسية' : 'Return to homepage'}
      >
        {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
      </Link>

      <div className="mt-8 border-t border-sura-line pt-6 text-start">
        <h2 className="text-sm font-medium text-sura-navy">
          {isArabic ? 'قد感兴趣的页面' : 'You might be interested in'}
        </h2>
        <ul className="mt-3 space-y-2 text-sm" role="navigation" aria-label="Suggested links">
          {[
            { href: '/articles', label: isArabic ? '📄 المقالات' : '📄 Articles' },
            { href: '/novels', label: isArabic ? '📖 الروايات' : '📖 Novels' },
            { href: '/community', label: isArabic ? '💬 المجتمع' : '💬 Community' }
          ].map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className="text-sura-teal hover:underline focus:outline-none focus:ring-2 focus:ring-sura-teal focus:ring-offset-2"
                aria-label={link.label}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
