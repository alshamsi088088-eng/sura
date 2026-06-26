import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

interface PollOption {
  id: string;
  text: string;
  _count?: { votes: number };
  percentage?: number;
}

interface Poll {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  isAnonymous: boolean;
  isPublic: boolean;
  closesAt: string | null;
  createdAt: string;
  options: PollOption[];
}

interface PollComponentProps {
  contentId: string;
  contentType: 'article' | 'novel' | 'chapter';
  onVote?: (pollId: string, optionIds: string[]) => void;
}

export function PollComponent({ contentId, contentType, onVote }: PollComponentProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());

  const isArabic = locale === 'ar';

  // Fetch polls
  useEffect(() => {
    if (!contentId) return;

    setIsLoading(true);
    fetch(`/api/engagement/polls?contentId=${contentId}&contentType=${contentType}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setPolls(data);
        // Pre-select user's voted options
        if (user && data.length > 0) {
          const voted = new Set<string>();
          data.forEach((poll: Poll) => {
            poll.options.forEach(opt => {
              if (opt._count?.votes && opt._count.votes > 0) {
                voted.add(opt.id);
              }
            });
          });
          setSelectedOptions(voted);
        }
      })
      .catch(() => setPolls([]))
      .finally(() => setIsLoading(false));
  }, [contentId, contentType, user]);

  const handleVote = useCallback(async (pollId: string, optionIds: string[]) => {
    if (!user || optionIds.length === 0) return;

    try {
      const res = await fetch('/api/engagement/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pollId, optionIds })
      });

      if (res.ok) {
        setSelectedOptions(new Set(optionIds));
        onVote?.(pollId, optionIds);
        // Refresh polls to get updated results
        const refreshRes = await fetch(`/api/engagement/polls?contentId=${contentId}&contentType=${contentType}`);
        const data = await refreshRes.json();
        setPolls(data);
      }
    } catch (error) {
      console.error('Vote error:', error);
    }
  }, [user, contentId, contentType, onVote]);

  const getResults = useCallback(async (pollId: string) => {
    try {
      const res = await fetch(`/api/engagement/results?pollId=${pollId}`);
      return res.ok ? res.json() : null;
    } catch {
      return null;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sura-teal border-t-transparent" />
      </div>
    );
  }

  if (polls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {polls.map(poll => (
        <PollCard
          key={poll.id}
          poll={poll}
          user={user}
          isArabic={isArabic}
          selectedOptions={selectedOptions}
          onVote={handleVote}
          getResults={getResults}
        />
      ))}
    </div>
  );
}

interface PollCardProps {
  poll: Poll;
  user: { id?: string } | null;
  isArabic: boolean;
  selectedOptions: Set<string>;
  onVote: (pollId: string, optionIds: string[]) => void;
  getResults: (pollId: string) => Promise<{ results: PollOption[]; totalVotes: number } | null>;
}

function PollCard({ poll, user, isArabic, selectedOptions, onVote, getResults }: PollCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{ results: PollOption[]; totalVotes: number } | null>(null);

  useEffect(() => {
    // Check if user already voted
    const voted = poll.options.some(opt => opt._count?.votes && opt._count.votes > 0);
    setHasVoted(voted);
    if (voted) {
      getResults(poll.id).then(data => {
        if (data) {
          setResults(data);
          setShowResults(true);
        }
      });
    }
  }, [poll.id, poll.options, getResults]);

  const handleSelect = (optionId: string) => {
    if (!user || hasVoted || poll.closesAt && new Date(poll.closesAt) < new Date()) return;

    let newSelected: string[];
    if (poll.type === 'single') {
      newSelected = [optionId];
    } else {
      const next = new Set(selectedOptions);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      newSelected = Array.from(next);
    }

    if (newSelected.length > 0) {
      onVote(poll.id, newSelected);
    }
  };

  const isClosed = poll.closesAt ? new Date(poll.closesAt) < new Date() : false;

  return (
    <div className="rounded-xl border border-sura-ivory/10 bg-sura-dark p-4">
      <h3 className="mb-4 text-lg font-medium text-sura-ivory">{poll.question}</h3>

      <div className="space-y-2">
        {poll.options.map(option => {
          const isSelected = selectedOptions.has(option.id);
          const result = results?.results.find(r => r.id === option.id);

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={!user || hasVoted || isClosed}
              className={`relative w-full rounded-lg border px-4 py-3 text-right transition ${
                isSelected
                  ? 'border-sura-teal bg-sura-teal/10 text-sura-teal'
                  : 'border-sura-ivory/20 text-sura-ivory hover:border-sura-ivory/40'
              } ${!user || hasVoted || isClosed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={isArabic ? 'ml-2' : 'mr-2'}>{option.text}</span>

              {/* Progress bar for voted state */}
              {showResults && result && (
                <div
                  className="absolute inset-y-0 left-0 rounded-lg bg-sura-teal/20 transition-all"
                  style={{ width: `${result.percentage}%` }}
                />
              )}

              {/* Percentage display */}
              {showResults && result && (
                <span className="relative z-10 text-sm text-sura-ivory/60">
                  {result.percentage}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Show results toggle for public polls */}
      {hasVoted && poll.isPublic && results && (
        <button
          onClick={() => setShowResults(!showResults)}
          className="mt-3 text-sm text-sura-teal hover:underline"
        >
          {showResults
            ? isArabic ? '\u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u062a\u0635\u0648\u064a\u062a' : 'Hide results'
            : isArabic ? '\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0646\u062a\u0627\u0626\u062c' : 'Show results'}
        </button>
      )}

      {/* Total votes */}
      {showResults && results && (
        <p className="mt-2 text-sm text-sura-ivory/40">
          {isArabic
            ? `${results.totalVotes} \u0635\u0648\u062a \u062a\u0635\u0648\u064a\u062a`
            : `${results.totalVotes} votes`}
        </p>
      )}

      {/* Closed notice */}
      {isClosed && (
        <p className="mt-2 text-sm text-red-400">
          {isArabic ? '\u0627\u0644\u0627\u0633\u062a\u064a\u0637\u0644\u0627\u0639 \u0645\u0646\u062a\u0647\u064a' : 'Poll closed'}
        </p>
      )}
    </div>
  );
}