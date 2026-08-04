import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import type { SeriesListItem } from '../services/seriesService';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-green-400 border-green-400/30 bg-green-400/10',
  intermediate: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  advanced: 'text-red-400 border-red-400/30 bg-red-400/10',
};

interface SeriesCardProps {
  series: SeriesListItem;
}

export function SeriesCard({ series }: SeriesCardProps) {
  const { locale } = useLocale();
  const difficultyColor = DIFFICULTY_COLORS[series.difficulty] || 'text-sura-ink/60 border-white/10 bg-white/5';

  return (
    <Link
      to={`/series/${encodeURIComponent(series.slug)}`}
      className="group block rounded-3xl border border-sura-line bg-sura-canvas p-6 transition hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Cover Image */}
      {series.coverImage && (
        <div className="mb-4 overflow-hidden rounded-2xl">
          <img
            src={series.coverImage}
            alt={series.title}
            className="h-40 w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      {/* Category & Difficulty */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs uppercase tracking-[0.3em] text-sura-teal">{series.category}</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${difficultyColor}`}>
          {series.difficulty}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-sura-ink group-hover:text-sura-gold transition-colors">
        {series.title}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm leading-6 text-sura-navy/70 line-clamp-2">
        {series.description}
      </p>

      {/* Meta */}
      <div className="mt-4 flex items-center justify-between text-xs text-sura-navy/60">
        <span>{series.itemCount} {locale === 'ar' ? 'مقال' : series.itemCount === 1 ? 'item' : 'items'}</span>
        <span>{series.estimatedReadingTime}</span>
      </div>

      {/* Author */}
      <div className="mt-3 text-xs text-sura-navy/50">
        {locale === 'ar' ? 'بواسطة' : 'By'} {series.authorName}
      </div>

      {/* Progress Bar */}
      {series.progress !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-sura-gold font-medium">{series.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sura-ivory/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sura-gold to-purple-500 transition-all duration-500"
              style={{ width: `${series.progress}%` }}
            />
          </div>
          {/* Milestone markers */}
          <div className="flex justify-between mt-1">
            {[0, 25, 50, 75, 100].map((milestone) => (
              <div
                key={milestone}
                className={`h-1.5 w-1.5 rounded-full ${
                  series.progress! >= milestone ? 'bg-sura-gold' : 'bg-sura-ivory/10'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
