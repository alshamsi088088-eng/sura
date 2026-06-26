import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ReadingProgressProps {
  contentType: 'article' | 'novel' | 'chapter' | 'book';
  contentId: string;
  title?: string;
  content?: string;
}

export function ReadingProgress({ contentType, contentId, title, content }: ReadingProgressProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [readingTime, setReadingTime] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastSaveTime = useRef<number>(0);
  const hasInitiallyLoaded = useRef(false);

  // Calculate estimated reading time from content
  useEffect(() => {
    if (content) {
      const wordsPerMinute = 200;
      const wordCount = content.trim().split(/\s+/).length;
      const minutes = Math.ceil(wordCount / wordsPerMinute);
      setReadingTime(minutes);
    }
  }, [content]);

  // Load initial progress from ReadingHistory
  useEffect(() => {
    if (!supabase || hasInitiallyLoaded.current) return;
    hasInitiallyLoaded.current = true;

    const loadProgress = async () => {
      if (!user || !supabase) return;

      try {
        const { data } = await supabase
          .from('ReadingHistory')
          .select('progress')
          .eq('userId', user.id)
          .eq('contentType', contentType)
          .eq('contentId', contentId)
          .single();

        if (data?.progress) {
          setProgress(data.progress);
        }
      } catch {
        // No existing progress yet
      }
    };

    if (user && contentId) {
      loadProgress();
    }
  }, [user, contentType, contentId]);

  // Handle scroll and save progress
  const updateProgress = useCallback(async () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
    const clampedProgress = Math.min(100, Math.max(0, scrollPercent));

    setProgress(clampedProgress);

    // Throttle saves to once per 2 seconds
    const now = Date.now();
    if (now - lastSaveTime.current < 2000) return;

    if (!user || !contentId || !supabase) {
      // Save to localStorage for guests
      localStorage.setItem(`reading_${contentType}_${contentId}`, String(clampedProgress));
      return;
    }

    lastSaveTime.current = now;
    setIsSaving(true);

    try {
      const { data: existing } = await supabase
        .from('ReadingHistory')
        .select('id')
        .eq('userId', user.id)
        .eq('contentType', contentType)
        .eq('contentId', contentId)
        .single();

      if (existing) {
        await supabase
          .from('ReadingHistory')
          .update({
            progress: clampedProgress,
            updatedAt: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('ReadingHistory')
          .insert({
            userId: user.id,
            contentType,
            contentId,
            title,
            progress: clampedProgress
          });
      }
    } catch (err) {
      console.error('Failed to save reading progress:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user, contentType, contentId, title]);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);

    // Initial progress check after render
    setTimeout(updateProgress, 100);

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [updateProgress]);

  // Format reading time
  const formatReadingTime = (minutes: number | null) => {
    if (minutes === null) return null;
    if (minutes < 1) return '< 1 min';
    if (minutes === 1) return '1 min';
    return `${minutes} min`;
  };

  if (progress === 0 && readingTime === null) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      {/* Scroll Progress Bar */}
      <div className="h-1 w-full bg-sura-dark/50">
        <div
          className="h-full bg-gradient-to-r from-sura-teal to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Indicator - Stays in view when scrolled */}
      <div className="absolute top-2 right-4 flex items-center gap-2 rounded-lg bg-sura-dark/80 backdrop-blur-sm px-3 py-1.5">
        <span className="text-xs font-medium text-sura-ivory/70">
          {progress}%
        </span>
        {readingTime !== null && (
          <span className="text-xs text-sura-ivory/50">
            {formatReadingTime(readingTime)}
          </span>
        )}
        {isSaving && (
          <div className="h-3 w-3 animate-spin rounded-full border border-purple-500/30 border-t-purple-500" />
        )}
      </div>
    </div>
  );
}

// Hook for getting reading history
export function useReadingHistory(contentType: string, contentId: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);

      if (!user || !contentId || !supabase) {
        // Try localStorage for guests
        const stored = localStorage.getItem(`reading_${contentType}_${contentId}`);
        if (stored) {
          setProgress(parseInt(stored, 10) || 0);
        }
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('ReadingHistory')
          .select('progress')
          .eq('userId', user.id)
          .eq('contentType', contentType)
          .eq('contentId', contentId)
          .single();

        if (data?.progress) {
          setProgress(data.progress);
        }
      } catch {
        setProgress(0);
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      loadProgress();
    }
  }, [user, contentType, contentId]);

  const scrollToProgress = () => {
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const targetScroll = (progress / 100) * scrollHeight;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  return { progress, loading, scrollToProgress };
}

export default ReadingProgress;