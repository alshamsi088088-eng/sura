import { useSeoTags } from './useSeoTags';

export function usePageMetadata(title: string, description: string, canonicalUrl?: string) {
  useSeoTags({
    title,
    description,
    canonicalUrl: canonicalUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    openGraph: {
      type: 'website',
    },
    twitter: {
      cardType: 'summary_large_image',
    },
  });
}


