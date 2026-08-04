import { ReactNode, useState, useRef, useEffect } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection?: string;
  onNavigate: (section: string) => void;
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

export function DashboardLayout({
  children,
  activeSection,
  onNavigate,
  title,
  titleAr,
  subtitle,
  subtitleAr,
}: DashboardLayoutProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setMobileSidebarOpen(false);
      }
    };

    if (mobileSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileSidebarOpen]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    };

    if (mobileSidebarOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileSidebarOpen]);

  const handleNavigate = (section: string) => {
    onNavigate(section);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)]" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="fixed top-[72px] h-[calc(100vh-72px)] w-64 overflow-y-auto border-r border-sura-ivory/10 bg-sura-dark">
          <DashboardSidebar activeSection={activeSection} onNavigate={handleNavigate} />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-sura-ivory/10 bg-sura-dark transition-transform duration-300 ease-in-out lg:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={isArabic ? 'القائمة الجانبية' : 'Sidebar navigation'}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-sura-ivory/10 p-4">
            <span className="text-sm font-semibold text-sura-ivory">
              {isArabic ? 'القائمة' : 'Navigation'}
            </span>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="rounded-lg p-1.5 text-sura-ivory/60 hover:bg-sura-ivory/5 hover:text-sura-ivory"
              aria-label={isArabic ? 'إغلاق القائمة' : 'Close menu'}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DashboardSidebar activeSection={activeSection} onNavigate={handleNavigate} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
        {/* Mobile hamburger toggle */}
        <div className="mb-4 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-lg p-2 text-sura-ivory/60 hover:bg-sura-ivory/5 hover:text-sura-ivory"
            aria-label={isArabic ? 'فتح القائمة' : 'Open menu'}
            aria-expanded={mobileSidebarOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {(title || titleAr) && (
            <h1 className="text-lg font-bold text-sura-ivory">
              {isArabic && titleAr ? titleAr : title}
            </h1>
          )}
        </div>

        {(title || titleAr) && (
          <header className="mb-6 hidden lg:block">
            <h1 className="text-2xl font-bold text-sura-ivory md:text-3xl">
              {isArabic && titleAr ? titleAr : title}
            </h1>
            {(subtitle || subtitleAr) && (
              <p className="mt-2 text-sm text-sura-ivory/60">
                {isArabic && subtitleAr ? subtitleAr : subtitle}
              </p>
            )}
          </header>
        )}

        {children}
      </main>
    </div>
  );
}
