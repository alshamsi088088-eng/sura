
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useLocale } from '../context/LocaleContext';

interface TechArticle {
  id: string;
  title: string;
  series: string;
  tags: string[];
  excerpt: string;
  code: string;
}

export function TechPage() {
  const { locale } = useLocale();
  const [articles, setArticles] = useState<TechArticle[]>([]);

  useEffect(() => {
    axios.get('/api/tech').then((res) => setArticles(res.data.articles));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'مقالات تقنية' : 'Tech Articles'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'إصدارات تقنية مع شروحات ومجموعات برمجية.' : 'A growing library of developer narratives and code-rich essays.'}</p>
      </header>
      <div className="space-y-6">
        {(Array.isArray(articles) ? articles : []).map((item) => (
          <article key={item.id} className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-sura-teal">
              <span>{item.series}</span>
              {(Array.isArray(item.tags) ? item.tags : []).map((tag) => (<span key={tag} className="rounded-full border border-sura-line px-3 py-1">{tag}</span>))}
            </div>
            <h2 className="text-2xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-sura-navy/80">{item.excerpt}</p>
            <div className="mt-6 overflow-hidden rounded-3xl border border-sura-line bg-sura-canvas">
              <SyntaxHighlighter language="typescript" style={oneDark} customStyle={{ margin: 0, background: 'transparent' }}>
                {item.code}
              </SyntaxHighlighter>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
