import { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface RealtimeCommentNotificationsProps {
  entity: string;
}

export function RealtimeCommentNotifications({ entity }: RealtimeCommentNotificationsProps) {
  const [comments, setComments] = useState<Array<{ id: string; author: string; message: string }>>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('entity', '==', entity),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const latest = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      setComments(latest.slice(0, 5));
    });
    return () => unsubscribe();
  }, [entity]);

  const submitComment = async () => {
    const user = auth.currentUser;
    if (!user || !message.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'comments'), {
        entity,
        author: user.displayName || user.email || 'Guest',
        message: message.trim(),
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setMessage('');
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
          <p className="mt-2 text-sm text-sura-ivory/70">Realtime reader notes and notifications from Firestore.</p>
        </div>
      </div>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-3xl border border-sura-border/20 bg-sura-ink/80 p-4 text-sm text-sura-ivory/80">
            <div className="font-semibold text-sura-ivory">{comment.author}</div>
            <p className="mt-1 text-sura-ivory/70">{comment.message}</p>
          </div>
        ))}
        {comments.length === 0 && <div className="text-sm text-sura-ivory/70">No comments yet — be the first to share a note.</div>}
      </div>
      <div className="mt-6 space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Write a quick reading note..."
          className="w-full resize-none rounded-3xl border border-sura-ivory/20 bg-sura-dark/90 px-4 py-3 text-sura-ivory outline-none focus:border-sura-gold"
        />
        <button onClick={submitComment} disabled={saving || !message.trim()} className="rounded-full bg-sura-gold px-5 py-3 text-sm font-semibold text-sura-dark disabled:opacity-60">
          {saving ? 'Sending...' : 'Post note'}
        </button>
      </div>
    </section>
  );
}
