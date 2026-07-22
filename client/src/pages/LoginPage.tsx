import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';

export function LoginPage() {
  const { user, login, register } = useAuth();
  const { locale } = useLocale();
  const navigate = useNavigate();

  useSeoTags({
    title: locale === 'ar' ? 'تسجيل الدخول | سُرى' : 'Login | Sura Codex',
    description: locale === 'ar'
      ? 'سجل الدخول إلى حسابك في سُرى للوصول إلى لوحة التحكم والمحتوى الحصري.'
      : 'Log in to your Sura Codex account to access the dashboard and exclusive content.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/login`,
    noIndex: true,
  });

  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') navigate('/admin', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        // Role-based redirect will happen in the user effect.
        return;
      }

      // register
      const result = await register(email, password, name);

      if (result?.error) {
        const supaMessage = (result.error?.message || '').trim();

        setErrorMessage(
          locale === 'ar'
            ? supaMessage
              ? `تعذر إنشاء الحساب: ${supaMessage}`
              : 'تعذر إنشاء الحساب. يرجى التحقق من البيانات والمحاولة مرة أخرى.'
            : supaMessage
              ? supaMessage
              : 'Unable to create account. Please check your details and try again.'
        );
        return;
      }

      setSuccessMessage(
        locale === 'ar'
          ? 'تم إرسال إيميل تفعيل، يرجى مراجعة بريدك الإلكتروني.'
          : 'Verification email sent. Please check your inbox.'
      );
    } catch (_err) {
      setErrorMessage(
        locale === 'ar'
          ? 'حدث خطأ أثناء العملية. يرجى المحاولة مرة أخرى.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(
      locale === 'ar'
        ? 'استخدم تسجيل الدخول عبر Google من صفحة المصادقة.'
        : 'Google login is not enabled on this page.'
    );
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <h1 className="text-3xl font-semibold">
        {mode === 'register'
          ? locale === 'ar'
            ? 'إنشاء حساب'
            : 'Create account'
          : locale === 'ar'
            ? 'تسجيل الدخول'
            : 'Login'}
      </h1>

      <div className="flex items-center justify-center gap-2 text-sm text-sura-navy/70">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={mode === 'login' ? 'font-semibold text-sura-navy' : undefined}
        >
          {locale === 'ar' ? 'دخول' : 'Login'}
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={mode === 'register' ? 'font-semibold text-sura-navy' : undefined}
        >
          {locale === 'ar' ? 'تسجيل' : 'Sign up'}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder={locale === 'ar' ? 'الاسم' : 'Name'}
            className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
            required
          />
        )}

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder={locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
          className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
          required
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder={locale === 'ar' ? 'كلمة المرور' : 'Password'}
          className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-sura-gold px-4 py-3 text-sm font-semibold text-sura-dark disabled:opacity-60"
        >
          {isLoading
            ? locale === 'ar'
              ? 'جارٍ...'
              : 'Please wait...'
            : mode === 'register'
              ? locale === 'ar'
                ? 'تسجيل'
                : 'Sign up'
              : locale === 'ar'
                ? 'دخول'
                : 'Log in'}
        </button>
      </form>

      {errorMessage && (
        <div className="rounded-3xl bg-red-500/10 p-4 text-sm text-red-200">{errorMessage}</div>
      )}

      {successMessage && (
        <div className="rounded-3xl bg-green-500/10 p-4 text-sm text-green-200">{successMessage}</div>
      )}

      <div className="space-y-3 text-center text-sm text-sura-navy/70">
        <p>{locale === 'ar' ? 'أو تابع مع' : 'Or continue with'}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="rounded-full border border-sura-line px-4 py-3 text-sm"
          >
            Google
          </button>
          <a
            href="/api/auth/apple"
            className="rounded-full border border-sura-line px-4 py-3 text-sm"
          >
            Apple
          </a>
        </div>
      </div>
    </div>
  );
}

