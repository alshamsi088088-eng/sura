import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Author {
  id: string;
  name: string;
  avatar: string | null;
}

interface DiscussionCardProps {
  thread: {
    id: string;
    title: string;
    body: string;
    category: string;
    createdAt: string;
    author: Author;
    replyCount: number;
  };
  onDelete?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  Discussion: 'bg-blue-600',
  Theory: 'bg-purple-600',
  Question: 'bg-yellow-600',
  Character: 'bg-pink-600',
  Quote: 'bg-indigo-600',
  Prediction: 'bg-green-600',
  'Fan Content': 'bg-orange-600',
};

export function DiscussionCard({ thread, onDelete }: DiscussionCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = user?.id === thread.author.id;
  const isAdmin = user?.role === 'admin';

  const handleDelete = async () => {
    if (!window.confirm('Delete this discussion?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/community/threads/${thread.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok && onDelete) {
        onDelete(thread.id);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateBody = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 text-xs rounded ${
                categoryColors[thread.category] || 'bg-gray-600'
              }`}
            >
              {thread.category}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(thread.createdAt)}
            </span>
          </div>

          <Link
            to={`/community/thread/${thread.id}`}
            className="block text-lg font-semibold text-white hover:text-blue-400 transition-colors mb-1"
          >
            {thread.title}
          </Link>

          <p className="text-gray-300 text-sm mb-2">
            {truncateBody(thread.body)}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {thread.author.avatar && (
                <img
                  src={thread.author.avatar}
                  alt={thread.author.name}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span className="text-sm text-gray-400">{thread.author.name}</span>
            </div>
            <span className="text-xs text-gray-500">
              {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>

        {(isAuthor || isAdmin) && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-500 hover:text-red-400 p-1"
            title="Delete"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}