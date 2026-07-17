import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';
import { getApiBaseUrl } from '../lib/runtimeConfig';

const API_URL = getApiBaseUrl();

export interface QuoteHighlight {
  id: string;
  contentId: string;
  contentType: string;
  selectedText: string;
  startOffset: number | null;
  endOffset: number | null;
  createdAt: string;
}

interface QuoteHighlighterProps {
  contentId: string;
  contentType: 'article' | 'novel' | 'chapter';
  contentHtml: string;
  authorName?: string;
  onQuoteSaved?: (quote: QuoteHighlight) => void;
}

export function QuoteHighlighter({
  contentId,
  contentType,
  contentHtml,
  authorName,
  onQuoteSaved
}: QuoteHighlighterProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<{ text: string; start: number; end: number } | null>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const isArabic = locale === 'ar';

  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setShowPopup(false);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) {
        setShowPopup(false);
        return;
      }

      // Try to find position relative to container
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Check if selection is within our content container
      if (containerRef.current && !containerRef.current.contains(range.commonAncestorContainer)) {
        setShowPopup(false);
        return;
      }

      setPopupPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });

      selectionRef.current = {
        text,
        start: 0,
        end: 0
      };

      setShowPopup(true);
    };

    const handleClick = (e: MouseEvent) => {
      // Hide popup when clicking elsewhere
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Save highlight to database
  const saveHighlight = useCallback(async () => {
    if (!user || !selectionRef.current || saving) return;

    const { text } = selectionRef.current;
    setSaving(true);

    try {
      // NOTE: backend route is POST /api/engagement/quote (not /api/quotes),
      // and must use the API domain, not a relative path.
      const res = await fetch(`${API_URL}/api/engagement/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contentId,
          contentType,
          selectedText: text,
          startOffset: selectionRef.current.start,
          endOffset: selectionRef.current.end
        })
      });

      if (!res.ok) throw new Error('Failed to save');

      const quote = await res.json();

      if (quote?.id) {
        trackEvent('quote_saved', {
          content_type: contentType,
          content_id: contentId,
          text_length: text.length
        });

        onQuoteSaved?.(quote);
      }

      // Clear selection
      window.getSelection()?.removeAllRanges();
      setShowPopup(false);
      selectionRef.current = null;
    } catch (err) {
      console.error('Failed to save highlight:', err);
    } finally {
      setSaving(false);
    }
  }, [user, contentId, contentType, saving, onQuoteSaved]);

  // Generate shareable quote
  const shareQuote = useCallback(async () => {
    if (!selectionRef.current) return;

    const { text } = selectionRef.current;
    const shareText = `"${text}"${authorName ? ` — ${authorName}` : ''}`;
    const shareUrl = `${window.location.origin}/${contentType === 'article' ? 'articles' : contentType === 'novel' ? 'novels' : 'novels'}/${contentId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: shareUrl
        });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }

    trackEvent('quote_shared', {
      content_type: contentType,
      content_id: contentId
    });

    window.getSelection()?.removeAllRanges();
    setShowPopup(false);
    selectionRef.current = null;
  }, [contentId, contentType, authorName]);

  // Apply highlight styles to text
  useEffect(() => {
    if (!containerRef.current) return;

    // Add highlight class to quotes that were previously saved
    // This runs once on mount - actual highlighting is handled via selection
  }, []);

  return (
    <div className="relative">
      {/*
        تعديل: عرض contentHtml كـ HTML منسّق بدل نص خام.
        كان {contentHtml} يُعرض كنص عادي (React يهرب أي HTML تلقائيًا)،
        وهذا كان السبب الحقيقي وراء ظهور وسوم HTML خام في الصفحة.
      */}
      <div
        ref={containerRef}
        className="quote-highlight-container"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Highlight Tooltip Popup */}
      {showPopup && (
        <div
          className="fixed z-50 flex items-center gap-1 rounded-lg bg-sura-dark px-2 py-1.5 shadow-lg"
          style={{
            left: popupPos.x,
            top: popupPos.y - 45,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={saveHighlight}
            disabled={saving || !user}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-sura-ivory hover:bg-sura-teal/20 disabled:opacity-50"
            title={isArabic ? 'حفظ الاقتباس' : 'Save Quote'}
          >
            {saving ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-purple-500/30 border-t-purple-500" />
            ) : (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
            <span>{isArabic ? 'حفظ' : 'Save'}</span>
          </button>

          <button
            onClick={shareQuote}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-sura-ivory hover:bg-sura-teal/20"
            title={isArabic ? 'مشاركة' : 'Share'}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.643m5.326-1.32a3 3 0 014.952-1.31m-4.952 1.31l6.632-3.642m0 0a3 3 0 01-4.952-1.31m4.952 4.964l-6.632-3.642m0 0a3 3 0 01-4.952-1.31m4.952 4.964l-4.952-1.31" />
            </svg>
            <span>{isArabic ? 'مشاركة' : 'Share'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default QuoteHighlighter;
