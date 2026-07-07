import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type EntityType = 'article' | 'book' | 'novel' | 'community';

interface ThreadedCommentsProps {
  entityId: string;
  entityType: EntityType;
}

interface CommentItem {
  id: string;
  entityId: string;
  entityType: EntityType;
  parentId: string | null;
  message: string;
  uid: string;
  author: string;
  avatar?: string;
  status?: 'visible' | 'hidden';
  createdAt?: string;
}

function roleToLabel(role?: string) {
  const normalized = (role || 'reader').toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'editor') return 'Editor';
  return 'Reader';
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return '';
  }
}

export function ThreadedComments({ entityId, entityType }: ThreadedCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const isModerator = ['admin', 'editor'].includes((user?.role || '').toLowerCase());

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/comments?entityId=${entityId}&entityType=${entityType}`);
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
    // Poll for new comments every 10 seconds (alternative to Firestore realtime)
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [entityId, entityType]);

  const visibleComments = useMemo(
    () => comments.filter((c) => (c.status || 'visible') === 'visible'),
    [comments]
  );

  const roots = useMemo(() => visibleComments.filter((c) => !c.parentId), [visibleComments]);
  const repliesMap = useMemo(() => {
    const map = new Map<string, CommentItem[]>();
    for (const c of visibleComments) {
      if (!c.parentId) continue;
      if (!map.has(c.parentId)) map.set(c.parentId, []);
      map.get(c.parentId)!.push(c);
    }
    return map;
  }, [visibleComments]);

  async function createComment(e: FormEvent) {
    e.preventDefault();
    if (!user || !message.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId,
          entityType,
          parentId: null,
          message: message.trim()
        })
      });
      if (res.ok) {
        trackEvent('comment_create', { entity_id: entityId, entity_type: entityType, parent: false });
        trackEvent('comment_notification', { entity_id: entityId, entity_type: entityType, action: 'new_comment' });
        setMessage('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to create comment', error);
    } finally {
      setSaving(false);
    }
  }

  async function createReply(parentId: string) {
    if (!user || !replyText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId,
          entityType,
          parentId,
          message: replyText.trim()
        })
      });
      if (res.ok) {
        trackEvent('comment_reply', { entity_id: entityId, entity_type: entityType, parent: true });
        trackEvent('comment_notification', { entity_id: entityId, entity_type: entityType, action: 'new_reply' });
        setReplyText('');
        setReplyTo(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to create reply', error);
    } finally {
      setSaving(false);
    }
  }

  async function moderateComment(commentId: string, status: 'visible' | 'hidden') {
    if (!isModerator) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${commentId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        trackEvent('comment_moderation', { entity_id: entityId, entity_type: entityType, status });
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to moderate comment', error);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-[800px] rounded-3xl border border-sura-ivory/10 bg-sura-ink/80 p-6">
        <p className="text-sura-ivory/70">Loading comments...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[800px] rounded-3xl border border-sura-ivory/10 bg-sura-ink/80 p-6">
      <div className="mb-4">
        <h3 className="font-playfair text-2xl text-sura-ivory">Comments</h3>
        <p className="mt-1 font-inter text-sm text-sura-ivory/70">Threaded discussion for this {entityType}.</p>
      </div>

      <form onSubmit={createComment} className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          className="w-full resize-none rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 p-3 font-inter text-sura-ivory outline-none focus:border-sura-gold"
        />
        <button
          type="submit"
          disabled={!user || saving || !message.trim()}
          className="rounded-full bg-sura-gold px-4 py-2 font-inter text-sm font-semibold text-sura-charcoal disabled:opacity-60"
        >
          {saving ? 'Posting...' : 'Post comment'}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {roots.map((comment) => (
          <article key={comment.id} className="rounded-2xl border border-sura-ivory/10 bg-sura-dark/70 p-4">
            <header className="flex items-center justify-between gap-3">
              <div className="font-inter text-sm text-sura-ivory">
                <span className="font-semibold">{comment.author}</span>
                <span className="ml-2 text-sura-ivory/60">{formatDate(comment.createdAt)}</span>
              </div>
              {isModerator ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => moderateComment(comment.id, 'hidden')} className="rounded-full border border-sura-ivory/30 px-3 py-1 text-xs">
                    Hide
                  </button>
                  <button type="button" onClick={() => moderateComment(comment.id, 'visible')} className="rounded-full border border-sura-ivory/30 px-3 py-1 text-xs">
                    Show
                  </button>
                </div>
              ) : null}
            </header>
            <p className="mt-2 font-inter text-sm text-sura-ivory/85">{comment.message}</p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="rounded-full border border-sura-ivory/30 px-3 py-1 text-xs text-sura-ivory/80"
              >
                Reply
              </button>
            </div>

            {replyTo === comment.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-sura-ivory/20 bg-sura-dark/80 p-3 text-sm text-sura-ivory outline-none focus:border-sura-gold"
                  placeholder="Write a reply..."
                />
                <button
                  type="button"
                  onClick={() => createReply(comment.id)}
                  disabled={!user || saving || !replyText.trim()}
                  className="rounded-full bg-sura-gold px-4 py-2 text-xs font-semibold text-sura-charcoal disabled:opacity-60"
                >
                  {saving ? 'Sending...' : 'Submit reply'}
                </button>
              </div>
            ) : null}

            <div className="mt-4 space-y-3 pl-4">
              {(repliesMap.get(comment.id) || []).map((reply) => (
                <div key={reply.id} className="rounded-2xl border border-sura-ivory/10 bg-black/20 p-3">
                  <div className="text-xs text-sura-ivory/70">
                    <span className="font-semibold">{reply.author}</span> • {roleToLabel(user?.role)} reply
                  </div>
                  <p className="mt-1 text-sm text-sura-ivory/85">{reply.message}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
        {roots.length === 0 ? <p className="text-sm text-sura-ivory/70">No comments yet.</p> : null}
      </div>
    </section>
  );
}