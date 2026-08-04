import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Reusable empty-state block, consistent with the app's styling.
 * Provides an accessible region for screen readers.
 */
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 px-6 py-12 text-center ${className}`}
      role="status"
    >
      {icon ? <div className="mb-4 text-sura-ivory/40">{icon}</div> : null}
      <h3 className="font-inter text-lg font-semibold text-sura-ivory">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md font-inter text-sm text-sura-ivory/60">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
