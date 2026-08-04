import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { Link } from 'react-router-dom';

export type DashboardNavItem = {
  id: string;
  label: string;
  labelAr: string;
  icon: React.ReactNode;
  path?: string;
  section?: string;
  roles: Array<'member' | 'writer' | 'editor' | 'author' | 'moderator' | 'admin'>;
};

function svgIcon(path: string, viewBox: string = '0 0 24 24') {
  return (
    <svg className="h-5 w-5" fill="none" viewBox={viewBox} stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const memberSections: Array<{ id: string; label: string; labelAr: string; icon: string; path?: string }> = [
  { id: 'dashboard-home', label: 'Dashboard Home', labelAr: '\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'reading-stats', label: 'Reading Statistics', labelAr: '\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0642\u0631\u0627\u0621\u0629', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'achievements', label: 'Achievements', labelAr: '\u0627\u0644\u0625\u0646\u062C\u0627\u0632\u0627\u062A', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { id: 'reading-history', label: 'Reading History', labelAr: '\u0633\u062C\u0644 \u0627\u0644\u0642\u0631\u0627\u0621\u0629', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
{ id: 'bookmarks', label: 'Bookmarks', labelAr: '\u0627\u0644\u0645\u0641\u0636\u0644\u0627\u062A', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', path: '/library' },
  { id: 'leaderboard', label: 'Leaderboard', labelAr: '\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u062A\u0635\u062F\u0631\u064A\u0646', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-16a7 7 0 017 7h-7V5z', path: '/leaderboard' },
  { id: 'reading-goals', label: 'Reading Goals', labelAr: '\u0623\u0647\u062F\u0627\u0641 \u0627\u0644\u0642\u0631\u0627\u0621\u0629', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'notifications', label: 'Notifications', labelAr: '\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { id: 'settings', label: 'Profile Settings', labelAr: '\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0644\u0641', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', path: '/profile' },
];

const adminSections: Array<{ id: string; label: string; labelAr: string; icon: string; path?: string }> = [
  { id: 'overview', label: 'Admin Overview', labelAr: '\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'articles', label: 'Articles', labelAr: '\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v2H7V8z' },
  { id: 'categories', label: 'Categories', labelAr: '\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
  { id: 'users', label: 'Users', labelAr: '\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'comments', label: 'Comments', labelAr: '\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { id: 'analytics', label: 'Analytics', labelAr: '\u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/analytics' },
  { id: 'ads', label: 'Ads', labelAr: '\u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM12 5v2m0 10v2m7-7h-2m-10 0H5m5.05-4.95l-1.41 1.41m6.72 6.72l-1.41 1.41m0-9.54l1.41 1.41m-6.72 6.72L5.05 18.95', path: '/admin/ads' },
  { id: 'reports', label: 'Reports', labelAr: '\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'settings', label: 'Settings', labelAr: '\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

function buildNavItems(role: string): DashboardNavItem[] {
  const items: DashboardNavItem[] = memberSections.map((s) => ({
    id: s.id,
    label: s.label,
    labelAr: s.labelAr,
    icon: svgIcon(s.icon),
    path: s.path,
    section: s.path ? undefined : s.id,
    roles: ['member', 'writer', 'editor', 'author', 'moderator', 'admin'],
  }));
  if (role === 'admin') {
    adminSections.forEach((s) => {
      items.push({
        id: 'admin-' + s.id,
        label: s.label,
        labelAr: s.labelAr,
        icon: svgIcon(s.icon),
        path: s.path,
        section: s.path ? undefined : s.id,
        roles: ['admin'],
      });
    });
  }
  return items;
}

interface DashboardSidebarProps {
  activeSection?: string;
  onNavigate: (section: string) => void;
}

export function DashboardSidebar({ activeSection, onNavigate }: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const role = user?.role ?? 'member';
  const navItems = buildNavItems(role);

  const handleNav = (item: DashboardNavItem) => {
    if (item.path) {
      window.location.href = item.path;
    } else if (item.section) {
      onNavigate(item.section);
    }
  };

  const roleLabel = (r: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      admin: { en: 'Admin', ar: '\u0645\u062F\u064A\u0631' },
      moderator: { en: 'Moderator', ar: '\u0645\u0634\u0631\u0641' },
      author: { en: 'Author', ar: '\u0643\u0627\u062A\u0628' },
      writer: { en: 'Writer', ar: '\u0643\u0627\u062A\u0628' },
      editor: { en: 'Editor', ar: '\u0645\u062D\u0631\u0631' },
    };
    const found = labels[r];
    if (found) return isArabic ? found.ar : found.en;
    return isArabic ? '\u0639\u0636\u0648' : 'Member';
  };

  return (
    <div className="flex h-full flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* User Profile */}
      <div className="border-b border-sura-ivory/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7F77DD]/20 text-sm font-bold text-[#7F77DD]">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-sura-ivory">{user?.name || (isArabic ? '\u0645\u0633\u062A\u062E\u062F\u0645' : 'User')}</div>
            <div className="text-xs capitalize text-sura-ivory/50">{roleLabel(role)}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label={isArabic ? 'القائمة الجانبية' : 'Sidebar navigation'}>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.section;
            const ariaCurrent = isActive ? 'page' as const : undefined;

            if (item.path) {
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      isActive
                        ? 'bg-[#7F77DD]/20 text-[#7F77DD]'
                        : 'text-sura-ivory/70 hover:bg-sura-ivory/5 hover:text-sura-ivory'
                    }`}
                    aria-current={ariaCurrent}
                  >
                    <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">{item.icon}</span>
                    <span>{isArabic ? item.labelAr : item.label}</span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNav(item)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-[#7F77DD]/20 text-[#7F77DD]'
                      : 'text-sura-ivory/70 hover:bg-sura-ivory/5 hover:text-sura-ivory'
                  }`}
                  aria-current={ariaCurrent}
                  type="button"
                >
                  <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">{item.icon}</span>
                  <span>{isArabic ? item.labelAr : item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="border-t border-sura-ivory/10 p-3">
        <button
          onClick={() => { logout(); window.location.href = '/'; }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
          type="button"
          aria-label={isArabic ? '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C' : 'Sign out'}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>{isArabic ? '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );
}
