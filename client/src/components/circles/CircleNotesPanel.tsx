import { FormEvent, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../AvatarUpload';
import {
  createNote,
  updateNote,
  deleteNote,
  type CircleNote,
} from '../../services/studyCircleService';

interface CircleNotesPanelProps {
  circleId: string;
  notes: CircleNote[];
  isMember?: boolean;
  onNotesChange?: (notes: CircleNote[]) => void;
}

/**
 * Shared notes list with create/edit/delete. Only the note author can
 * edit/delete (backend enforces); any active member can create.
 */
export function CircleNotesPanel({ circleId, notes, isMember = false, onNotesChange }: CircleNotesPanelProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<CircleNote | null>(null);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        const updated = await updateNote(editing.id, { title: title.trim(), content: content.trim() });
        onNotesChange?.(notes.map((n) => (n.id === editing.id ? updated : n)));
      } else {
        const note = await createNote(circleId, { title: title.trim(), content: content.trim() });
        onNotesChange?.([note, ...notes]);
      }
      setTitle('');
      setContent('');
      setEditing(null);
      setShowForm(false);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (note: CircleNote) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setShowForm(true);
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      onNotesChange?.(notes.filter((n) => n.id !== noteId));
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-inter text-sm font-semibold text-sura-ivory">
          {isArabic ? 'الملاحظات المشتركة' : 'Shared notes'}
        </h3>
        {isMember && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setTitle('');
              setContent('');
              setShowForm((v) => !v);
            }}
            className="text-xs font-semibold text-sura-teal hover:underline"
          >
            {showForm ? (isArabic ? 'إلغاء' : 'Cancel') : isArabic ? '+ ملاحظة' : '+ Note'}
          </button>
        )}
      </div>

      {showForm && isMember && (
        <form onSubmit={handleCreate} className="mb-4 space-y-2 rounded-xl border border-sura-ivory/10 p-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isArabic ? 'عنوان الملاحظة' : 'Note title'}
            className="w-full rounded-full border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={isArabic ? 'محتوى الملاحظة' : 'Note content'}
            className="w-full resize-none rounded-xl border border-sura-ivory/20 bg-sura-dark/80 px-4 py-2 font-inter text-sm text-sura-ivory outline-none focus:border-sura-gold"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="rounded-full bg-sura-gold px-4 py-2 text-sm font-semibold text-sura-charcoal disabled:opacity-50"
          >
            {submitting ? '…' : editing ? (isArabic ? 'تحديث' : 'Update') : isArabic ? 'حفظ' : 'Save'}
          </button>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="text-xs text-sura-ivory/50">{isArabic ? 'لا توجد ملاحظات بعد' : 'No notes yet'}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border border-sura-ivory/10 p-3">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="font-inter text-sm font-semibold text-sura-ivory/85">{note.title}</h4>
                {note.authorId === user?.id && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(note)}
                      className="text-[11px] text-sura-teal hover:underline"
                    >
                      {isArabic ? 'تعديل' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      className="text-[11px] text-red-300 hover:underline"
                    >
                      {isArabic ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-sura-ivory/65">{note.content}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Avatar url={note.author.avatar ?? undefined} name={note.author.name} size="xs" />
                <span className="text-[11px] text-sura-ivory/40">{note.author.name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CircleNotesPanel;
