
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { ThemeMode } from '../types';

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
  fontSize: string;
  fontFamilyKey: string;
  fontFamily: string;
  setFontSize: (size: string) => void;
  setFontFamily: (family: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  toggle: () => {},
  fontSize: '1rem',
  fontFamilyKey: 'inter',
  fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  setFontSize: () => {},
  setFontFamily: () => {}
});

const fontFamilies = {
  inter: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  georgia: "Georgia, 'Times New Roman', Times, serif",
  space: "'Space Grotesk', sans-serif"
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sura-theme') : null;
    return (saved as ThemeMode) || 'dark';
  });
  const [fontSize, setFontSizeState] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sura-font-size') : null;
    return saved || '1rem';
  });
  const [fontFamilyKey, setFontFamilyKey] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sura-font-family-key') : null;
    return saved || 'inter';
  });
  const [fontFamily, setFontFamilyState] = useState<string>(() => fontFamilies[fontFamilyKey as keyof typeof fontFamilies] || fontFamilies.inter);

  useEffect(() => {
    document.body.classList.toggle('light', mode === 'light');
    localStorage.setItem('sura-theme', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--sura-font-size', fontSize);
    localStorage.setItem('sura-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.style.setProperty('--sura-font-family', fontFamily);
    localStorage.setItem('sura-font-family-key', fontFamilyKey);
  }, [fontFamily, fontFamilyKey]);

  const toggle = () => setMode((current) => (current === 'dark' ? 'light' : 'dark'));
  const setFontSize = (size: string) => setFontSizeState(size);
  const setFontFamily = (key: string) => {
    setFontFamilyKey(key);
    setFontFamilyState(fontFamilies[key as keyof typeof fontFamilies] || fontFamilies.inter);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggle, fontSize, fontFamilyKey, fontFamily, setFontSize, setFontFamily }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
