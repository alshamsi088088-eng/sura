import { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface AdminMenuProps {
  entityType: 'article' | 'novel' | 'chapter' | 'comment' | 'book' | 'gallery';
  entityId: string;
  onEdit?: () => void;
  onDeleteSuccess?: () => void;
  children?: ReactNode;
}

export function AdminMenu({ entityType, entityId, onEdit, onDeleteSuccess, children }: AdminMenuProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show for admins
  if (user?.role !== 'admin') {
    return <>{children}</>;
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      // Default edit navigation based on entity type
      const routes: Record<string, string> = {
        article: `/edit-post/${entityId}`,
        novel: `/edit-novel/${entityId}`,
        chapter: `/edit-chapter/${entityId}`,
        book: `/edit-book/${entityId}`,
        gallery: `/edit-gallery/${entityId}`,
      };
      const route = routes[entityType];
      if (route) {
        navigate(route);
      }
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const endpointMap: Record<string, string> = {
        article: `/api/admin/articles/${entityId}`,
        novel: `/api/admin/novels/${entityId}`,
        chapter: `/api/admin/chapters/${entityId}`,
        comment: `/api/admin/comments/${entityId}`,
        book: `/api/admin/books/${entityId}`,
        gallery: `/api/admin/gallery/${entityId}`,
      };

      const endpoint = endpointMap[entityType];
      if (!endpoint) {
        throw new Error('Unknown entity type');
      }

      await axios.delete(endpoint, { withCredentials: true });

      setShowConfirm(false);
      setShowMenu(false);

      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        // Default: reload or navigate away
        window.location.reload();
      }
    } catch (e: any) {
      console.error('Delete failed:', e);
      setError(e.response?.data?.message || e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const entityLabel = {
    article: locale === 'ar' ? 'مقال' : 'Article',
    novel: locale === 'ar' ? 'رواية' : 'Novel',
    chapter: locale === 'ar' ? 'فصل' : 'Chapter',
    comment: locale === 'ar' ? 'تعليق' : 'Comment',
    book: locale === 'ar' ? 'كتاب' : 'Book',
    gallery: locale === 'ar' ? 'صورة' : 'Image',
  }[entityType];

  return (
    <div className="relative inline-block">
      {/* Main content with admin trigger */}
      <div onClick={() => setShowMenu(!showMenu)} className="cursor-pointer">
        {children || (
          <button className="rounded-full border border-sura-line px-3 py-1 text-xs text-sura-navy/70 hover:bg-sura-navy/10">
            {locale === 'ar' ? 'إجراءات' : 'Actions'}
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-xl border border-sura-line bg-sura-canvas shadow-lg">
          <button
            onClick={handleEdit}
            className="w-full rounded-t-xl px-3 py-2 text-left text-sm hover:bg-sura-navy/10"
          >
            {locale === 'ar' ? 'تعديل' : 'Edit'}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full rounded-b-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            {locale === 'ar' ? 'حذف' : 'Delete'}
          </button>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 rounded-2xl bg-sura-canvas p-6 shadow-xl">
            <h3 className="text-lg font-semibold">
              {locale === 'ar' ? `حذف ${entityLabel}؟` : `Delete ${entityLabel}?`}
            </h3>
            <p className="mt-2 text-sm text-sura-navy/70">
              {locale === 'ar'
                ? 'لا يمكن التراجع عن هذا الإجراء.'
                : 'This action cannot be undone.'}
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-full border border-sura-line px-4 py-2 text-sm"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {deleting
                  ? locale === 'ar'
                    ? 'جاري الحذف...'
                    : 'Deleting...'
                  : locale === 'ar'
                    ? 'حذف'
                    : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}