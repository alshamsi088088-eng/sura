import { Link, useLocation } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';

const pathNames: Record<string, string> = {
  '': 'Home',
  articles: 'Articles',
  novels: 'Novels',
  gallery: 'Gallery',
  store: 'Store',
  tech: 'Tech',
  products: 'Products',
  about: 'About',
  contact: 'Contact',
  privacy: 'Privacy',
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
