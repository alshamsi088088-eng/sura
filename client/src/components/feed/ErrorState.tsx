import { ReactNode } from 'react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Reusable error/retry block with an accessible alert region.
 */
export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
  retryLabel = 'Retry',
  className = '',
  children,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/5 px-6 py-10 text-center ${className}`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <p className="font-inter text-sm text-sura-ivory/85">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full border border-sura-ivory/30 px-4 py-2 font-inter text-xs font-semibold text-sura-ivory/80 transition hover:bg-white/5"
        >
          {retryLabel}
        </button>
      ) : null}
      {children}
    </div>
  );
}

export default ErrorState;
