
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';

export function NotFoundPage() {
  const { strings } = useLocale();
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-sura-line bg-sura-canvas p-8 text-center">
      <h1 className="text-5xl font-semibold">404</h1>
      <p className="mt-4 text-sm leading-7 text-sura-navy/80">{strings.home} / {strings.articles} / {strings.about}</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-sura-gold px-6 py-3 text-sm font-semibold text-sura-dark">Back to home</Link>
    </div>
  );
}
