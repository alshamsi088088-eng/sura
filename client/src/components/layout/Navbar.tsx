import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../../firebaseConfig';
import { useEffect, useRef, useState } from 'react';

const navItems = [
  { path: '/', key: 'home' },
  { path: '/articles', key: 'articles' },
  { path: '/novels', key: 'novels' },
  { path: '/gallery', key: 'gallery' },
  { path: '/store', key: 'store' },
  { path: '/tech', key: 'tech' },
  { path: '/about', key: 'about' },
  { path: '/create-post', key: 'createPost' },
  { path: '/create-chapter', key: 'createChapter' },
];

export function Navbar() {
  const { locale, strings, toggle: toggleLocale } = useLocale();
  const { mode, toggle: toggleTheme, fontSize, fontFamilyKey, setFontSize, setFontFamily } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      navigate(isNewUser ? '/profile' : '/dashboard');
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
      if (!toolsRef.current?.contains(e.target as Node)) setToolsOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <header className="glass-nav sticky top-0 z-50" dir={dir}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="glass flex h-10 w-10 items-center justify-center rounded-xl !rounded-xl">
            <img src="/logo.svg" alt="Sura Codex" className="h-6 w-6" />
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="font-serif text-lg font-bold text-sura-ink">
              {locale === 'ar' ? 'سُرى كودكس' : 'The Sura Codex'}
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-sura-ink/40">
              {locale === 'ar' ? 'تقاطع الكود والأدب' : 'Code & Literature'}
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-[13.5px] font-medium transition-all ${
                  isActive ? 'glass text-sura-ink' : 'text-sura-ink/55 hover:text-sura-ink'
                }`
              }>
              {strings[item.key] || item.key}
            </NavLink>
          ))}
          {user && (
            <NavLink to="/dashboard"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-[13.5px] font-medium transition-all ${
                  isActive ? 'glass text-sura-ink' : 'text-sura-ink/55 hover:text-sura-ink'
                }`
              }>
              {strings.dashboard}
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-[13.5px] font-medium transition-all ${
                  isActive ? 'glass text-sura-ink' : 'text-sura-ink/55 hover:text-sura-ink'
                }`
              }>
              {strings.admin}
            </NavLink>
          )}
        </nav>

        {/* Right side: floating tools + auth */}
        <div className="flex items-center gap-2">

          {/* Floating tools panel */}
          <div className="relative" ref={toolsRef}>
            <button onClick={() => setToolsOpen((v) => !v)}
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-sura-ink/75 transition hover:text-sura-ink"
              aria-label="Display settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 4.3l.06.06A1.65 1.65 0 0 0 8.92 4.7 1.65 1.65 0 0 0 9.91 3.19V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.62.78 1.04 1.51 1H21a2 2 0 1 1 0 4h-.09c-.73 0-1.31.42-1.51 1z"/>
              </svg>
            </button>

            {toolsOpen && (
              <div className="glass-card absolute top-[calc(100%+10px)] z-50 w-64 p-4 space-y-4" style={{ [locale === 'ar' ? 'left' : 'right']: 0 }}>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sura-ink/45">
                    {locale === 'ar' ? 'حجم الخط' : 'Text size'}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ v: '0.9rem', l: 'S' }, { v: '1rem', l: 'M' }, { v: '1.1rem', l: 'L' }, { v: '1.2rem', l: 'XL' }].map((o) => (
                      <button key={o.v} onClick={() => setFontSize(o.v)}
                        className={`rounded-lg border py-1.5 text-xs font-semibold transition ${
                          fontSize === o.v ? 'border-sura-sky/60 bg-white/10 text-sura-ink' : 'border-white/10 text-sura-ink/50 hover:text-sura-ink'
                        }`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sura-ink/45">
                    {locale === 'ar' ? 'نوع الخط' : 'Typeface'}
                  </div>
                  <select value={fontFamilyKey} onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm">
                    <option value="inter">Inter</option>
                    <option value="georgia">Georgia</option>
                    <option value="space">Space Grotesk</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sura-ink/45">
                    {locale === 'ar' ? 'المظهر' : 'Appearance'}
                  </span>
                  <button onClick={toggleTheme}
                    className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-sura-ink/80">
                    <span>{mode === 'dark' ? '☾' : '☀'}</span>
                    <span>{mode === 'dark' ? (locale === 'ar' ? 'ليلي' : 'Night') : (locale === 'ar' ? 'فاتح' : 'Day')}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sura-ink/45">
                    {locale === 'ar' ? 'اللغة' : 'Language'}
                  </span>
                  <button onClick={() => toggleLocale()}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-sura-ink/80">
                    {locale === 'en' ? 'AR' : 'EN'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!user && (
            <button onClick={handleGoogleLogin} className="btn-primary !px-5 !py-2 !text-[13px]">
              {locale === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </button>
          )}

          {user && (
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setUserMenuOpen((v) => !v)}
                className="glass flex items-center gap-2 rounded-full p-1 pl-3">
                <span className="hidden sm:inline text-[13px] font-medium text-sura-ink">{user.name?.split(' ')[0]}</span>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                  : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sura-sky/20 text-[13px] font-bold text-sura-ink">{user.name?.charAt(0)}</div>
                }
              </button>

              {userMenuOpen && (
                <div className="glass-card absolute top-[calc(100%+10px)] z-50 w-44 p-2" style={{ [locale === 'ar' ? 'left' : 'right']: 0 }}>
                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-sura-ink/80 transition hover:bg-white/5 hover:text-sura-ink">
                    {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                  </Link>
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-sura-ink/80 transition hover:bg-white/5 hover:text-sura-ink">
                    {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
                  </Link>
                  <div className="my-1 h-px bg-white/10" />
                  <button onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300/80 transition hover:bg-red-500/10">
                    {locale === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen((v) => !v)}
            className="glass flex h-10 w-10 items-center justify-center rounded-full text-sura-ink lg:hidden"
            aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <path d="M3 6h18M3 12h18M3 18h18"/>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="glass-nav border-t border-white/5 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    isActive ? 'glass text-sura-ink' : 'text-sura-ink/60 hover:text-sura-ink'
                  }`
                }>
                {strings[item.key] || item.key}
              </NavLink>
            ))}
            {user && (
              <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    isActive ? 'glass text-sura-ink' : 'text-sura-ink/60 hover:text-sura-ink'
                  }`
                }>
                {strings.dashboard}
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
