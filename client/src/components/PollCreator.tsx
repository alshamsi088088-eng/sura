import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

interface PollCreatorProps {
  contentId: string;
  contentType: 'article' | 'novel' | 'chapter';
  onPollCreated?: (poll: unknown) => void;
}

export function PollCreator({ contentId, contentType, onPollCreated }: PollCreatorProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [closesAt, setClosesAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isArabic = locale === 'ar';

  const handleAddOption = useCallback(() => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  }, [options.length]);

  const handleRemoveOption = useCallback((index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }, [options.length]);

  const handleOptionChange = useCallback((index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }, [options]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      setError(isArabic ? '\u062d\u062f\u0652 \u0627\u0644\u062d\u062f\u0652 \u062b\u064a\u0646 \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a' : 'At least 2 options required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/engagement/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contentId,
          contentType,
          question: question.trim(),
          type: pollType,
          isAnonymous,
          isPublic,
          closesAt: closesAt || null,
          options: validOptions
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      const poll = await res.json();
      setQuestion('');
      setOptions(['', '']);
      setPollType('single');
      setIsAnonymous(false);
      setIsPublic(true);
      setClosesAt('');
      onPollCreated?.(poll);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating poll');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, contentId, contentType, question, options, pollType, isAnonymous, isPublic, closesAt, isArabic, onPollCreated]);

  if (!user) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-sura-ivory/10 bg-sura-dark p-4 space-y-4">
      <h3 className="text-lg font-medium text-sura-ivory">
        {isArabic ? '\u0625\u0646\u0634\u0627\u0621 \u0627\u0633\u062a\u064b\u0627\u0646' : 'Create Poll'}
      </h3>

      {/* Question */}
      <div>
        <label className="block text-sm text-sura-ivory/60 mb-1">
          {isArabic ? '\u0627\u0644\u0633\u0624\u0627\u0644' : 'Question'}
        </label>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder={isArabic ? '\u0645\u0627 \u0647\u0648 \u0631\u0626\u064a\u0643 \u061f' : 'What is your question?'}
          className="w-full rounded-lg border border-sura-ivory/20 bg-sura-dark px-4 py-2 text-sura-ivory placeholder:text-sura-ivory/40 focus:border-sura-teal focus:outline-none"
          required
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="block text-sm text-sura-ivory/60">
          {isArabic ? '\u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a' : 'Options'}
        </label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={option}
              onChange={e => handleOptionChange(index, e.target.value)}
              placeholder={`${isArabic ? '\u062e\u064a\u0627\u0631' : 'Option'} ${index + 1}`}
              className="flex-1 rounded-lg border border-sura-ivory/20 bg-sura-dark px-4 py-2 text-sura-ivory placeholder:text-sura-ivory/40 focus:border-sura-teal focus:outline-none"
              required={index < 2}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="px-3 py-2 text-red-400 hover:text-red-300"
              >
                &times;
              </button>
            )}
          </div>
        ))}

        {options.length < 10 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="text-sm text-sura-teal hover:underline"
          >
            + {isArabic ? '\u0625\u0636\u0627\u0641\u0629 \u062e\u064a\u0627\u0631' : 'Add option'}
          </button>
        )}
      </div>

      {/* Poll type */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="pollType"
            checked={pollType === 'single'}
            onChange={() => setPollType('single')}
            className="accent-sura-teal"
          />
          <span className="text-sura-ivory text-sm">
            {isArabic ? '\u0648\u0627\u062d\u062f' : 'Single choice'}
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="pollType"
            checked={pollType === 'multiple'}
            onChange={() => setPollType('multiple')}
            className="accent-sura-teal"
          />
          <span className="text-sura-ivory text-sm">
            {isArabic ? '\u0645\u062a\u0639\u062f\u062f' : 'Multiple choice'}
          </span>
        </label>
      </div>

      {/* Settings */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={e => setIsAnonymous(e.target.checked)}
            className="accent-sura-teal"
          />
          <span className="text-sura-ivory text-sm">
            {isArabic ? '\u0645\u062c\u0647\u0648\u0644' : 'Anonymous'}
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="accent-sura-teal"
          />
          <span className="text-sura-ivory text-sm">
            {isArabic ? '\u0639\u064a\u0646 \u0627\u0644\u0646\u062a\u0627\u0626\u062c' : 'Public results'}
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!closesAt}
            onChange={e => {
              if (e.target.checked) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setClosesAt(tomorrow.toISOString().slice(0, 16));
              } else {
                setClosesAt('');
              }
            }}
            className="accent-sura-teal"
          />
          <span className="text-sura-ivory text-sm">
            {isArabic ? '\u0625\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0627\u0633\u062a\u064a\u0637\u0644\u0627\u0639' : 'Set close date'}
          </span>
        </label>
        {closesAt && (
          <input
            type="datetime-local"
            value={closesAt}
            onChange={e => setClosesAt(e.target.value)}
            className="rounded-lg border border-sura-ivory/20 bg-sura-dark px-4 py-2 text-sura-ivory focus:border-sura-teal focus:outline-none"
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-sura-teal px-4 py-2 text-sura-dark font-medium hover:bg-sura-teal/90 disabled:opacity-50"
      >
        {isSubmitting
          ? isArabic ? '\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0646\u0634\u0627\u0621...' : 'Creating...'
          : isArabic ? '\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0627\u0633\u062a\u064b\u0627\u0646' : 'Create Poll'}
      </button>
    </form>
  );
}