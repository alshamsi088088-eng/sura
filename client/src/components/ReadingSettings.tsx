import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';

interface ReadingSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  lineSpacing: 'compact' | 'normal' | 'relaxed';
  contentWidth: 'narrow' | 'medium' | 'full';
  theme: 'light' | 'dark';
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 'medium',
  lineSpacing: 'normal',
  contentWidth: 'medium',
  theme: 'dark'
};

const FONT_SIZE_MAP = {
  small: 'text-base',
  medium: 'text-lg',
  large: 'text-xl',
  xlarge: 'text-2xl'
};

const LINE_SPACING_MAP = {
  compact: 'leading-tight',
  normal: 'leading-relaxed',
  relaxed: 'leading-loose'
};

const CONTENT_WIDTH_MAP = {
  narrow: 'max-w-md',
  medium: 'max-w-2xl',
  full: 'max-w-5xl'
};

interface ReadingSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReadingSettings({ isOpen, onClose }: ReadingSettingsProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const isArabic = locale === 'ar';

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user || !supabase) {
        // Load from localStorage for guest users
        const stored = localStorage.getItem('reading_settings');
        if (stored) {
          try {
            setSettings(JSON.parse(stored));
          } catch {
            setSettings(DEFAULT_SETTINGS);
          }
        }
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('User')
          .select('settings')
          .eq('id', user.id)
          .single();

        if (data?.settings?.reading) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings.reading });
        }
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, user]);

  const saveSettings = async (newSettings: Partial<ReadingSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (!user) {
      localStorage.setItem('reading_settings', JSON.stringify(updated));
      return;
    }

    if (!supabase) return;

    try {
      const { data: existing } = await supabase
        .from('User')
        .select('settings')
        .eq('id', user.id)
        .single();

      await supabase
        .from('User')
        .update({
          settings: { ...existing?.settings, reading: updated }
        })
        .eq('id', user.id);
    } catch (err) {
      console.error('Failed to save reading settings:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-sura-ivory">
            {isArabic ? 'إعدادات القراءة' : 'Reading Settings'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-sura-ivory/60 hover:text-sura-ivory"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-sura-ivory mb-2">
                {isArabic ? 'حجم الخط' : 'Font Size'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => saveSettings({ fontSize: size })}
                    className={`py-2 px-3 rounded-lg border text-center transition ${
                      settings.fontSize === size
                        ? 'border-sura-teal bg-sura-teal/20 text-sura-teal'
                        : 'border-white/10 text-sura-ivory/70 hover:border-white/20'
                    }`}
                  >
                    <span className={FONT_SIZE_MAP[size]}>Aa</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Line Spacing */}
            <div>
              <label className="block text-sm font-medium text-sura-ivory mb-2">
                {isArabic ? 'تباعد الأسطر' : 'Line Spacing'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'normal', 'relaxed'] as const).map((spacing) => (
                  <button
                    key={spacing}
                    onClick={() => saveSettings({ lineSpacing: spacing })}
                    className={`py-2 px-3 rounded-lg border text-center transition ${
                      settings.lineSpacing === spacing
                        ? 'border-sura-teal bg-sura-teal/20 text-sura-teal'
                        : 'border-white/10 text-sura-ivory/70 hover:border-white/20'
                    }`}
                  >
                    {spacing === 'compact'
                      ? isArabic ? 'مضغوط' : 'Compact'
                      : spacing === 'normal'
                      ? isArabic ? 'عادي' : 'Normal'
                      : isArabic ? 'مريح' : 'Relaxed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Width */}
            <div>
              <label className="block text-sm font-medium text-sura-ivory mb-2">
                {isArabic ? 'عرض المحتوى' : 'Content Width'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['narrow', 'medium', 'full'] as const).map((width) => (
                  <button
                    key={width}
                    onClick={() => saveSettings({ contentWidth: width })}
                    className={`py-2 px-3 rounded-lg border text-center transition ${
                      settings.contentWidth === width
                        ? 'border-sura-teal bg-sura-teal/20 text-sura-teal'
                        : 'border-white/10 text-sura-ivory/70 hover:border-white/20'
                    }`}
                  >
                    {width === 'narrow'
                      ? isArabic ? 'ضيق' : 'Narrow'
                      : width === 'medium'
                      ? isArabic ? 'عادي' : 'Medium'
                      : isArabic ? 'عريض' : 'Full'}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-sura-ivory mb-2">
                {isArabic ? 'المظهر' : 'Theme'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => saveSettings({ theme: 'light' })}
                  className={`py-2 px-3 rounded-lg border text-center transition ${
                    settings.theme === 'light'
                      ? 'border-sura-teal bg-sura-teal/20 text-sura-teal'
                      : 'border-white/10 text-sura-ivory/70 hover:border-white/20'
                  }`}
                >
                  {isArabic ? 'فاتح' : 'Light'}
                </button>
                <button
                  onClick={() => saveSettings({ theme: 'dark' })}
                  className={`py-2 px-3 rounded-lg border text-center transition ${
                    settings.theme === 'dark'
                      ? 'border-sura-teal bg-sura-teal/20 text-sura-teal'
                      : 'border-white/10 text-sura-ivory/70 hover:border-white/20'
                  }`}
                >
                  {isArabic ? 'داكن' : 'Dark'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper hook to use reading settings
export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        const stored = localStorage.getItem('reading_settings');
        if (stored) {
          try {
            setSettings(JSON.parse(stored));
          } catch {
            setSettings(DEFAULT_SETTINGS);
          }
        }
        setLoading(false);
        return;
      }

      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('User')
          .select('settings')
          .eq('id', user.id)
          .single();

        if (data?.settings?.reading) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings.reading });
        }
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSettings = async (newSettings: Partial<ReadingSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (!user) {
      localStorage.setItem('reading_settings', JSON.stringify(updated));
      return;
    }

    if (!supabase) return;

    try {
      const { data: existing } = await supabase
        .from('User')
        .select('settings')
        .eq('id', user.id)
        .single();

      await supabase
        .from('User')
        .update({
          settings: { ...existing?.settings, reading: updated }
        })
        .eq('id', user.id);
    } catch (err) {
      console.error('Failed to save reading settings:', err);
    }
  };

  const getContentClass = () => {
    return `${FONT_SIZE_MAP[settings.fontSize]} ${LINE_SPACING_MAP[settings.lineSpacing]} ${CONTENT_WIDTH_MAP[settings.contentWidth]}`;
  };

  return { settings, loading, updateSettings, getContentClass, FONT_SIZE_MAP, LINE_SPACING_MAP, CONTENT_WIDTH_MAP };
}

export default ReadingSettings;