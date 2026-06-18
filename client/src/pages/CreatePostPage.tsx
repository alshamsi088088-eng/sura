import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be signed in to create a post.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    if (!supabase) {
      setError('تعذر الاتصال بقاعدة البيانات، تحقق من إعدادات Supabase.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('posts').insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id
      });

      if (insertError) throw insertError;

      navigate('/articles');
    } catch (err: any) {
      setError(err?.message ? err.message : 'Failed to save the post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <h1 className="text-3xl font-semibold">Create Post</h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
          required
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post..."
          className="min-h-48 w-full resize-y rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-sura-gold px-4 py-3 text-sm font-semibold text-sura-dark disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Publish'}
        </button>
      </form>

      {error && <div className="rounded-3xl bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
    </div>
  );
}
