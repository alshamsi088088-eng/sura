import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { trackReadingProgress } from '../lib/analytics';

const API_URL = import.meta.env.VITE_API_URL || '';
const LOCALSTORAGE_KEY = 'sura_reading_progress';
const WEEKLY_READING_KEY = 'sura_weekly_reading';

interface ReadingProgressTrackerProps {
  entityId: string;
  entityType: 'article' | 'novel';
  contentId: string;
  currentStep: number;
  totalSteps: number;
}

function loadFromLocalStorage(entityId: string): number {
  try {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!data) return 0;
    const parsed = JSON.parse(data) as Record<string, { progress: number; updatedAt: string }>;
    return parsed[entityId]?.progress || 0;
  } catch {
    return 0;
  }
}

function saveToLocalStorage(entityId: string, progress: number, entityType: string) {
  try {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    parsed[entityId] = { progress, entityType, updatedAt: new Date().toISOString() };
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(parsed));
    updateWeeklyReading(progress >= 100 ? 1 : 0, entityType);
  } catch (error) {
    console.error('Failed to save to localStorage', error);
  }
}

function updateWeeklyReading(completeCount: number, entityType: string) {
  try {
    const key = `${WEEKLY_READING_KEY}_${new Date().toISOString().slice(0, 7)}`;
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : { articles: 0, chapters: 0 };
    if (entityType === 'article') {
      parsed.articles = (parsed.articles || 0) + completeCount;
    } else {
      parsed.chapters = (parsed.chapters || 0) + completeCount;
    }
    localStorage.setItem(key, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}

export function getWeeklyReading(): { articles: number; chapters: number; date: string } {
  try {
    const key = `${WEEKLY_READING_KEY}_${new Date().toISOString().slice(0, 7)}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { articles: 0, chapters: 0, date: new Date().toISOString() };
  } catch {
    return { articles: 0, chapters: 0, date: new Date().toISOString() };
  }
}

export function ReadingProgressTracker({ entityId, entityType, contentId, currentStep, totalSteps }: ReadingProgressTrackerProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);

  // Load initial progress from localStorage or API
  useEffect(() => {
    const savedProgress = loadFromLocalStorage(entityId);
    if (savedProgress > 0) {
      setProgress(savedProgress);
    }

    // Also try to load from API if logged in
    if (!user) return;

    const fetchProgress = async () => {
      try {
        const res = await fetch(`${API_URL}/api/progress/${entityId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.progress > 0) {
            setProgress(data.progress);
            saveToLocalStorage(entityId, data.progress, entityType);
          }
        }
      } catch (err) {
        console.error('Failed to fetch reading progress:', err);
      }
    };

    fetchProgress();
  }, [entityId, entityType, user]);

  // Save progress when it changes
  useEffect(() => {
    if (totalSteps <= 0) return;
    const percentage = Math.min(100, Math.round((currentStep / totalSteps) * 100));
    setProgress(percentage);

    if (percentage >= 100 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      updateWeeklyReading(1, entityType);
    }

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      saveToLocalStorage(entityId, percentage, entityType);
      trackReadingProgress(entityId, entityType, percentage);

      // Try to save to API if logged in
      if (!user) return;
      try {
        await fetch(`${API_URL}/api/progress/${entityId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            currentStep,
            totalSteps,
            progress: percentage
          })
        });
      } catch (error) {
        console.error('Failed to save reading progress to API', error);
      }
    }, 400);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [currentStep, entityId, entityType, totalSteps, user]);

  // Track scroll-based progress
  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;
    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const height = rect.height || 1;
      const offset = Math.min(Math.max(0, window.innerHeight - rect.top), window.innerHeight + height);
      const scrollPercent = Math.min(100, Math.round((offset / (height + window.innerHeight)) * 100));
      setProgress(Math.max(progress, scrollPercent));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [contentId, progress]);

  // Export for WeeklyTargetBanner
  (window as any).getWeeklyReading = getWeeklyReading;

  return (
    <div className="rounded-3xl border border-sura-ivory/10 bg-sura-dark/80 p-4 text-sura-ivory/80">
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-sura-gold">
        <span>Reading progress</span>
        <span>{progress}%</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-sura-ivory/10">
        <div className="h-full rounded-full bg-sura-gold" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-xs text-sura-ivory/60">Track progress automatically while scrolling or switching chapters.</p>
    </div>
  );
}