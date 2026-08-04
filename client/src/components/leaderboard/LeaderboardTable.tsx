import { useLocale } from '../../context/LocaleContext';
import { Avatar } from '../AvatarUpload';
import { ReaderLevelBadge } from './ReaderLevelBadge';
import type { LeaderboardEntry } from '../../services/leaderboardService';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  onSelect?: (entry: LeaderboardEntry) => void;
  highlightUserId?: string;
}

const MEDAL_COLORS: Record<number, string> = {
  1: 'text-amber-400',
  2: 'text-slate-300',
  3: 'text-orange-400',
};

export function LeaderboardTable({ entries, onSelect, highlightUserId }: LeaderboardTableProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ivory/5 p-10 text-center">
        <p className="text-sura-ivory/60">
          {isArabic
            ? 'لا توجد نتائج بعد. كن أول من يشارك!'
            : 'No results yet. Be the first to participate!'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-sura-ivory/10 bg-sura-ivory/5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm" dir={isArabic ? 'rtl' : 'ltr'}>
          <thead>
            <tr className="border-b border-sura-ivory/10 text-xs uppercase tracking-wider text-sura-ivory/50">
              <th scope="col" className="px-4 py-3 font-semibold">
                {isArabic ? 'الترتيب' : 'Rank'}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {isArabic ? 'القارئ' : 'Reader'}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {isArabic ? 'المستوى' : 'Level'}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                {isArabic ? 'النقاط' : 'Score'}
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isHighlighted = highlightUserId === entry.userId;
              return (
                <tr
                  key={entry.userId}
                  onClick={() => onSelect?.(entry)}
                  className={`cursor-pointer border-b border-sura-ivory/5 transition hover:bg-sura-ivory/5 ${
                    isHighlighted ? 'bg-[#7F77DD]/10' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                        MEDAL_COLORS[entry.rank] || 'text-sura-ivory/60'
                      }`}
                    >
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar url={entry.avatar || undefined} name={entry.name} size="sm" />
                      <div>
                        <div className="font-medium text-sura-ivory">{entry.name}</div>
                        <div className="text-xs text-sura-ivory/50">
                          {isArabic ? 'النقاط' : 'Points'}: {entry.metrics.readingPoints}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ReaderLevelBadge level={entry.level} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-serif text-lg font-bold text-[#7F77DD]">
                      {entry.score.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
