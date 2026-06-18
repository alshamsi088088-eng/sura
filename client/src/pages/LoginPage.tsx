
import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

export function LoginPage() {
  const { user, login, googleLogin } = useAuth();
  const { locale } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(locale === 'ar' ? 'يرجى التحقق من بيانات الحساب.' : 'Please check your login details.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      navigate('/dashboard');
    } catch (error) {
      setError(locale === 'ar' ? 'فشل تسجيل الدخول عبر Google.' : 'Google login failed.');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <h1 className="text-3xl font-semibold">{locale === 'ar' ? 'تسجيل الدخول' : 'Login'}</h1>
      <form onSubmit={submit} className="space-y-4">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={locale === 'ar' ? 'البريد الإلكتروني' : 'Email'} className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={locale === 'ar' ? 'كلمة المرور' : 'Password'} className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy" required />
        <button type="submit" className="w-full rounded-full bg-sura-gold px-4 py-3 text-sm font-semibold text-sura-dark">{locale === 'ar' ? 'دخول' : 'Log in'}</button>
      </form>
      {error && <div className="rounded-3xl bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
      <div className="space-y-3 text-center text-sm text-sura-navy/70">
        <p>{locale === 'ar' ? 'أو تابع مع' : 'Or continue with'}</p>
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={handleGoogleLogin} className="rounded-full border border-sura-line px-4 py-3 text-sm">Google</button>
          <a href="/api/auth/apple" className="rounded-full border border-sura-line px-4 py-3 text-sm">Apple</a>
        </div>
      </div>
    </div>
  );
}
