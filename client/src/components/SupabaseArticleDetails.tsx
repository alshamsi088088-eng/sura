import { useEffect, useMemo, useState } from 'react';
import { getSupabaseOrThrow } from '../lib/supabaseClient';

type Article = {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  content: string;
  authorName: string;
  publishedAt?: string | null;
};

export function useSupabaseArticleBySlug(slug?: string) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!slug) {
        setError('Article not found');
        setLoading(false);
        setArticle(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const sb = getSupabaseOrThrow();

        // Assumes the Supabase table/columns exist. Adjust if your schema differs.
        const { data, error: fetchError } = await sb
          .from('Article')
          .select('id,title,excerpt,coverImage,content,authorName,publishedAt,slug')
          .eq('slug', slug)
          .maybeSingle();

        if (cancelled) return;

        if (fetchError) throw fetchError;

        if (!data) {
          setArticle(null);
          setError('Article not found');
        } else {
          setArticle({
            id: String(data.id),
            title: String(data.title ?? ''),
            excerpt: String(data.excerpt ?? ''),
            coverImage: data.coverImage ? String(data.coverImage) : null,
            content: String(data.content ?? ''),
            authorName: String(data.authorName ?? ''),
            publishedAt: data.publishedAt ? String(data.publishedAt) : null,
          });
        }
      } catch {
        if (cancelled) return;
        setArticle(null);
        setError('Failed to load article');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { article, loading, error };
}

