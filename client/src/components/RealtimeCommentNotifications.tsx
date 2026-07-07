import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/runtimeConfig';

const API_URL = getApiBaseUrl();

interface RealtimeCommentNotificationsProps {
  entity: string;
}

interface CommentData {
  id: string;
  author: string;
  message: string;
  createdAt?: string;
}

export function RealtimeCommentNotifications({ entity }: RealtimeCommentNotificationsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/comments?entity=${entity}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [entity]);

  const submitComment = async () => {
    if (!user || !message.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity,
          message: message.trim()
        })
      });
      if (res.ok) {
        setMessage('');
        fetchComments();
      }
    } catch (error) {
      console.error('Comment save failed', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-sura-ivory/10 bg-sura-dark/80 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-sura-gold">Live comments</div>
          <p className="mt-2 text-sm text-sura-ivory/70">Realtime reader notes and notifications from Supabase.</p>
        </div>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-sura-ivory/70">Loading...</div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-3xl border border-sura-border/20 bg-sura-ink/80 p-4 text-sm text-sura-ivory/80">
              <div className="font-semibold text-sura-ivory">{comment.author}</div>
              <p className="mt-1 text-sura-ivory/70">{comment.message}</p>
            </div>
          ))
        ) : (
          <div className="text-sm text-sura-ivory/70">No comments yet — be the first to share a note.</div>
        )}
      </div>
      <div className="mt-6 space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Write a quick reading note..."
          className="w-full resize-none rounded-3xl border border-sura-ivory/20 bg-sura-dark/90 px-4 py-3 text-sura-ivory outline-none focus:border-sura-gold"
        />
        <button
          onClick={submitComment}
          disabled={saving || !message.trim() || !user}
          className="rounded-full bg-sura-gold px-5 py-3 text-sm font-semibold text-sura-dark disabled:opacity-60"
        >
          {saving ? 'Sending...' : 'Post note'}
        </button>
      </div>
    </section>
  );
}