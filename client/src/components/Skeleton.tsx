import { memo, ReactNode } from 'react';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  count?: number;
}

function getVariantClasses(variant: SkeletonVariant) {
  switch (variant) {
    case 'circular':
      return 'rounded-full';
    case 'rectangular':
      return 'rounded-none';
    case 'rounded':
      return 'rounded-lg';
    case 'text':
    default:
      return 'rounded';
  }
}

function getAnimationClasses(animation: SkeletonProps['animation']) {
  switch (animation) {
    case 'wave':
      return 'animate-wave';
    case 'none':
      return '';
    case 'pulse':
    default:
      return 'animate-pulse';
  }
}

function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'pulse',
  count = 1
}: SkeletonProps) {
  const baseClasses = `bg-sura-dark/30 ${getVariantClasses(variant)} ${getAnimationClasses(animation)}`;
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  if (count > 1) {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={baseClasses}
            style={i === 0 ? style : { ...style, marginTop: 8 }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// Preset skeleton components for common use cases
interface CardSkeletonProps {
  hasImage?: boolean;
  lines?: number;
}

function CardSkeleton({ hasImage = true, lines = 3 }: CardSkeletonProps) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading content">
      {hasImage && (
        <Skeleton variant="rounded" height={180} />
      )}
      <Skeleton variant="text" width="70%" height={20} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height={16}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading article">
      <Skeleton variant="text" width="80%" height={32} />
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width={100} height={16} />
      </div>
      <Skeleton variant="rectangular" height={300} />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width="100%"
          height={16}
        />
      ))}
      <span className="sr-only">Loading article...</span>
    </div>
  );
}

function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton variant="rounded" width={60} height={60} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" height={18} />
            <Skeleton variant="text" width="40%" height={14} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading list...</span>
    </div>
  );
}

export { Skeleton, CardSkeleton, ArticleSkeleton, ListSkeleton };
export default Skeleton;