import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface DiscussionEditorProps {
  contentId?: string;
  contentType?: string;
  parentId?: string;
  onSuccess?: (thread: Record<string, unknown>) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  'Discussion',
  'Theory',
  'Question',
  'Character',
  'Quote',
  'Prediction',
  'Fan Content',
];

export function DiscussionEditor({
  contentId,
  contentType,
  parentId,
  onSuccess,
  onCancel,
}: DiscussionEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Discussion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
        <p className="text-gray-400">Sign in to start a discussion</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!body.trim()) {
      setError('Content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/community/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category,
          contentId,
          contentType,
          parentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create discussion');
      }

      const thread = await res.json();
      setTitle('');
      setBody('');
      if (onSuccess) {
        onSuccess(thread);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
    >
      <h3 className="text-lg font-semibold text-white mb-4">
        {parentId ? 'Reply to Discussion' : 'Start a Discussion'}
      </h3>

      {!parentId && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {!parentId && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
            className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">
          {parentId ? 'Reply' : 'Content'}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts..."
          rows={parentId ? 3 : 5}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Post'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}