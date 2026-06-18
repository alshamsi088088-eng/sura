
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import type { Locale } from '../types';

interface LocaleContextValue {
  locale: Locale;
  strings: Record<string, string>;
  toggle: () => void;
}

const LocaleContext = createContext<LocaleContextValue>({ locale: 'en', strings: en, toggle: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sura-locale') : null;
    return (saved as Locale) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('sura-locale', locale);
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  const strings = useMemo(() => (locale === 'ar' ? ar : en), [locale]);
  const toggle = () => setLocale((current) => (current === 'ar' ? 'en' : 'ar'));

  return <LocaleContext.Provider value={{ locale, strings, toggle }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
