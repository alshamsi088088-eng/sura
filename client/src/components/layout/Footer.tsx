import { Link } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

export function Footer() {
  const { locale, strings } = useLocale();
  const { mode } = useTheme();
  const isLight = mode !== 'dark';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const c = {
    bg: isLight ? '#FFFFFF' : '#060d16',
    canvas: isLight ? '#FAF9F7' : 'rgba(245,239,235,0.04)',
    navy: isLight ? '#2F4156' : '#F5EFEB',
    muted: isLight ? 'rgba(32,48,63,0.55)' : 'rgba(245,239,235,0.5)',
    teal: isLight ? '#567C8D' : '#C8D9E6',
    border: isLight ? '#E7E2DC' : 'rgba(245,239,235,0.1)',
  };

  const links = [
    { to: '/', label: strings.home || 'Home' },
    { to: '/articles', label: strings.articles || 'Articles' },
    { to: '/novels', label: strings.novels || 'Novels' },
    { to: '/gallery', label: strings.gallery || 'Gallery' },
    { to: '/about', label: strings.about || 'About' },
    { to: '/contact', label: strings.contact || 'Contact' },
    { to: '/privacy', label: strings.privacy || 'Privacy' },
    { to: '/terms-of-service', label: strings.terms || (locale === 'ar' ? 'شروط الخدمة' : 'Terms of Service') },
  ];

  return (
    <footer style={{ background: c.bg, borderTop: `1px solid ${c.border}` }} dir={dir}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 48, marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                border: `1px solid ${c.border}`,
                background: c.canvas,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/logo.svg" alt="Sura Codex" style={{ width: 28, height: 28 }} />
              </div>
              <span style={{ color: c.navy, fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 19 }}>
                {locale === 'ar' ? 'سُرى كودكس' : 'The Sura Codex'}
              </span>
            </div>
            <p style={{ color: c.muted, fontSize: 13.5, lineHeight: 1.8, maxWidth: 280 }}>
              {locale === 'ar'
                ? 'مساحة هادئة للقراءة والاستكشاف والنشر المدروس بلغتين — حيث تتقاطع الكتابة بالكود.'
                : 'A quiet place for reading, discovery, and thoughtful publishing in two languages — where writing meets code.'}
            </p>
          </div>

          {/* Links */}
          <div>
            <div style={{ color: c.navy, fontWeight: 600, fontSize: 12, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map(link => (
                <Link key={link.to} to={link.to}
                  style={{ color: c.muted, textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.teal)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.muted)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div style={{ color: c.navy, fontWeight: 600, fontSize: 12, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              {locale === 'ar' ? 'تواصل معنا' : 'Get in Touch'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/contact"
                style={{ color: c.muted, textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = c.teal)}
                onMouseLeave={e => (e.currentTarget.style.color = c.muted)}>
                {locale === 'ar' ? 'صفحة التواصل' : 'Contact page'}
              </Link>
              <span style={{ color: c.muted, fontSize: 14 }}>
                {locale === 'ar' ? 'منصة ثنائية اللغة' : 'Bilingual platform'}
              </span>
              <span style={{ color: c.muted, fontSize: 14 }}>
                {locale === 'ar' ? 'محتوى أدبي وثقافي' : 'Literary & cultural content'}
              </span>
            </div>
          </div>
        </div>

        {/* Social links */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: c.navy, fontWeight: 600, fontSize: 12, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
            {locale === 'ar' ? 'روابطنا' : 'Social Links'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              style={{
                color: c.muted,
                textDecoration: 'none',
                fontSize: 14,
                transition: 'color 0.2s',
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${c.border}`,
                background: c.canvas,
              }}
              onMouseEnter={(e) => ((e.currentTarget.style.color = c.teal), (e.currentTarget.style.borderColor = c.teal))}
              onMouseLeave={(e) => ((e.currentTarget.style.color = c.muted), (e.currentTarget.style.borderColor = c.border))}
            >
              {locale === 'ar' ? 'X / تويتر' : 'X / Twitter'}
            </a>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              style={{
                color: c.muted,
                textDecoration: 'none',
                fontSize: 14,
                transition: 'color 0.2s',
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${c.border}`,
                background: c.canvas,
              }}
              onMouseEnter={(e) => ((e.currentTarget.style.color = c.teal), (e.currentTarget.style.borderColor = c.teal))}
              onMouseLeave={(e) => ((e.currentTarget.style.color = c.muted), (e.currentTarget.style.borderColor = c.border))}
            >
              GitHub
            </a>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              style={{
                color: c.muted,
                textDecoration: 'none',
                fontSize: 14,
                transition: 'color 0.2s',
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${c.border}`,
                background: c.canvas,
              }}
              onMouseEnter={(e) => ((e.currentTarget.style.color = c.teal), (e.currentTarget.style.borderColor = c.teal))}
              onMouseLeave={(e) => ((e.currentTarget.style.color = c.muted), (e.currentTarget.style.borderColor = c.border))}
            >
              {locale === 'ar' ? 'Instagram' : 'Instagram'}
            </a>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              style={{
                color: c.muted,
                textDecoration: 'none',
                fontSize: 14,
                transition: 'color 0.2s',
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${c.border}`,
                background: c.canvas,
              }}
              onMouseEnter={(e) => ((e.currentTarget.style.color = c.teal), (e.currentTarget.style.borderColor = c.teal))}
              onMouseLeave={(e) => ((e.currentTarget.style.color = c.muted), (e.currentTarget.style.borderColor = c.border))}
            >
              YouTube
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ color: c.muted, fontSize: 12.5 }}>
            © {new Date().getFullYear()} The Sura Codex. {locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </span>
          <span style={{ color: c.muted, fontSize: 12.5, letterSpacing: '0.05em' }}>
            {locale === 'ar' ? 'تقاطع الكود والأدب' : 'The Intersection of Code and Literature'}
          </span>
        </div>
      </div>
    </footer>
  );
}
