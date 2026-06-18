import { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { trackBookmark } from '../lib/analytics';

interface BookmarkButtonProps {
  entityId: string;
  entityType: 'article' | 'novel' | 'book';
}

export function BookmarkButton({ entityId, entityType }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const bookmarkId = `${currentUser.uid}_${entityId}`;
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
    const unsubscribe = onSnapshot(bookmarkRef, (snapshot) => {
      setBookmarked(snapshot.exists());
    });
    return () => unsubscribe();
  }, [entityId]);

  const toggleBookmark = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setLoading(true);
    const bookmarkId = `${currentUser.uid}_${entityId}`;
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
    try {
      if (bookmarked) {
        await deleteDoc(bookmarkRef);
        trackBookmark(entityId, entityType, 'remove');
      } else {
        await setDoc(bookmarkRef, {
          uid: currentUser.uid,
          entityId,
          entityType,
          updatedAt: new Date().toISOString()
        });
        trackBookmark(entityId, entityType, 'add');
      }
    } catch (error) {
      console.error('Bookmark update failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      disabled={!user || loading}
      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${bookmarked ? 'bg-sura-gold text-sura-dark' : 'border border-sura-ivory/20 bg-sura-beige/80 text-sura-navy/80 hover:border-sura-gold/60'}`}
    >
      {bookmarked ? 'Bookmarked' : 'Bookmark'}
    </button>
  );
}
