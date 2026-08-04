interface SeriesProgressBarProps {
  progress: number; // 0 | 25 | 50 | 75 | 100
  totalItems: number;
  completedItems: number;
  estimatedReadingTime?: string;
}

export function SeriesProgressBar({
  progress,
  totalItems,
  completedItems,
  estimatedReadingTime,
}: SeriesProgressBarProps) {
  const milestones = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-2xl font-bold text-sura-gold">{progress}%</span>
          <span className="text-sm text-sura-navy/60 ml-2">complete</span>
        </div>
        {estimatedReadingTime && (
          <div className="text-sm text-sura-navy/60">
            ~{estimatedReadingTime}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-3 overflow-hidden rounded-full bg-sura-ivory/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sura-gold to-purple-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Milestones */}
      <div className="flex justify-between mt-3">
        {milestones.map((milestone) => {
          const reached = progress >= milestone;
          const isCurrent = progress >= milestone && (milestone === 0 || progress < milestone + 25);
          return (
            <div key={milestone} className="flex flex-col items-center gap-1">
              <div
                className={`h-4 w-4 rounded-full border-2 transition-all ${
                  reached
                    ? 'border-sura-gold bg-sura-gold'
                    : 'border-sura-ivory/20 bg-transparent'
                } ${isCurrent ? 'ring-2 ring-sura-gold/30' : ''}`}
              />
              <span className={`text-[10px] ${reached ? 'text-sura-gold' : 'text-sura-navy/40'}`}>
                {milestone}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-sura-navy/70">
        <span>{completedItems} / {totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
        {completedItems === totalItems && totalItems > 0 && (
          <span className="flex items-center gap-1 text-green-400 font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Completed
          </span>
        )}
      </div>
    </div>
  );
}
