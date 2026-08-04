import { useLocale } from '../context/LocaleContext';

interface ReadingStreakDisplayProps {
  streak: number;
}

export function ReadingStreakDisplay({ streak }: ReadingStreakDisplayProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  const getStreakEmoji = () => {
    if (streak >= 30) return '⚡';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '💪';
    if (streak >= 1) return '📖';
    return '⏳';
  };

  const getStreakMessage = () => {
    if (streak === 0) return isArabic ? 'ابدأ القراءة اليوم!' : 'Start reading today!';
    if (streak === 1) return isArabic ? 'يوم واحد! حافظ عليه' : '1 day! Keep it up';
    return isArabic
      ? `${streak} أيام متتالية! استمر`
      : `${streak} days in a row! Keep going`;
  };

  const getFlameColor = () => {
    if (streak >= 30) return 'from-orange-500 to-red-600';
    if (streak >= 7) return 'from-orange-400 to-red-500';
    if (streak >= 3) return 'from-yellow-400 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  return (
    <section className="rounded-3xl border border-[#7F77DD]/30 bg-sura-dark/90 p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${getFlameColor()} text-3xl shadow-lg`}
        >
          {getStreakEmoji()}
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-[#7F77DD]">
            {isArabic ? 'سلسلة القراءة' : 'READING STREAK'}
          </div>
          <div className="mt-1 font-serif text-3xl font-bold text-sura-ivory">
            {streak} {isArabic ? 'أيام' : 'days'}
          </div>
          <div className="mt-1 text-sm text-sura-ivory/60">{getStreakMessage()}</div>
        </div>
      </div>

      {/* Streak progress dots */}
      <div className="mt-6 flex items-center gap-2">
        {Array.from({ length: Math.min(streak, 30) }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full ${
              i < 7
                ? 'bg-orange-400'
                : i < 14
                ? 'bg-orange-500'
                : i < 21
                ? 'bg-orange-600'
                : 'bg-red-500'
            }`}
            title={`Day ${i + 1}`}
          />
        ))}
        {streak > 30 && (
          <div className="text-xs text-sura-ivory/50">
            +{streak - 30} {isArabic ? 'أكثر' : 'more'}
          </div>
        )}
      </div>
    </section>
  );
}
