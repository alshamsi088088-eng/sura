import { useLocale } from '../../context/LocaleContext';
import { Avatar } from '../AvatarUpload';
import { ReaderLevelBadge } from './ReaderLevelBadge';
import type { LeaderboardEntry } from '../../services/leaderboardService';

interface TopReadersSectionProps {
  entries: LeaderboardEntry[];
  onSelect?: (entry: LeaderboardEntry) => void;
}

const PODIUM_ORDER = [1, 0, 2]; // display order: 2nd, 1st, 3rd
const PODIUM_STYLE = [
  { height: 'h-24', emoji: '🥈', ring: 'ring-slate-300/50' },
  { height: 'h-32', emoji: '👑', ring: 'ring-amber-400/60' },
  { height: 'h-20', emoji: '🥉', ring: 'ring-orange-400/50' },
];

export function TopReadersSection({ entries, onSelect }: TopReadersSectionProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <section aria-label={isArabic ? 'أفضل القراء' : 'Top Readers'} className="mb-6">
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {PODIUM_ORDER.map((idx) => {
          const entry = top3[idx];
          if (!entry) return null;
          const style = PODIUM_STYLE[idx];
          const rank = idx + 1;

          return (
            <button
              key={entry.userId}
              type="button"
              onClick={() => onSelect?.(entry)}
              className="group flex w-28 flex-col items-center sm:w-36"
              aria-label={`${entry.name} — ${isArabic ? 'المرتبة' : 'Rank'} ${rank}`}
            >
              <span className="text-2xl" aria-hidden="true">
                {style.emoji}
              </span>
              <div
                className={`relative mt-1 ${style.height} ${style.ring} flex w-full items-start justify-center rounded-t-2xl border border-b-0 bg-sura-ivory/5 ring-2 transition group-hover:bg-sura-ivory/10`}
              >
                <div className="absolute -top-9 flex flex-col items-center">
                  <Avatar url={entry.avatar || undefined} name={entry.name} size="lg" />
                  <span className="mt-1 text-sm font-bold text-sura-ivory">
                    {entry.name.split(' ')[0]}
                  </span>
                  <span className="text-lg font-bold text-[#7F77DD]">
                    {entry.score.toLocaleString()}
                  </span>
                  <ReaderLevelBadge level={entry.level} size="sm" />
                </div>
              </div>
              <div className="w-full rounded-b-2xl bg-sura-ivory/10 py-2 text-center text-xs font-semibold text-sura-ivory/70">
                {isArabic ? 'المرتبة' : 'Rank'} {rank}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
