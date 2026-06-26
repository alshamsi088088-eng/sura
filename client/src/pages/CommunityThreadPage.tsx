import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DiscussionEditor } from '../components/DiscussionEditor';
import { ThreadedComments } from '../components/ThreadedComments';
import { ReactionBar } from '../components/ReactionBar';
import { LikeButton } from '../components/LikeButton';
import { BookmarkButton } from '../components/BookmarkButton';
import { RatingStars } from '../components/RatingStars';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { useAuth } from '../context/AuthContext';

interface Author {
  id: string;
  name: string;
  avatar: string | null;
}

interface Reply {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  author: Author;
}

interface ThreadDetail {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
  replies: Reply[];
}

export function CommunityThreadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReplyEditor, setShowReplyEditor] = useState(false);

  usePageMetadata(thread?.title || 'Discussion', 'View this discussion');

  useEffect(() => {
    fetchThread();
  }, [id]);

  const fetchThread = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/community/threads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setThread(data);
      } else {
        navigate('/community');
      }
    } catch (err) {
      console.error('Failed to fetch thread:', err);
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySuccess = (reply: unknown) => {
    const r = reply as Reply;
    if (thread && r?.id) {
      setThread({
        ...thread,
        replies: [...thread.replies, r],
      });
      setShowReplyEditor(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">Discussion not found</p>
        <Link to="/community" className="text-blue-400 hover:underline">
          Back to Community
        </Link>
      </div>
    );
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/community"
        className="text-blue-400 hover:underline mb-4 inline-block"
      >
        ← Back to Community
      </Link>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-3">
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

        <h1 className="text-2xl font-bold text-white mb-4">{thread.title}</h1>

        <div className="flex items-center gap-3 mb-4">
          {thread.author.avatar && (
            <img
              src={thread.author.avatar}
              alt={thread.author.name}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-gray-300">{thread.author.name}</span>
        </div>

        <div className="prose prose-invert max-w-none mb-6">
          <p className="text-gray-300 whitespace-pre-wrap">{thread.body}</p>
        </div>

        <div className="flex items-center gap-4 border-t border-gray-700 pt-4">
          <ReactionBar contentId={thread.id} contentType="community" />
          <LikeButton contentId={thread.id} contentType="community" />
          <BookmarkButton contentId={thread.id} contentType="community" />
          <RatingStars contentId={thread.id} contentType="community" />
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowReplyEditor(!showReplyEditor)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reply to Discussion
        </button>
      </div>

      {showReplyEditor && (
        <div className="mb-6">
          <DiscussionEditor
            parentId={thread.id}
            onSuccess={handleReplySuccess}
            onCancel={() => setShowReplyEditor(false)}
          />
        </div>
      )}

      {thread.replies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Replies ({thread.replies.length})
          </h2>
          <div className="space-y-4">
            {thread.replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs rounded bg-gray-600">
                    {reply.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {reply.title}
                </h3>
                <p className="text-gray-300 mb-2">{reply.body}</p>
                <div className="flex items-center gap-2">
                  {reply.author.avatar && (
                    <img
                      src={reply.author.avatar}
                      alt={reply.author.name}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-400">
                    {reply.author.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Comments</h2>
        <ThreadedComments entityId={thread.id} entityType="community" />
      </div>
    </div>
  );
}