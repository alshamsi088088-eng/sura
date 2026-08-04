import { Link } from 'react-router-dom';
import { Avatar } from '../AvatarUpload';
import { useLocale } from '../../context/LocaleContext';
import type { Circle } from '../../services/studyCircleService';

interface CircleCardProps {
  circle: Circle;
  onJoin?: () => void;
  isMember?: boolean;
}

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

/**
 * Preview card for a study circle in the browse grid.
 */
export function CircleCard({ circle, onJoin, isMember = false }: CircleCardProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const dayNames = isArabic ? DAY_NAMES_AR : DAY_NAMES_EN;

  return (
    <div className="flex flex-col rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-5 transition hover:border-sura-gold/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar url={circle.author.avatar ?? undefined} name={circle.author.name} size="md" />
          <div>
            <h3 className="font-inter text-base font-semibold text-sura-ivory">
              <Link to={`/study-circles/${circle.id}`} className="hover:text-sura-gold">
                {circle.title}
              </Link>
            </h3>
            <p className="text-xs text-sura-ivory/50">{circle.author.name}</p>
          </div>
        </div>
      </div>

      <p className="mb-4 line-clamp-3 font-inter text-sm text-sura-ivory/70">{circle.body}</p>

      <div className="mt-auto flex items-center justify-between border-t border-sura-ivory/10 pt-3">
        <span className="text-xs text-sura-ivory/60">
          👥 {circle.memberCount} {isArabic ? 'عضو' : 'members'}
        </span>
        {isMember ? (
          <Link
            to={`/study-circles/${circle.id}`}
            className="rounded-full bg-sura-teal px-4 py-1.5 text-xs font-semibold text-sura-navy hover:opacity-90"
          >
            {isArabic ? 'ادخل' : 'Open'}
          </Link>
        ) : onJoin ? (
          <button
            type="button"
            onClick={onJoin}
            className="rounded-full border border-sura-gold/50 px-4 py-1.5 text-xs font-semibold text-sura-gold hover:bg-sura-gold/10"
          >
            {isArabic ? 'انضم' : 'Join'}
          </button>
        ) : (
          <Link
            to={`/study-circles/${circle.id}`}
            className="rounded-full border border-sura-gold/50 px-4 py-1.5 text-xs font-semibold text-sura-gold hover:bg-sura-gold/10"
          >
            {isArabic ? 'عرض' : 'View'}
          </Link>
        )}
      </div>
    </div>
  );
}

export default CircleCard;
