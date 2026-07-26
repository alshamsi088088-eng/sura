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
  authorId?: string | null;
};

type SupabaseArticleRow = {
  id: unknown;
  title: unknown;
  excerpt: unknown;
  content?: unknown | null;
  authorId?: unknown | null;
  authorName?: unknown;
  publishedAt?: unknown | null;
  slug: unknown;
  coverImage?: unknown | null;
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

        // slug comes from the URL and may be percent-encoded (e.g. %D9%86%D8%B5%D8%AD...).
        // Decode it before querying so Supabase matches the stored Arabic slug.
        let decodedSlug = slug;
        try {
          decodedSlug = decodeURIComponent(slug);
        } catch {
          decodedSlug = slug;
        }

        const { data, error: fetchError } = await sb
          .from('Article')
          .select(
            'id,title,excerpt,coverImage,content,authorId,authorName,publishedAt,slug'
          )
          .eq('slug', decodedSlug)
          .maybeSingle();

        if (cancelled) return;

        if (fetchError) throw fetchError;

        if (!data) {
          setArticle(null);
          setError('Article not found');
        } else {
          const row = data as SupabaseArticleRow;
          setArticle({
            id: String(row.id),
            title: String(row.title ?? ''),
            excerpt: String(row.excerpt ?? ''),
            coverImage: row.coverImage ? String(row.coverImage) : null,
            content: String(row.content ?? ''),
            authorName: String(row.authorName ?? ''),
            authorId: row.authorId ? String(row.authorId) : null,
            publishedAt: row.publishedAt ? String(row.publishedAt) : null,
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
