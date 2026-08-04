import { useLocale } from '../../context/LocaleContext';

const LEVEL_META: Record<string, { labelEn: string; labelAr: string; color: string }> = {
  BRONZE: { labelEn: 'Bronze', labelAr: 'برونزي', color: '#CD7F32' },
  SILVER: { labelEn: 'Silver', labelAr: 'فضي', color: '#C0C0C0' },
  GOLD: { labelEn: 'Gold', labelAr: 'ذهبي', color: '#FFD700' },
  DIAMOND: { labelEn: 'Diamond', labelAr: 'ماسي', color: '#7F77DD' },
  LEGEND: { labelEn: 'Legend', labelAr: 'أسطوري', color: '#F87171' },
};

interface ReaderLevelBadgeProps {
  level?: string;
  size?: 'sm' | 'md';
}

export function ReaderLevelBadge({ level = 'BRONZE', size = 'md' }: ReaderLevelBadgeProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const meta = LEVEL_META[level] || LEVEL_META.BRONZE;

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass}`}
      style={{
        color: meta.color,
        backgroundColor: `${meta.color}1F`,
        border: `1px solid ${meta.color}55`,
      }}
      title={isArabic ? meta.labelAr : meta.labelEn}
    >
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {isArabic ? meta.labelAr : meta.labelEn}
    </span>
  );
}
