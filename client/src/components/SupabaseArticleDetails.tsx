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

type SupabaseUserJoin = {
  name?: string | null;
};

type SupabaseArticleRow = {
  id: unknown;
  title: unknown;
  excerpt: unknown;
  content?: unknown | null;
  authorId?: unknown | null;
  publishedAt?: unknown | null;
  slug: unknown;
  User?: SupabaseUserJoin[] | SupabaseUserJoin | null;
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

        // NOTE: 'coverImage' column does not exist on the Article table,
        // so it was removed from the select list to avoid a 400 Bad Request.
        const { data, error: fetchError } = await sb
          .from('Article')
          .select(
            'id,title,excerpt,content,authorId,publishedAt,slug,User(name)'
          )
          .eq('slug', decodedSlug)
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
            coverImage: null,
            content: String(data.content ?? ''),
            authorName: (() => {
              const joined = (data as SupabaseArticleRow | null | undefined)?.User;
              if (!joined) return '';
              if (Array.isArray(joined)) {
                return String((joined[0] as SupabaseUserJoin | undefined)?.name ?? '');
              }
              return String((joined as SupabaseUserJoin | null | undefined)?.name ?? '');
            })(),
            authorId: data.authorId ? String(data.authorId) : null,
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
