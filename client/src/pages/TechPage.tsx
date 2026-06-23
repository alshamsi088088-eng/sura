
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';

interface TechArticle {
  id: string;
  title: string;
  series: string;
  tags: string[];
  excerpt: string;
  code: string;
  language?: string;
  difficulty?: string;
  githubUrl?: string;
  demoUrl?: string;
}

export function TechPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const [articles, setArticles] = useState<TechArticle[]>([]);

  useEffect(() => {
    axios.get('/api/tech').then((res) => setArticles(res.data.articles));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'مقالات تقنية' : 'Tech Articles'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'إصدارات تقنية مع شروحات ومجموعات برمجية.' : 'A growing library of developer narratives and code-rich essays.'}</p>
          </div>
          {user && (
            <Link
              to="/create-tech"
              className="self-start rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-dark transition hover:opacity-95"
            >
              {locale === 'ar' ? 'إنشاء مقال تقني' : 'Create Tech Article'}
            </Link>
          )}
        </div>
      </header>
      <div className="space-y-6">
        {(Array.isArray(articles) ? articles : []).map((item) => (
          <article key={item.id} className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-sura-teal">
              <span>{item.series}</span>
              {(Array.isArray(item.tags) ? item.tags : []).map((tag) => (<span key={tag} className="rounded-full border border-sura-line px-3 py-1">{tag}</span>))}
              {item.language && <span className="rounded-full bg-sura-sky/20 px-3 py-1">{item.language}</span>}
              {item.difficulty && (
                <span className={`rounded-full px-3 py-1 ${
                  item.difficulty === 'Advanced' ? 'bg-red-500/20 text-red-400' :
                  item.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {item.difficulty}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-sura-navy/80">{item.excerpt}</p>
            <div className="mt-6 overflow-hidden rounded-3xl border border-sura-line bg-sura-canvas">
              <SyntaxHighlighter language={item.language || 'typescript'} style={oneDark} customStyle={{ margin: 0, background: 'transparent' }}>
                {item.code}
              </SyntaxHighlighter>
            </div>
            {(item.githubUrl || item.demoUrl) && (
              <div className="mt-4 flex gap-3">
                {item.githubUrl && (
                  <a href={item.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sura-navy/70 hover:text-sura-teal">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.475 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.203-6.086 8.203-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    {locale === 'ar' ? 'GitHub' : 'GitHub'}
                  </a>
                )}
                {item.demoUrl && (
                  <a href={item.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sura-navy/70 hover:text-sura-teal">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m-6 4h6m4 8v4m-4-4h4"/></svg>
                    {locale === 'ar' ? 'تجربة' : 'Demo'}
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
