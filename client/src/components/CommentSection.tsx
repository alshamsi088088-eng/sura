import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// تم تحديث الأسماء لتطابق جدولك تماماً
type CommentRow = {
  id: string;
  articleId: string;
  userId: string;
  content: string;
  approved?: boolean;
  createdAt?: string;
  User?: {
    name?: string | null;
  } | null;
};

export function CommentSection({ articleId }: { articleId: string }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [content, setContent] = useState('');
  const [comments, setComments] = useState<CommentRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchComments() {
      if (!supabase) {
        setError('Supabase client is not initialized.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // الاستعلام بالأسماء الصحيحة لجدولك
      const { data, error: fetchError } = await supabase
        .from('Comment')
        .select('id, articleId, userId, content, approved, createdAt, User(name)')
        .eq('articleId', articleId)
        .order('createdAt', { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setComments([]);
      } else {
        setComments((data ?? []) as CommentRow[]);
      }

      setLoading(false);
    }

    fetchComments();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const visibleComments = useMemo(() => {
    return comments.filter((c) => c.approved !== false);
  }, [comments]);

  const canPost = Boolean(user?.id) && content.trim().length > 0 && !posting;

  async function handleDeleteComment(commentId: string) {
    if (!user) return;
    if (!isAdmin && commentId === '') return;

    if (!supabase) {
      setError('Supabase client is not initialized.');
      return;
    }

    setError(null);

    const { error: deleteError } = await supabase
      .from('Comment')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('Comment')
      .select('id, articleId, userId, content, approved, createdAt, User(name)')
      .eq('articleId', articleId)
      .order('createdAt', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setComments([]);
    } else {
      setComments((data ?? []) as CommentRow[]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!user?.id) {
      setError('Please sign in to post a comment.');
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError('Comment cannot be empty.');
      return;
    }

    if (!supabase) {
      setError('Supabase client is not initialized.');
      return;
    }

    setPosting(true);
    setError(null);

    // الإضافة للجدول بالأسماء الصحيحة
    const { error: insertError } = await supabase.from('Comment').insert({
      articleId: articleId,
      userId: user.id,
      content: trimmed,
      approved: true,
    });

    if (insertError) {
      setError(insertError.message);
      setPosting(false);
      return;
    }

    setContent('');

    const { data, error: fetchError } = await supabase
      .from('Comment')
      .select('id, articleId, userId, content, approved, createdAt, User(name)')
      .eq('articleId', articleId)
      .order('createdAt', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setComments([]);
    } else {
      setComments((data ?? []) as CommentRow[]);
    }

    setPosting(false);
  }

  return (
    <section className="mx-auto max-w-[800px] rounded-3xl border border-sura-ivory/10 bg-sura-ink/80 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-playfair text-2xl text-sura-ivory">Comments</h3>
          <p className="mt-1 font-inter text-sm text-sura-ivory/70">
            Reader notes for this article.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Share your thoughts..."
          rows={3}
          className="w-full resize-none rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 p-3 font-inter text-sura-ivory outline-none focus:border-sura-gold"
          disabled={posting || loading}
        />

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={!canPost}
            className="rounded-full bg-sura-gold px-4 py-2 font-inter text-sm font-semibold text-sura-charcoal disabled:opacity-60"
          >
            {posting ? 'Posting...' : 'Post comment'}
          </button>
          {!user ? (
            <p className="text-xs text-sura-ivory/70">Sign in to comment.</p>
          ) : (
            <p className="text-xs text-sura-ivory/70">
              {content.trim().length === 0 ? 'Write a comment to post.' : ' '} 
            </p>
          )}
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-sura-ivory/70">Loading comments...</p>
        ) : visibleComments.length === 0 ? (
          <p className="text-sm text-sura-ivory/70">No comments yet.</p>
        ) : (
          visibleComments.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-sura-ivory/10 bg-sura-dark/70 p-4"
            >
              <header className="flex items-center justify-between gap-3">
                <div className="font-inter text-sm text-sura-ivory">
                  <span className="font-semibold">{c.User?.name ?? 'Unknown'}</span>
                  <span className="ml-2 text-sura-ivory/60">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                  </span>
                </div>

                {(isAdmin || (user?.id && user.id === c.userId)) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(c.id)}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/15"
                    aria-label="Delete comment"
                  >
                    Delete
                  </button>
                )}
              </header>
              <p className="mt-2 font-inter text-sm text-sura-ivory/85">{c.content}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}