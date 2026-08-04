import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import { canonicalUrl } from '../lib/seoUrl';

const pathNames: Record<string, string> = {
  '': 'Home',
  articles: 'Articles',
  tech: 'Tech',
  about: 'About',
  contact: 'Contact',
  privacy: 'Privacy',
  'terms-of-service': 'Terms of Service',
  'cookie-policy': 'Cookie Policy',
  dashboard: 'Dashboard',
  profile: 'Profile',
  admin: 'Admin',
  login: 'Login',
  register: 'Register'
};

// Path segments coming from the URL (e.g. an article slug) are percent-encoded
// (e.g. "%D9%85%D8%B1..."). Known route names in `pathNames` are already
// human-readable, but anything else (slugs) must be decoded before display,
// or Arabic/unicode slugs show up as raw "%D9%85..." sequences.
function decodePart(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

export function Breadcrumbs() {
  const location = useLocation();
  const { locale } = useLocale();
  const parts = location.pathname.split('/').filter(Boolean);

  if (parts.length === 0) return null;

  // Build BreadcrumbList JSON-LD for structured data (helps rich results)
  const baseUrl = (import.meta.env.VITE_PUBLIC_BASE_URL || 'https://sura-codex.com').replace(/\/$/, '');
  const crumbItems = [
    { name: locale === 'ar' ? 'الرئيسية' : 'Home', path: '/' },
    ...parts.map((part, index) => ({
      name: pathNames[part] || decodePart(part),
      path: `/${parts.slice(0, index + 1).join('/')}`,
    })),
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };

  // Inject BreadcrumbList JSON-LD (managed separately from page-level JSON-LD)
  try {
    const id = 'breadcrumb-jsonld';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(breadcrumbJsonLd);
  } catch {
    // SSR safety — ignore in non-browser environments
  }

  return (
    <nav aria-label="breadcrumb" className="mb-6 rounded-3xl border border-sura-sky/20 bg-sura-beige/80 px-4 py-3 text-sm text-sura-navy/70">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/" className="text-sura-navy/70 hover:text-sura-navy">
            {locale === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
        </li>
        {parts.map((part, index) => {
          const href = `/${parts.slice(0, index + 1).join('/')}`;
          const label = pathNames[part] || decodePart(part);
          return (
            <li key={href} className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              {index === parts.length - 1 ? (
                <span className="font-semibold text-sura-navy">{label}</span>
              ) : (
                <Link to={href} className="text-sura-navy/70 hover:text-sura-navy">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

