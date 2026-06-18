import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

export function RegisterPage() {
  const { register } = useAuth();
  const { locale } = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError(locale === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
      return;
    }
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        typeof err?.message === 'string'
          ? err.message
          : locale === 'ar'
            ? 'حدث خطأ أثناء التسجيل.'
            : 'Registration failed.';
      setError(msg);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <h1 className="text-3xl font-semibold">{locale === 'ar' ? 'إنشاء حساب' : 'Register'}</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full name'}
          className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
          required
        />
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
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          type="password"
          placeholder={locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}
          className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
          required
        />
        <button type="submit" className="w-full rounded-full bg-sura-gold px-4 py-3 text-sm font-semibold text-sura-dark">
          {locale === 'ar' ? 'سجل' : 'Create account'}
        </button>
      </form>
      {error && <div className="rounded-3xl bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
    </div>
  );
}
